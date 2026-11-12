const assert = require('node:assert/strict')
const { test } = require('node:test')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { createRequire } = require('node:module')
const { collect } = require('../src/sync')

function harness({ definitions = false } = {}) {
	const entry = path.resolve(__dirname, '../src/main.js')
	const load = createRequire(entry)
	const scheduled = new Map()
	const sockets = []
	let timerId = 0
	let Module
	let api
	class Base {
		updateStatus(status) {
			this.connectionStatus = status
		}
		log() {}
		setVariableValues(values) {
			this.values = { ...this.values, ...values }
		}
		checkFeedbacks(...ids) {
			this.checked.push(ids)
		}
		setActionDefinitions(definitions) {
			this.actions = definitions
		}
		setFeedbackDefinitions(definitions) {
			this.feedbacks = definitions
		}
		setPresetDefinitions(definitions) {
			this.presets = definitions
		}
		setVariableDefinitions(definitions) {
			this.variableDefinitions = definitions
		}
	}
	class Socket {
		constructor(url) {
			this.url = url
			sockets.push(this)
		}
		close() {
			this.closed = true
			this.onclose?.()
		}
	}
	const setTimer = (callback) => {
		const id = ++timerId
		scheduled.set(id, callback)
		return id
	}
	vm.runInNewContext(fs.readFileSync(entry, 'utf8'), {
		require(name) {
			if (name === '@companion-module/base')
				return {
					InstanceBase: Base,
					Regex: {},
					InstanceStatus: { Ok: 'ok', Connecting: 'connecting', ConnectionFailure: 'failed' },
					runEntrypoint: (instance) => {
						Module = instance
					},
				}
			if (!definitions && ['./actions', './feedbacks', './presets'].includes(name))
				return (self) => {
					self.rebuilds++
				}
			if (name === './api')
				return {
					StreamPulseApi: class {
						constructor() {
							return api
						}
					},
				}
			if (!definitions && name === './variables')
				return {
					defineVariables() {},
					updateVariables: (self) => {
						self.variableUpdates++
					},
				}
			return load(name)
		},
		WebSocket: Socket,
		setTimeout: setTimer,
		setInterval: setTimer,
		clearTimeout: (id) => scheduled.delete(id),
		clearInterval: (id) => scheduled.delete(id),
		console,
	})
	const instance = new Module()
	instance.config = {}
	instance.checked = []
	instance.rebuilds = 0
	instance.variableUpdates = 0
	const calls = []
	const responses = {
		status: {},
		timers: { timers: {} },
		goals: { items: [] },
		alerts: { queue: { pending: 0 }, rules: [] },
		musicOverlay: { visible: true },
		overlayVisibility: { overlays: [] },
		slideshows: { slideshows: [] },
		videos: { videos: [] },
		cutouts: { cutouts: [] },
		gamePlan: {},
		weather: {},
		matchup: {},
		pollActive: {},
		tournament: {},
		chatActivity: { seq: 0, activity: [], enabled: true },
		overlays: [],
		matchupPresets: {},
		pollPresets: {},
		tournamentPresets: {},
		chatbot: {},
		randomizerPresets: {},
		randomizerButtonPresets: {},
		tierList: {},
		speakers: { speakers: [] },
		placeholders: {},
	}
	instance.api = new Proxy(
		{},
		{
			get:
				(_, name) =>
				async (...args) => {
					calls.push(name)
					const value = responses[name]
					return typeof value === 'function' ? value(...args) : value
				},
		},
	)
	api = instance.api
	return { instance, calls, responses, scheduled, sockets }
}

test('server-shaped timer and page events apply immediately without HTTP and refresh all feedbacks', () => {
	const { instance, calls } = harness()
	instance.handleWebSocketMessage({ type: 'timer-update', data: { timer: { id: 'demo', state: 'running' } } })
	instance.handleWebSocketMessage({
		type: 'custom-overlay-page',
		data: {
			id: 'one',
			page: 'a',
			pages: [{ id: 'a', name: 'Only page', enabled: true }],
			auto: true,
		},
	})
	assert.equal(instance.state.timers.demo.state, 'running')
	assert.equal(instance.state.pages.one.page, 'a')
	assert.equal(instance.state.pages.one.auto, true)
	instance.handleWebSocketMessage({
		type: 'custom-overlay-page',
		data: {
			id: 'one',
			enabled: false,
			pages: [{ id: 'a', name: 'Only page', enabled: true }],
		},
	})
	assert.equal(instance.state.pages.one, undefined)
	assert.equal(calls.length, 0)
	assert.ok(
		instance.checked.every((ids) => ids.length === 0),
		'all feedbacks, including pages/slideshows, are rechecked',
	)
})

