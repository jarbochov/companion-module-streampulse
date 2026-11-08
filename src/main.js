const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const UpdateActions = require('./actions')
const UpdateFeedbacks = require('./feedbacks')
const UpdatePresets = require('./presets')
const { defineVariables, updateVariables } = require('./variables')
const { StreamPulseApi } = require('./api')
const { collect, jobsFor, overlayPatch, choiceSignature } = require('./sync')

function initialState() {
	return {
		online: false,
		status: null,
		timers: {},
		goals: [],
		rules: [],
		alerts: null,
		pages: {},
		speakers: [],
		overlayList: [],
		slideshows: [],
		videos: [],
		cutouts: [],
		musicOverlayVisible: true,
		overlayVisibility: [],
		poll: null,
		pollPresets: [],
		matchup: null,
		matchupPresets: [],
		tournament: null,
		pollTournament: null,
		tournamentPresets: [],
		tierList: null,
		tierListPresets: [],
		trivia: null,
		triviaPresets: [],
	}
}

class ModuleInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
		this.state = initialState()
		this.generation = 0
		this.revisions = {}
		this.pendingRefresh = new Set()
		this.ws = null
		this.wsConnected = false
	}

	async init(config) {
		this.config = config
		this.updateActions()
		this.updateFeedbacks()
		this.updatePresets()
		defineVariables(this)
		defineVariables(this)
		this.startPolling()
		this.startWebSocket()
	}

	async destroy() {
		this.destroyed = true
		this.stopWebSocket()
		this.stopPolling()
	}

	async configUpdated(config) {
		this.stopWebSocket()
		this.config = config
		this.startPolling()
		this.startWebSocket()
	}

	getConfigFields() {
		return [
			{ type: 'textinput', id: 'host', label: 'StreamPulse host', width: 8, default: 'localhost' },
			{ type: 'textinput', id: 'port', label: 'Port', width: 4, default: '3000', regex: Regex.PORT },
			{
				type: 'number',
				id: 'pollMs',
				label: 'Poll interval when offline (ms)',
				width: 4,
				default: 1500,
				min: 500,
				max: 30000,
			},
			{
				type: 'textinput',
				id: 'placeholders',
				label: 'Placeholders to expose (comma separated, e.g. chatter.top, latest.follower, game.name)',
				width: 12,
				default: '',
			},
		]
	}

	startWebSocket() {
		this.stopWebSocket()
		if (this.destroyed || typeof WebSocket === 'undefined') return
		const host = (this.config.host || 'localhost').trim()
		const url = `ws://${host}:${this.config.port || '3000'}/`
		const generation = this.generation
		try {
			const socket = new WebSocket(url)
			this.ws = socket
			const current = () => !this.destroyed && this.generation === generation && this.ws === socket
			socket.onopen = () => {
				if (!current()) return
				this.wsConnected = true
				this.log('debug', `Connected to StreamPulse WebSocket (${url})`)
				this.poll({ discovery: false })
			}
			socket.onmessage = (event) => {
				if (!current()) return
				try {
					this.handleWebSocketMessage(JSON.parse(event.data))
				} catch {
					/* ignore malformed messages */
				}
			}
			socket.onerror = () => {}
			socket.onclose = () => {
				if (!current()) return
				this.wsConnected = false
				this.ws = null
				this.wsReconnectTimer = setTimeout(() => this.startWebSocket(), 5000)
			}
		} catch {
			this.wsConnected = false
			if (!this.destroyed && this.generation === generation) {
				this.wsReconnectTimer = setTimeout(() => this.startWebSocket(), 5000)
			}
		}
	}

	stopWebSocket() {
		clearTimeout(this.wsReconnectTimer)
		this.wsReconnectTimer = null
		const socket = this.ws
		this.ws = null
		this.wsConnected = false
		if (socket) {
			socket.onopen = socket.onmessage = socket.onerror = socket.onclose = null
			try {
				socket.close()
			} catch {}
		}
	}

	applyPatch(patch, revisions = null) {
		for (const [key, value] of Object.entries(patch)) {
			if (revisions && revisions[key] !== this.revisions[key]) continue
			this.state[key] = value
			this.revisions[key] = (this.revisions[key] || 0) + 1
		}
		if ('chatActivity' in patch && this.state.chatActivity) {
			const chat = this.state.chatActivity
			this.state.chatEnabled = chat.enabled
			this.state.chatHits ||= {}
			const fresh = (chat.activity || []).filter((a) => a.seq > (this.state.chatSeq ?? chat.seq))
			this.state.chatSeq = chat.seq
			for (const activity of fresh) {
				this.state.chatHits[activity.name.toLowerCase()] = Date.now()
				this.state.chatLast = activity
			}
			if (fresh.length) {
				clearTimeout(this.chatFeedbackTimer)
				this.chatFeedbackTimer = setTimeout(() => this.checkFeedbacks('chat_command_used'), 10100)
			}
		}
		const sig = choiceSignature(this.state)
		if (sig !== this.choiceSig) {
			this.choiceSig = sig
			this.updateActions()
			this.updateFeedbacks()
			this.updatePresets()
		}
		updateVariables(this)
		this.checkFeedbacks()
	}

	handleWebSocketMessage(msg) {
		if (this.destroyed || !msg || typeof msg.type !== 'string') return
		const data = msg.data ?? msg
		if (msg.type === 'timer-update' && data.timer?.id) {
			this.applyPatch({ timers: { ...this.state.timers, [data.timer.id]: data.timer } })
		} else if (msg.type === 'timers-snapshot' && data.timers) {
			this.applyPatch({ timers: data.timers })
		} else if (msg.type === 'goals-update' && data.items) {
			this.applyPatch({ goals: data.items })
		} else if (['alert', 'alert-skip', 'alert-clear'].includes(msg.type)) {
			this.scheduleRefresh('alerts')
		} else if (msg.type === 'custom-overlay-page' && data.id) {
			const pages = { ...this.state.pages }
			if (data.enabled === false) delete pages[data.id]
			else
				pages[data.id] = {
					...data,
					overlayName:
						pages[data.id]?.overlayName ||
						this.state.overlayList.find((overlay) => overlay.id === data.id)?.name ||
						data.id,
				}
			this.applyPatch({
				pages,
			})
		} else if (msg.type === 'custom-overlay-update' && data.id) {
			const overlay = data.overlay
			const overlayList = this.state.overlayList.filter((item) => item.id !== data.id)
			const pages = { ...this.state.pages }
			let speakers = this.state.speakers.filter((speaker) => speaker.overlayId !== data.id)
			if (overlay) {
				overlayList.push({
					id: data.id,
					name: overlay.name,
					pageCount: overlay.pages?.enabled ? overlay.pages.items.length : 0,
					hasControls: true,
				})
				speakers = speakers.concat(
					(overlay.elements || [])
						.filter((element) => element.type === 'speaker-badge')
						.map((element) => ({
							...element,
							overlayId: data.id,
							overlayName: overlay.name,
							elementId: element.id,
						})),
				)
			}
			if (!overlay?.pages?.enabled) delete pages[data.id]
			else if (pages[data.id]) pages[data.id] = { ...pages[data.id], overlayName: overlay.name }
			this.applyPatch({ overlayList, speakers, pages })
			this.scheduleRefresh('media')
		} else if (['custom-overlay-video', 'custom-overlay-cutout', 'custom-overlay-slideshow'].includes(msg.type)) {
			this.scheduleRefresh('media')
		} else if (msg.type === 'overlay-visibility' && data.key) {
			const entries = this.state.overlayVisibility
			this.applyPatch({
				overlayVisibility: entries.some((entry) => entry.key === data.key)
					? entries.map((entry) => (entry.key === data.key ? { ...entry, visible: data.visible } : entry))
					: [...entries, data],
			})
		} else if (['poll-update', 'matchup-update', 'tournament-update', 'poll-tournament-update'].includes(msg.type)) {
			const key = {
				'poll-update': 'poll',
				'matchup-update': 'matchup',
				'tournament-update': 'tournament',
				'poll-tournament-update': 'pollTournament',
			}[msg.type]
			const value = msg.data ?? msg.matchup ?? msg.tournament ?? null
			this.applyPatch({
				[key]: value,
				...(key === 'poll' && this.state.status ? { status: { ...this.state.status, poll: value } } : {}),
			})
		} else if (msg.type === 'tournament-view' || msg.type === 'poll-tournament-view') {
			const key = msg.type === 'tournament-view' ? 'tournament' : 'pollTournament'
			if (this.state[key]) {
				this.applyPatch({ [key]: { ...this.state[key], viewSettings: { ...this.state[key].viewSettings, ...data } } })
			}
		} else if (msg.type === 'randomizer-spin') {
			this.applyPatch({ randomizerLast: data, randomizerSpinning: true })
			clearTimeout(this.randomizerSpinTimer)
			this.randomizerSpinTimer = setTimeout(
				() => {
					this.applyPatch({ randomizerSpinning: false })
					this.refreshRandomizerPresets()
				},
				Math.max(3, Number(data.duration) || 6) * 1000,
			)
		} else if (msg.type === 'randomizer-state') {
			this.refreshRandomizerPresets()
		} else if (msg.type.startsWith('tier-list:')) {
			this.refreshTierList()
		} else if (msg.type.startsWith('trivia:')) {
			this.refreshTrivia()
		}
	}

	scheduleRefresh(group) {
		const keys = {
			alerts: ['alerts', 'rules'],
			media: ['musicOverlayVisible', 'overlayVisibility', 'slideshows', 'videos', 'cutouts'],
			tier: ['tierList', 'tierListPresets'],
			trivia: ['trivia', 'triviaPresets'],
			randomizer: ['randomizerPresets'],
		}
		for (const key of keys[group] || []) this.revisions[key] = (this.revisions[key] || 0) + 1
		this.pendingRefresh.add(group)
		if (this.refreshTimer || this.refreshRunning || this.destroyed) return
		this.refreshTimer = setTimeout(() => {
			this.refreshTimer = null
			this.flushRefresh()
		}, 100)
	}

	async flushRefresh() {
		if (this.destroyed || this.refreshRunning || !this.pendingRefresh.size) return
		const generation = this.generation
		const groups = [...this.pendingRefresh]
		this.pendingRefresh.clear()
		this.refreshRunning = true
		const revisions = { ...this.revisions }
		try {
			const patch = await collect(jobsFor(this.api, groups))
			if (!this.destroyed && generation === this.generation) this.applyPatch(patch, revisions)
		} finally {
			if (generation === this.generation) {
				this.refreshRunning = false
				if (this.pendingRefresh.size) this.scheduleRefresh([...this.pendingRefresh][0])
			}
		}
	}

	refreshTierList() {
		this.scheduleRefresh('tier')
	}

	refreshTrivia() {
		this.scheduleRefresh('trivia')
	}

	refreshRandomizerPresets() {
		this.scheduleRefresh('randomizer')
	}

	startPolling() {
		this.stopPolling()
		const host = (this.config.host || 'localhost').trim()
		this.api = new StreamPulseApi(host, this.config.port || '3000')
		this.lastDiscovery = 0
		this.lastPoll = 0
		this.state = initialState()
		this.applyPatch({
			wantedPlaceholders: String(this.config.placeholders || '')
				.split(',')
				.map((key) => key.trim())
				.filter(Boolean),
		})
		this.updateStatus(InstanceStatus.Connecting)
		this.poll()
		const interval = Math.max(500, Number(this.config.pollMs) || 1500)
		this.pollTimer = setInterval(() => {
			if (Date.now() - this.lastPoll >= interval * (this.wsConnected ? 5 : 1)) this.poll({ discovery: false })
		}, interval)
	}

	stopPolling() {
		this.generation++
		for (const timer of ['pollTimer', 'randomizerSpinTimer', 'chatFeedbackTimer', 'refreshTimer']) {
			clearTimeout(this[timer])
			this[timer] = null
		}
		this.pendingRefresh.clear()
		this.polling = false
		this.pollAgain = false
		this.refreshRunning = false
	}

	async poll({ discovery = true } = {}) {
		if (this.destroyed) return
		if (this.polling) {
			this.pollAgain ||= discovery
			return
		}
		this.polling = true
		this.lastPoll = Date.now()
		const generation = this.generation
		const api = this.api
		const revisions = { ...this.revisions }
		const discover = discovery || !this.lastDiscovery || Date.now() - this.lastDiscovery >= 30000
		try {
			const groups = ['core', 'alerts', 'media', 'live', 'tier', 'trivia']
			if (discover) groups.push('discovery', 'randomizer')
			const patch = await collect(jobsFor(api, groups, this.state.wantedPlaceholders))
			if (this.destroyed || generation !== this.generation) return
			const overlays = patch.overlayList || this.state.overlayList
			Object.assign(
				patch,
				await overlayPatch(api, overlays, this.state.pages, this.state.speakers, { speakers: discover }),
			)
			if (this.destroyed || generation !== this.generation) return
			this.applyPatch(patch, revisions)
			if (discover && patch.overlayList) this.lastDiscovery = Date.now()
			this.updateStatus(InstanceStatus.Ok)
		} catch (error) {
			if (this.destroyed || generation !== this.generation) return
			this.applyPatch({ online: false, status: null })
			this.setVariableValues({ streampulse_online: 'no', streampulse_uptime: '' })
			this.updateStatus(InstanceStatus.ConnectionFailure, error.message)
		} finally {
			if (generation === this.generation) {
				this.polling = false
				if (this.pollAgain) {
					this.pollAgain = false
					this.poll()
				}
			}
		}
	}

	updateActions() {
		UpdateActions(this)
	}

	updateFeedbacks() {
		UpdateFeedbacks(this)
	}

	updatePresets() {
		UpdatePresets(this)
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
