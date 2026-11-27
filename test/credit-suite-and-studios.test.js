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
				runbooks: [
					{
						id: 'pre-show',
						name: 'Pre-Show Checklist',
						items: [
							{ id: 'cue-1', kind: 'task', text: 'Check mic levels', done: false },
							{ id: 'cue-2', kind: 'task', text: 'Start recording', done: true },
						],
					},
				],
			},
			multiplayerBingo: {
				activePackId: 'default-race',
				activePack: {
					id: 'default-race',
					name: 'Default Race',
					prompts: ['Boss defeated', 'Found secret room', 'No-hit stage'],
				},
				packs: [
					{ id: 'default-race', name: 'Default Race' },
					{ id: 'speedrun-pack', name: 'Speedrun Pack' },
				],
				session: {
					locked: false,
					hidden: false,
					fourCorners: true,
					confirmCalls: true,
					pendingCalls: [{ prompt: 1, cardId: 'card-1' }],
					focusedCardId: 'card-1',
					cards: [
						{ id: 'card-1', playerName: 'Alex', hasBingo: true },
						{ id: 'card-2', name: 'Sam', hasBingo: false },
					],
				},
			},
			bingoDisplays: [{ id: 'disp-bingo-1', name: 'Main Bingo Card', kind: 'bingo' }],
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