test('alert bursts coalesce and use authoritative queue counts for play, skip and clear', async () => {
	const { instance, responses, calls, scheduled } = harness()
	instance.state.alerts = { pending: 7 }
	instance.handleWebSocketMessage({ type: 'alert', data: {} })
	instance.handleWebSocketMessage({ type: 'alert-skip', data: {} })
	instance.handleWebSocketMessage({ type: 'alert-clear', data: {} })
	assert.equal(instance.state.alerts.pending, 7, 'do not guess queue lengths from display events')
	assert.equal(scheduled.size, 1)
	responses.alerts = { queue: { pending: 0, paused: true, muted: true }, rules: [] }
	await instance.flushRefresh()
	assert.equal(instance.state.alerts.pending, 0)
	assert.equal(instance.state.alerts.muted, true)
	assert.deepEqual(calls, ['alerts'])
})

test('discovery includes single-page overlays and speakers, while heartbeat avoids library requests', async () => {
	const { instance, responses, calls } = harness()
	responses.overlays = [{ id: 'one', name: 'One', pageCount: 1, hasControls: true }]
	responses.overlayPage = { id: 'one', page: 'a', pages: [{ id: 'a', name: 'A', enabled: true }] }
	responses.speakers = { speakers: [{ id: 'badge', name: 'Badge', speakerBadge: { speaker: { name: 'Alex' } } }] }
	await instance.poll()
	assert.equal(instance.state.pages.one.overlayName, 'One')
	assert.equal(instance.state.speakers[0].elementId, 'badge')
	assert.equal(instance.state.speakers[0].overlayId, 'one')
	calls.length = 0
	await instance.poll({ discovery: false })
	assert.ok(calls.includes('overlayPage'))
	for (const name of ['overlays', 'speakers', 'matchupPresets', 'pollPresets', 'chatbot', 'randomizerPresets']) {
		assert.ok(!calls.includes(name), `${name} should not be fetched on the fast heartbeat`)
	}
})

test('Community indexing status refreshes during discovery and clears on endpoint failure', async () => {
	const { instance, responses, calls } = harness()
	responses.communityInsightsStatus = { enabled: true, phase: 'scanning' }
	await instance.poll()
	assert.equal(instance.state.communityInsights.phase, 'scanning')
	calls.length = 0
	await instance.poll({ discovery: false })
	assert.equal(calls.includes('communityInsightsStatus'), false)
	responses.communityInsightsStatus = () => {
		throw new Error('Older server')
	}
	await instance.poll()
	assert.equal(instance.state.communityInsights, null)
})

test('real definitions consume discovered speakers, OBS health and live timer snapshots together', async () => {
	const { instance, responses } = harness({ definitions: true })
	responses.status = { obs: { enabled: true, connected: true, sceneSyncEnabled: false } }
	responses.overlays = [{ id: 'one', name: 'One', pageCount: 1, hasControls: true }]
	responses.overlayPage = { id: 'one', page: 'a', pages: [{ id: 'a', name: 'A', enabled: true }] }
	responses.speakers = { speakers: [{ id: 'badge', name: 'Guest', speakerBadge: { speaker: { name: 'Alex' } } }] }
	await instance.poll()
	assert.equal(instance.values.obs_status, 'connected')
	assert.equal(instance.values.speaker_one_badge_name, 'Alex')
	assert.ok(instance.actions.speaker_profile.options[0].choices.some((choice) => choice.id === 'one::badge'))
	assert.equal(instance.feedbacks.page_current.callback({ options: { page: 'one::a' } }), true)
	instance.handleWebSocketMessage({ type: 'timer-update', data: { timer: { id: 'demo', state: 'paused' } } })
	assert.equal(instance.values.timer_demo_state, 'paused')
	assert.ok(instance.variableDefinitions.some((definition) => definition.variableId === 'timer_demo_state'))
})

test('optional failures preserve saved choices and live state, and independent requests are bounded-parallel', async () => {
	const { instance, responses } = harness()
	instance.state.slideshows = [{ overlayId: 'one', elementId: 'slides', name: 'Slides' }]
	responses.slideshows = () => {
		throw new Error('Temporary outage')
	}
	await instance.poll()
	assert.equal(instance.state.online, true)
	assert.equal(instance.state.slideshows[0].elementId, 'slides')
	let active = 0
	let peak = 0
	await collect(
		Array.from({ length: 10 }, () => ({
			run: async () => {
				peak = Math.max(peak, ++active)
				await new Promise((resolve) => setImmediate(resolve))
				active--
				return {}
			},
		})),
	)
	assert.equal(peak, 4)
})

