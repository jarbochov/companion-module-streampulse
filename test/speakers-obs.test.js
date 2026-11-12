const assert = require('node:assert/strict')
const { test } = require('node:test')
const { StreamPulseApi } = require('../src/api')
const defineFeedbacks = require('../src/feedbacks')
const { defineVariables, updateVariables } = require('../src/variables')
const {
	PROFILE_FIELDS,
	VISIBILITY_FIELDS,
	speakerActions,
	speakerPresets,
	speakerChoices,
	speakerVariablePrefix,
} = require('../src/speakers')

function createModuleMock() {
	const entry = {
		id: 'badge-1',
		elementId: 'badge-1',
		name: 'Guest',
		page: 'interview',
		overlayId: 'show-1',
		overlayName: 'Interview',
		speakerBadge: {
			speaker: {
				name: 'Jordan Lee',
				avatarSrc: '/media/guest.png',
				handle: '@guest',
				pronouns: 'they/them',
				showAvatar: true,
				showHandle: false,
				showPronouns: true,
				callIn: { enabled: false, statusText: 'ON THE LINE', location: 'Studio B', showLocation: true },
			},
			audio: { inputName: 'Guest Mic', thresholdDb: -40, holdMs: 300 },
			reaction: { visualizer: 'bars' },
			layout: 'horizontal',
		},
	}

	const self = {
		state: {
			online: true,
			status: {
				obs: {
					enabled: true,
					connected: true,
					connecting: false,
					sceneSyncEnabled: false,
					currentProgramScene: 'Interview',
				},
			},
			speakers: [entry],
			timers: {},
			goals: [],
			pages: {},
			slideshows: [],
		},
		patches: [],
		logs: [],
		polls: 0,
		reads: 0,
		api: {
			async speakers(overlayId) {
				assert.equal(overlayId, 'show-1')
				self.reads++
				return self.snapshot
			},
			async updateSpeaker(overlayId, elementId, patch) {
				self.patches.push({ overlayId, elementId, patch })
				return self.snapshot
			},
		},
		async parseVariablesInString(value) {
			return value.replace('$(test:name)', 'Casey Park')
		},
		async poll() {
			self.polls++
		},
		checkFeedbacks() {},
		log(level, message) {
			self.logs.push({ level, message })
		},
		setFeedbackDefinitions(definitions) {
			self.feedbacks = definitions
		},
		setVariableDefinitions(definitions) {
			self.definitions = definitions
		},
		setVariableValues(values) {
			self.values = values
		},
	}
	self.snapshot = { id: 'show-1', name: 'Interview', revision: 3, speakers: [structuredClone(entry)] }
	return self
}

test('milestone estimate variables follow pace and clear when estimates are unavailable', () => {
	const self = createModuleMock()
	self.state.status.milestones = {
		milestones: [
			{ type: 'streams', pace: { days: 12 } },
			{ type: 'hours', pace: { days: 30 } },
			{ type: 'chatters', pace: null },
		],
	}
	defineVariables(self)
	updateVariables(self)
	assert.ok(self.definitions.some((definition) => definition.variableId === 'milestone_stream_estimate_days'))
	assert.equal(self.values.milestone_stream_estimate_days, 12)
	assert.equal(self.values.milestone_hours_estimate_days, 30)
	assert.equal(self.values.milestone_chatters_estimate_days, '')
	self.state.status.milestones = {}
	updateVariables(self)
	assert.equal(self.values.milestone_stream_estimate_days, '')
})

test('Community status variable and feedback handle indexing, older servers and offline state', async () => {
	const self = createModuleMock()
	self.state.communityInsights = { enabled: true, phase: 'scanning' }
	defineVariables(self)
	updateVariables(self)
	await defineFeedbacks(self)
	assert.ok(self.definitions.some((definition) => definition.variableId === 'community_insights_status'))
	assert.equal(self.values.community_insights_status, 'scanning')
	assert.equal(self.feedbacks.community_insights_status.callback({ options: { status: 'scanning' } }), true)
	self.state.communityInsights = null
	updateVariables(self)
	assert.equal(self.values.community_insights_status, 'unavailable')
	self.state.communityInsights = { phase: 'ready' }
	self.state.online = false
	updateVariables(self)
	assert.equal(self.values.community_insights_status, 'unavailable')
	assert.equal(self.feedbacks.community_insights_status.callback({ options: { status: 'ready' } }), false)
})

