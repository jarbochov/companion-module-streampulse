const assert = require('node:assert/strict')
const { test } = require('node:test')
const defineActions = require('../src/actions')
const defineFeedbacks = require('../src/feedbacks')
const definePresets = require('../src/presets')
const { defineVariables, updateVariables } = require('../src/variables')
const { choiceSignature } = require('../src/sync')

function createMock() {
	const requests = []
	const self = {
		state: {
			online: true,
			status: null,
			timers: {},
			goals: [],
			variableSets: [],
			rules: [],
			alerts: null,
			pages: {},
			speakers: [],
			overlayList: [],
			slideshows: [],
			videos: [],
			cutouts: [],
			overlayVisibility: [],
			chatChoices: [],
			obsLayout: {
				layouts: [{ id: 'layout-main', name: 'Main Cam Focus', sceneName: 'Gaming' }],
			},
			creditSuite: {
				enabled: true,
				activeProjectId: 'cinematic-feature',
				projects: [
					{ id: 'cinematic-feature', name: 'Cinematic Feature' },
					{ id: 'quick-roll', name: 'Quick Roll' },
				],
				transport: {
					projectId: 'cinematic-feature',
					projectName: 'Cinematic Feature',
					playing: true,
					state: 'playing',
					timeSec: 15,
					durationSec: 80,
					remainingSec: 65,
					progressPct: 19,
					speedRate: 1.5,
				},
			},
			operator: {
				activeProfileId: 'op-live',
				profiles: [
					{ id: 'op-live', name: 'Live Show' },
					{ id: 'op-intermission', name: 'Intermission' },
				],
			},
			multiplayerBingo: {
				session: {
					locked: false,
					hidden: false,
					focusedCardId: 'card-1',
					cards: [
						{ id: 'card-1', playerName: 'Alex', hasBingo: true },
						{ id: 'card-2', playerName: 'Sam', hasBingo: false },
					],
				},
			},
		},
		api: {
			request: async (path, opts) => {
				requests.push({ path, opts })
				return { ok: true }
			},
		},
		async parseVariablesInString(v) {
			return v
		},
		setActionDefinitions(d) {
			self.actions = d
		},
		setFeedbackDefinitions(d) {
			self.feedbacks = d
		},
		setPresetDefinitions(d) {
			self.presets = d
		},
		setVariableDefinitions(d) {
			self.variableDefinitions = d
		},
		setVariableValues(v) {
			self.variableValues = v
		},
		checkFeedbacks() {},
		async poll() {},
		logs: [],
		log(level, message) {
			self.logs.push({ level, message })
		},
	}
	return { self, requests }
}

test('Credit Suite: actions, variables, feedbacks, presets and choiceSignature follow live state', async () => {
	const { self, requests } = createMock()
	defineActions(self)
	defineFeedbacks(self)
	definePresets(self)
	defineVariables(self)
	updateVariables(self)

	assert.equal(self.variableValues.credit_suite_playing, 'yes')
	assert.equal(self.variableValues.credit_suite_state, 'playing')
	assert.equal(self.variableValues.credit_suite_project_id, 'cinematic-feature')
	assert.equal(self.variableValues.credit_suite_project, 'Cinematic Feature')
	assert.equal(self.variableValues.credit_suite_time, '0:15')
	assert.equal(self.variableValues.credit_suite_duration, '1:20')
	assert.equal(self.variableValues.credit_suite_remaining, '1:05')
	assert.equal(self.variableValues.credit_suite_progress, '19%')
	assert.equal(self.variableValues.credit_suite_speed, '1.5x')

	assert.equal(self.feedbacks.credit_suite_playing.callback(), true)
	assert.equal(self.feedbacks.credit_suite_active_project.callback({ options: { project: 'cinematic-feature' } }), true)
	assert.equal(self.feedbacks.credit_suite_active_project.callback({ options: { project: 'quick-roll' } }), false)

	await self.actions.credit_suite_transport.callback({ options: { action: 'restart', project: 'quick-roll' } })
	await self.actions.credit_suite_activate.callback({ options: { project: 'quick-roll' } })
	await self.actions.credit_suite_jump.callback({
		options: { mode: 'marker', target: 'Cast', play: 'true', project: '' },
	})
	await self.actions.credit_suite_jump.callback({
		options: { mode: 'seek', target: '22.5', play: 'false', project: '' },
	})
	await self.actions.credit_suite_speed.callback({ options: { rate: '2', project: '' } })

	assert.deepEqual(
		requests.map((r) => [r.path, r.opts.body]),
		[
			['/api/credit-suite/restart', { projectId: 'quick-roll' }],
			['/api/credit-suite/activate', { projectId: 'quick-roll' }],
			['/api/credit-suite/jump', { marker: 'Cast', play: true }],
			['/api/credit-suite/seek', { t: 22.5, play: false }],
			['/api/credit-suite/speed', { rate: 2 }],
		],
	)

	assert.equal(self.presets.credit_suite_toggle.category, 'Credit Suite')
	assert.equal(self.presets.credit_suite_restart.category, 'Credit Suite')

	const sigBefore = choiceSignature(self.state)
	self.state.creditSuite.projects.push({ id: 'finale', name: 'Season Finale' })
	assert.notEqual(choiceSignature(self.state), sigBefore)
})

test('OBS Layout, Operator Mode and Multiplayer Bingo: actions, feedbacks and variables work cleanly', async () => {
	const { self, requests } = createMock()
	defineActions(self)
	defineFeedbacks(self)
	defineVariables(self)
	updateVariables(self)

	assert.equal(self.variableValues.obs_layout_count, '1')
	assert.equal(self.variableValues.operator_profile_id, 'op-live')
	assert.equal(self.variableValues.operator_profile, 'Live Show')
	assert.equal(self.variableValues.multiplayer_bingo_players, '2')
	assert.equal(self.variableValues.multiplayer_bingo_locked, 'no')
	assert.equal(self.variableValues.multiplayer_bingo_hidden, 'no')
	assert.equal(self.variableValues.multiplayer_bingo_focused, 'Alex')
	assert.equal(self.variableValues.multiplayer_bingo_winners, '1')

	assert.equal(self.feedbacks.operator_profile_active.callback({ options: { profile: 'op-live' } }), true)
	assert.equal(self.feedbacks.multiplayer_bingo_locked.callback(), false)
	assert.equal(self.feedbacks.multiplayer_bingo_hidden.callback(), false)

	await self.actions.obs_layout_apply.callback({ options: { layout: 'layout-main', durationMs: 650 } })
	await self.actions.operator_profile_select.callback({ options: { profile: 'op-intermission', customTarget: '' } })
	await self.actions.multiplayer_bingo_flags.callback({ options: { field: 'locked', mode: 'toggle' } })
	await self.actions.multiplayer_bingo_focus.callback({ options: { card: 'card-2', toggle: true } })
	// Unconfirmed board reset should warn and NOT send request
	await self.actions.multiplayer_bingo_board.callback({ options: { action: 'reset', confirm: false } })
	await self.actions.multiplayer_bingo_board.callback({ options: { action: 'shuffle', confirm: true } })

	assert.deepEqual(
		requests.map((r) => [r.path, r.opts.body]),
		[
			['/api/obs-layout/layouts/apply', { id: 'layout-main', durationMs: 650 }],
			['/api/operator/profile/select', { id: 'op-intermission' }],
			['/api/multiplayer-bingo/flags', { locked: true }],
			['/api/multiplayer-bingo/focus', { card: 'card-2', toggle: true }],
			['/api/multiplayer-bingo/shuffle', undefined],
		],
	)
})