test('HTTP snapshots cannot overwrite newer timer events', async () => {
	const { instance, responses } = harness()
	let release
	responses.timers = () =>
		new Promise((resolve) => {
			release = resolve
		})
	const pending = instance.poll()
	await new Promise((resolve) => setImmediate(resolve))
	instance.handleWebSocketMessage({ type: 'timer-update', data: { timer: { id: 'demo', state: 'paused' } } })
	release({ timers: { demo: { id: 'demo', state: 'running' } } })
	await pending
	assert.equal(instance.state.timers.demo.state, 'paused')
})

test('an alert event invalidates an older poll and a second event during refresh gets a follow-up refresh', async () => {
	const { instance, responses } = harness()
	let release
	responses.alerts = () =>
		new Promise((resolve) => {
			release = resolve
		})
	const pending = instance.poll()
	await new Promise((resolve) => setImmediate(resolve))
	instance.handleWebSocketMessage({ type: 'alert-clear', data: {} })
	release({ queue: { pending: 7 }, rules: [] })
	await pending
	assert.equal(instance.state.alerts, null)
	const refresh = instance.flushRefresh()
	await new Promise((resolve) => setImmediate(resolve))
	instance.handleWebSocketMessage({ type: 'alert-clear', data: {} })
	release({ queue: { pending: 6 }, rules: [] })
	await refresh
	assert.equal(instance.state.alerts, null)
	responses.alerts = { queue: { pending: 0 }, rules: [] }
	await instance.flushRefresh()
	assert.equal(instance.state.alerts.pending, 0)
})

test('reconfiguration and destruction reject old HTTP responses and old socket callbacks', async () => {
	const { instance, responses, sockets, scheduled } = harness()
	let release
	responses.status = () =>
		new Promise((resolve) => {
			release = resolve
		})
	const pending = instance.poll()
	instance.startWebSocket()
	const oldSocket = sockets[0]
	const oldClose = oldSocket.onclose
	const oldMessage = oldSocket.onmessage
	instance.stopPolling()
	instance.poll = async () => {}
	instance.startWebSocket()
	const newSocket = sockets[1]
	newSocket.onopen()
	oldClose()
	oldMessage({ data: JSON.stringify({ type: 'timer-update', data: { timer: { id: 'stale' } } }) })
	assert.equal(instance.ws, newSocket)
	assert.equal(instance.wsConnected, true)
	assert.equal(instance.state.timers.stale, undefined)
	await instance.destroy()
	release({})
	await pending
	assert.equal(instance.state.online, false)
	assert.equal(scheduled.size, 0)
})

test('changing configuration starts a fresh poll and an old request failure cannot disconnect it', async () => {
	const { instance, responses } = harness()
	let rejectOld
	responses.status = () =>
		new Promise((_, reject) => {
			rejectOld = reject
		})
	const oldPoll = instance.poll()
	responses.status = { processStartedAt: 'new-server' }
	await instance.configUpdated({ host: 'new-server', port: '3000' })
	await new Promise((resolve) => setImmediate(resolve))
	assert.equal(instance.state.status.processStartedAt, 'new-server')
	assert.equal(instance.connectionStatus, 'ok')
	rejectOld(new Error('Old server disconnected'))
	await oldPoll
	assert.equal(instance.state.online, true)
	assert.equal(instance.connectionStatus, 'ok')
	await instance.destroy()
})

test('overlay events update speaker choices, remove deleted overlays and rebuild tier item choices promptly', async () => {
	const { instance, responses, calls } = harness()
	instance.handleWebSocketMessage({
		type: 'custom-overlay-update',
		data: {
			id: 'one',
			overlay: {
				name: 'One',
				elements: [{ id: 'badge', name: 'Badge', type: 'speaker-badge', speakerBadge: {} }],
			},
		},
	})
	assert.equal(instance.state.speakers[0].overlayId, 'one')
	instance.handleWebSocketMessage({ type: 'custom-overlay-update', data: { id: 'one', overlay: null } })
	assert.equal(instance.state.speakers.length, 0)
	instance.pendingRefresh.clear()
	responses.tierList = { items: [{ id: 'game', name: 'Game' }], presets: [] }
	const before = instance.rebuilds
	instance.handleWebSocketMessage({ type: 'tier-list:update', data: {} })
	await instance.flushRefresh()
	assert.equal(instance.state.tierList.items[0].id, 'game')
	assert.ok(instance.rebuilds > before)
	assert.deepEqual(calls, ['tierList'])
})