test('Operator Runbooks, Multiplayer Bingo full parity, OBS Aspect, and Display Library Bingo work cleanly', async () => {
	const { self, requests } = createMock()
	defineActions(self)
	defineFeedbacks(self)
	definePresets(self)
	defineVariables(self)
	updateVariables(self)

	// New variables
	assert.equal(self.variableValues.operator_runbooks_count, '1')
	assert.equal(self.variableValues.mp_bingo_four_corners, 'yes')
	assert.equal(self.variableValues.mp_bingo_confirm_calls, 'yes')
	assert.equal(self.variableValues.mp_bingo_pending_count, '1')

	// New feedbacks
	assert.equal(self.feedbacks.mp_bingo_four_corners.callback(), true)
	assert.equal(self.feedbacks.mp_bingo_confirm_calls.callback(), true)
	assert.equal(self.feedbacks.mp_bingo_pending_calls.callback(), true)

	// Object-map pendingCalls also supported
	self.state.multiplayerBingo.session.pendingCalls = { 0: { cardId: 'card-1' }, 2: { cardId: 'card-2' } }
	updateVariables(self)
	assert.equal(self.variableValues.mp_bingo_pending_count, '2')
	assert.equal(self.feedbacks.mp_bingo_pending_calls.callback(), true)

	// Empty pendingCalls clears feedback
	self.state.multiplayerBingo.session.pendingCalls = []
	updateVariables(self)
	assert.equal(self.variableValues.mp_bingo_pending_count, '0')
	assert.equal(self.feedbacks.mp_bingo_pending_calls.callback(), false)

	// Operator runbook actions
	await self.actions.operator_runbook_toggle.callback({
		options: { runbook: 'pre-show', customRunbook: '', targetType: 'index', index: 2, itemId: '', done: 'true' },
	})
	await self.actions.operator_runbook_toggle.callback({
		options: {
			runbook: 'pre-show',
			customRunbook: '',
			targetType: 'itemId',
			index: 1,
			itemId: 'cue-1',
			done: 'toggle',
		},
	})
	await self.actions.operator_runbook_reset.callback({
		options: { runbook: 'pre-show', customRunbook: '', confirm: false },
	})
	await self.actions.operator_runbook_reset.callback({
		options: { runbook: 'pre-show', customRunbook: '', confirm: true },
	})

	// Multiplayer Bingo new actions
	await self.actions.multiplayer_bingo_flags.callback({ options: { field: 'fourCorners', mode: 'toggle' } })
	await self.actions.multiplayer_bingo_flags.callback({ options: { field: 'confirmCalls', mode: 'false' } })
	await self.actions.multiplayer_bingo_call.callback({ options: { prompt: '1', customPrompt: '', mode: 'true' } })
	await self.actions.multiplayer_bingo_call.callback({ options: { prompt: '0', customPrompt: '2', mode: 'toggle' } })
	await self.actions.multiplayer_bingo_pack_select.callback({ options: { pack: 'speedrun-pack', confirm: false } })
	await self.actions.multiplayer_bingo_pack_select.callback({ options: { pack: 'speedrun-pack', confirm: true } })
	await self.actions.multiplayer_bingo_pending.callback({ options: { action: 'confirm', scope: 'all' } })
	await self.actions.multiplayer_bingo_pending.callback({
		options: { action: 'dismiss', scope: 'prompt', prompt: '1', customPrompt: '' },
	})

	// OBS Layout Aspect Ratio action
	await self.actions.obs_layout_aspect.callback({
		options: { sourceName: 'Facecam', ratio: 'cycle', durationMs: 450 },
	})
	await self.actions.obs_layout_aspect.callback({
		options: { sourceName: 'Facecam', ratio: '9:16', durationMs: 600 },
	})

	// Display Library Bingo action
	await self.actions.display_bingo_control.callback({
		options: { display: 'disp-bingo-1', customDisplay: '', action: 'toggle', cell: 4, stamped: 'true', confirm: false },
	})
	await self.actions.display_bingo_control.callback({
		options: {
			display: 'disp-bingo-1',
			customDisplay: '',
			action: 'toggle',
			cell: 4,
			stamped: 'toggle',
			confirm: false,
		},
	})
	await self.actions.display_bingo_control.callback({
		options: {
			display: 'disp-bingo-1',
			customDisplay: '',
			action: 'shuffle',
			cell: 0,
			stamped: 'toggle',
			confirm: false,
		},
	})
	await self.actions.display_bingo_control.callback({
		options: {
			display: 'disp-bingo-1',
			customDisplay: '',
			action: 'shuffle',
			cell: 0,
			stamped: 'toggle',
			confirm: true,
		},
	})
	await self.actions.display_bingo_control.callback({
		options: { display: '', customDisplay: 'custom-bingo', action: 'reset', cell: 0, stamped: 'toggle', confirm: true },
	})

	assert.deepEqual(
		requests.map((r) => [r.path, r.opts.body]),
		[
			['/api/operator/runbooks/pre-show/toggle', { index: 1, done: true }],
			['/api/operator/runbooks/pre-show/toggle', { itemId: 'cue-1' }],
			['/api/operator/runbooks/pre-show/reset', undefined],
			['/api/multiplayer-bingo/flags', { fourCorners: false }],
			['/api/multiplayer-bingo/flags', { confirmCalls: false }],
			['/api/multiplayer-bingo/call', { prompt: 1, called: true }],
			['/api/multiplayer-bingo/call', { prompt: 2 }],
			['/api/multiplayer-bingo/packs/select', { id: 'speedrun-pack' }],
			['/api/multiplayer-bingo/confirm', { all: true }],
			['/api/multiplayer-bingo/dismiss', { prompt: 1 }],
			['/api/obs-layout/aspect', { sourceName: 'Facecam', action: 'cycle', durationMs: 450 }],
			['/api/obs-layout/aspect', { sourceName: 'Facecam', action: 'set', ratio: '9:16', durationMs: 600 }],
			['/api/variable-displays/disp-bingo-1/bingo/toggle', { cell: 4, stamped: true }],
			['/api/variable-displays/disp-bingo-1/bingo/toggle', { cell: 4 }],
			['/api/variable-displays/disp-bingo-1/bingo/shuffle', undefined],
			['/api/variable-displays/custom-bingo/bingo/reset', undefined],
		],
	)

	// Presets present
	assert.equal(self.presets.operator_runbook_toggle_cue1.category, 'Operator')
	assert.equal(self.presets.operator_runbook_reset.category, 'Operator')
	assert.equal(self.presets.mp_bingo_confirm_all_pending.category, 'Multiplayer Bingo')
	assert.equal(self.presets.mp_bingo_four_corners_toggle.category, 'Multiplayer Bingo')

	// choiceSignature tracks runbooks, bingo packs/prompts, and bingo displays
	const sig1 = choiceSignature(self.state)
	self.state.operator.runbooks.push({ id: 'post-show', name: 'Post-Show', items: [] })
	const sig2 = choiceSignature(self.state)
	assert.notEqual(sig2, sig1)

	self.state.multiplayerBingo.packs.push({ id: 'new-pack', name: 'New Pack' })
	const sig3 = choiceSignature(self.state)
	assert.notEqual(sig3, sig2)

	self.state.bingoDisplays.push({ id: 'disp-bingo-2', name: 'Side Bingo', kind: 'bingo' })
	const sig4 = choiceSignature(self.state)
	assert.notEqual(sig4, sig3)
})