test('speaker API methods encode overlay IDs and send minimal PATCH; startSession uses POST', async () => {
	const api = new StreamPulseApi('localhost', 3000)
	const calls = []
	api.request = async (...args) => {
		calls.push(args)
	}
	await api.speakers('show / guest')
	await api.updateSpeaker('show / guest', 'badge/1', { speaker: { name: 'Casey' } })
	await api.startSession()
	assert.deepEqual(calls, [
		['/api/custom-overlays/show%20%2F%20guest/speakers'],
		[
			'/api/custom-overlays/show%20%2F%20guest/speakers',
			{
				method: 'PATCH',
				body: { speaker: { name: 'Casey' }, element: 'badge/1' },
			},
		],
		['/api/start-session', { method: 'POST' }],
	])
})

test('speaker profile and audio updates preserve unrelated fields and accept variables', async () => {
	const self = createModuleMock()
	const actions = speakerActions(self)
	const before = structuredClone(self.state.speakers[0].speakerBadge)
	for (const { id } of PROFILE_FIELDS) {
		await actions.speaker_profile.callback({
			options: { speaker: 'show-1::badge-1', field: id, value: '$(test:name)' },
		})
		assert.deepEqual(
			self.patches.at(-1).patch,
			id.startsWith('callIn.')
				? { speaker: { callIn: { [id.slice(7)]: 'Casey Park' } } }
				: { speaker: { [id]: 'Casey Park' } },
		)
	}
	await actions.speaker_audio_source.callback({ options: { speaker: 'show-1::badge-1', inputName: '$(test:name)' } })
	assert.deepEqual(self.patches.at(-1), {
		overlayId: 'show-1',
		elementId: 'badge-1',
		patch: { audio: { inputName: 'Casey Park' } },
	})
	await actions.speaker_profile.callback({ options: { speaker: 'show-1::badge-1', field: 'handle', value: '' } })
	assert.deepEqual(self.patches.at(-1).patch, { speaker: { handle: '' } })
	assert.deepEqual(self.state.speakers[0].speakerBadge, before)
	assert.equal(self.reads, 0)
	assert.equal(self.polls, PROFILE_FIELDS.length + 2)
	assert.deepEqual(self.logs, [])
})

test('visibility set sends booleans only and toggle reads fresh server state', async () => {
	const self = createModuleMock()
	const actions = speakerActions(self)
	for (const { id } of VISIBILITY_FIELDS) {
		for (const state of ['show', 'hide']) {
			await actions.speaker_visibility.callback({ options: { speaker: 'show-1::badge-1', field: id, state } })
			const expected = state === 'show'
			assert.deepEqual(
				self.patches.at(-1).patch,
				id.startsWith('callIn.')
					? { speaker: { callIn: { [id.slice(7)]: expected } } }
					: { speaker: { [id]: expected } },
			)
		}
	}
	assert.equal(self.reads, 0)
	self.snapshot.speakers[0].speakerBadge.speaker.showHandle = true
	await actions.speaker_visibility.callback({
		options: { speaker: 'show-1::badge-1', field: 'showHandle', state: 'toggle' },
	})
	assert.equal(self.reads, 1)
	assert.deepEqual(self.patches.at(-1).patch, { speaker: { showHandle: false } })
	assert.equal(
		self.state.speakers[0].speakerBadge.speaker.showHandle,
		true,
		'PATCH snapshot replaces stale local state',
	)
	assert.equal(self.state.speakers[0].elementId, 'badge-1')
})

test('speaker actions reject missing badges and unsupported fields without writing', async () => {
	const self = createModuleMock()
	const actions = speakerActions(self)
	await actions.speaker_profile.callback({ options: { speaker: '', field: 'name', value: 'Casey' } })
	await actions.speaker_profile.callback({
		options: { speaker: 'show-1::badge-1', field: 'layout', value: 'compact-pill' },
	})
	await actions.speaker_visibility.callback({
		options: { speaker: 'show-1::badge-1', field: 'showAvatar', state: 'invalid' },
	})
	self.snapshot.speakers = []
	await actions.speaker_visibility.callback({
		options: { speaker: 'show-1::badge-1', field: 'showAvatar', state: 'toggle' },
	})
	assert.equal(self.patches.length, 0)
	assert.equal(self.polls, 0)
	assert.equal(self.logs.length, 4)
	assert.ok(self.logs.every(({ level }) => level === 'error'))
})

test('simultaneous visibility toggles serialize the read and write and restore the original state', async () => {
	const self = createModuleMock()
	const server = structuredClone(self.snapshot)
	self.api.speakers = async () => {
		const snapshot = structuredClone(server)
		await Promise.resolve()
		return snapshot
	}
	self.api.updateSpeaker = async (_overlayId, _elementId, patch) => {
		self.patches.push(patch)
		await Promise.resolve()
		Object.assign(server.speakers[0].speakerBadge.speaker, patch.speaker)
		return structuredClone(server)
	}
	const callback = speakerActions(self).speaker_visibility.callback
	const options = { speaker: 'show-1::badge-1', field: 'showAvatar', state: 'toggle' }
	await Promise.all([callback({ options }), callback({ options })])
	assert.deepEqual(self.patches, [{ speaker: { showAvatar: false } }, { speaker: { showAvatar: true } }])
	assert.equal(server.speakers[0].speakerBadge.speaker.showAvatar, true)
	assert.equal(self.state.speakers[0].speakerBadge.speaker.showAvatar, true)
	assert.equal(self.polls, 2)
	assert.deepEqual(self.logs, [])
})

test('a toggle read completing after reconfiguration does not write or poll either connection', async () => {
	const self = createModuleMock()
	let releaseRead
	let readStarted
	const started = new Promise((resolve) => {
		readStarted = resolve
	})
	self.api.speakers = () => {
		readStarted()
		return new Promise((resolve) => {
			releaseRead = resolve
		})
	}
	const operation = speakerActions(self).speaker_visibility.callback({
		options: { speaker: 'show-1::badge-1', field: 'showAvatar', state: 'toggle' },
	})
	await started
	let newWrites = 0
	self.api = {
		async updateSpeaker() {
			newWrites++
		},
	}
	releaseRead(self.snapshot)
	await operation
	assert.equal(self.patches.length, 0)
	assert.equal(newWrites, 0)
	assert.equal(self.polls, 0)
	assert.equal(self.state.speakers[0].speakerBadge.speaker.showAvatar, true)
	assert.match(self.logs[0].message, /connection changed/)
})

test('an old PATCH response cannot update state after reconfiguration', async () => {
	const self = createModuleMock()
	let releaseWrite
	let writeStarted
	const started = new Promise((resolve) => {
		writeStarted = resolve
	})
	self.api.updateSpeaker = () => {
		writeStarted()
		return new Promise((resolve) => {
			releaseWrite = resolve
		})
	}
	const operation = speakerActions(self).speaker_profile.callback({
		options: { speaker: 'show-1::badge-1', field: 'name', value: 'Casey Park' },
	})
	await started
	self.api = {}
	self.snapshot.speakers[0].speakerBadge.speaker.name = 'Casey Park'
	releaseWrite(self.snapshot)
	await operation
	assert.equal(self.state.speakers[0].speakerBadge.speaker.name, 'Jordan Lee')
	assert.equal(self.polls, 0)
	assert.match(self.logs[0].message, /connection changed/)
})

test('speaker PATCH snapshots use applyPatch to protect revisions and preserve other overlays', async () => {
	const self = createModuleMock()
	self.state.speakers.push({ ...self.state.speakers[0], overlayId: 'other-show' })
	const applied = []
	self.applyPatch = (patch) => {
		applied.push(patch)
		Object.assign(self.state, patch)
	}
	self.snapshot.speakers[0].speakerBadge.speaker.name = 'Casey Park'
	await speakerActions(self).speaker_profile.callback({
		options: { speaker: 'show-1::badge-1', field: 'name', value: 'Casey Park' },
	})
	assert.equal(applied.length, 1)
	assert.equal(applied[0].speakers.length, 2)
	assert.equal(applied[0].speakers[0].overlayId, 'other-show')
	assert.equal(applied[0].speakers[1].speakerBadge.speaker.name, 'Casey Park')
	assert.equal(applied[0].speakers[1].elementId, 'badge-1')
	assert.equal(self.polls, 1)
})

test('OBS feedback distinguishes connection, errors and optional Scene Sync', async () => {
	const self = createModuleMock()
	await defineFeedbacks(self)
	const feedbacks = self.feedbacks
	const matches = (status) => feedbacks.obs_status.callback({ options: { status } })
	assert.equal(feedbacks.obs_connected.callback(), true)
	assert.equal(matches('connected'), true)
	assert.equal(feedbacks.obs_scene_sync.callback({ options: { enabled: false } }), true)
	self.state.status.obs.connected = false
	self.state.status.obs.connecting = true
	assert.equal(feedbacks.obs_connecting.callback(), true)
	assert.equal(matches('connecting'), true)
	self.state.status.obs.connecting = false
	assert.equal(matches('disconnected'), true)
	self.state.status.obs.lastError = 'Connection refused'
	assert.equal(matches('error'), true)
	self.state.status.obs.enabled = false
	assert.equal(matches('disabled'), true)
	self.state.online = false
	assert.equal(matches('unavailable'), true)
	assert.equal(feedbacks.obs_connected.callback(), false)
	assert.equal(feedbacks.obs_scene_sync.callback({ options: { enabled: false } }), false)
	delete self.state.status.obs
	assert.equal(matches('unavailable'), true)
})

test('speaker feedback and variables expose identity and flags without audio meter values', async () => {
	const self = createModuleMock()
	await defineFeedbacks(self)
	const visibility = self.feedbacks.speaker_visibility.callback
	const identity = self.feedbacks.speaker_identity.callback
	assert.equal(visibility({ options: { speaker: 'show-1::badge-1', field: 'showAvatar' } }), true)
	assert.equal(visibility({ options: { speaker: 'show-1::badge-1', field: 'showHandle' } }), false)
	assert.equal(visibility({ options: { speaker: 'show-1::badge-1', field: 'callIn.enabled' } }), false)
	assert.equal(visibility({ options: { speaker: 'missing', field: 'showAvatar' } }), false)
	assert.equal(identity({ options: { speaker: 'show-1::badge-1', field: 'name', value: 'Jordan Lee' } }), true)
	assert.equal(identity({ options: { speaker: 'show-1::badge-1', field: 'callIn.location', value: 'Studio B' } }), true)
	assert.equal(identity({ options: { speaker: 'show-1::badge-1', field: 'name', value: 'Someone Else' } }), false)
	defineVariables(self)
	updateVariables(self)
	assert.ok(Array.isArray(self.definitions))
	const prefix = speakerVariablePrefix(self.state.speakers[0])
	assert.equal(self.values[`${prefix}_name`], 'Jordan Lee')
	assert.equal(self.values[`${prefix}_location`], 'Studio B')
	assert.equal(self.values[`${prefix}_audio_source`], 'Guest Mic')
	assert.equal(self.values[`${prefix}_show_avatar`], 'yes')
	assert.equal(self.values[`${prefix}_show_handle`], 'no')
	assert.equal(self.values[`${prefix}_call_in`], 'no')
	assert.equal(self.values.obs_connected, 'yes')
	assert.equal(self.values.obs_status, 'connected')
	assert.equal(self.values.obs_scene_sync, 'no')
	assert.equal(self.values.obs_scene, 'Interview')
	assert.ok(!Object.keys(self.values).some((key) => /meter|volume|decibel/i.test(key)))
	self.state.online = false
	updateVariables(self)
	assert.equal(self.values.obs_status, 'unavailable')
	assert.equal(self.values.obs_connected, 'no')
	assert.equal(self.values.obs_scene, '')
	self.state.online = true
	self.state.status = null
	updateVariables(self)
	assert.equal(self.values.obs_status, 'unavailable')
	assert.equal(self.values.obs_connected, 'no')
	assert.equal(self.values.obs_connecting, 'no')
	assert.equal(self.values.obs_scene_sync, 'no')
	assert.equal(self.values.obs_scene, '')
	assert.equal(self.values.obs_last_error, '')
	assert.equal(self.values.obs_active_engine, '')
})

test('missing speaker state is safe and preset IDs are stable as profiles change', async () => {
	const self = createModuleMock()
	const first = speakerPresets(self)
	const visibilityPresets = Object.values(first).filter((preset) => preset.category === 'Speaker Badges')
	assert.equal(visibilityPresets.length, VISIBILITY_FIELDS.length)
	for (const preset of visibilityPresets) {
		assert.equal(preset.steps[0].down[0].actionId, 'speaker_visibility')
		assert.equal(preset.feedbacks[0].feedbackId, 'speaker_visibility')
		assert.equal(preset.steps[0].down[0].options.speaker, 'show-1::badge-1')
	}
	assert.equal(first.obs_health_status.feedbacks[1].feedbackId, 'obs_connected')
	self.state.speakers[0].speakerBadge.speaker.name = 'Casey Park'
	assert.deepEqual(Object.keys(speakerPresets(self)), Object.keys(first))
	delete self.state.speakers
	assert.deepEqual(speakerChoices(self), [{ id: '', label: '(no speaker badges found)' }])
	await defineFeedbacks(self)
	defineVariables(self)
	updateVariables(self)
	assert.ok(!Object.keys(self.values).some((key) => key.startsWith('speaker_')))
	assert.equal(Object.keys(speakerPresets(self)).length, 2)
})
