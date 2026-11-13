const assert = require('node:assert/strict')
const { createHash } = require('node:crypto')
const { test } = require('node:test')
const defineActions = require('../src/actions')
const definePresets = require('../src/presets')
const choices = require('../src/choices')
const { speakerActions, speakerPresets } = require('../src/speakers')

const actionIds = [
	'alert_queue',
	'alert_mute',
	'alert_fire',
	'alert_replay_last',
	'alert_test',
	'alert_test_event',
	'alert_test_webhook',
	'page_navigate',
	'page_goto',
	'page_set_enabled',
	'overlay_visibility',
	'video_control',
	'cutout_control',
	'slideshow_control',
	'music_overlay',
	'tier_vote_start',
	'tier_vote_lock',
	'tier_vote_end',
	'tier_vote_cancel',
	'tier_reset_placements',
	'tier_load_preset',
	'poll_start',
	'poll_control',
	'poll_tournament_create_from_template',
	'poll_tournament_restore',
	'poll_tournament_save_checkpoint',
	'poll_tournament_save_template',
	'matchup_score',
	'matchup_clock',
	'matchup_runner',
	'matchup_general',
	'tournament_control',
	'tournament_score',
	'tournament_advance',
	'tournament_view',
	'randomizer_spin',
	'randomizer_restore',
	'chat_bot_toggle',
	'chat_send',
	'chat_run_command',
	'chat_quote',
	'variable_counter',
	'variable_set',
	'variable_roll',
	'timer_control',
	'goal_action',
	'mark_clip',
	'pin_last_highlight',
	'start_session',
	'end_session',
	'reset_session_data',
	'restart_server',
	'stop_server',
]

const presetIds = [
	'live_status',
	'server_status',
	'timer_countdown',
	'timer_add_1m',
	'timer_sub_1m',
	'alert_queue_skip',
	'alert_replay',
	'alert_test_follow',
	'mark_clip',
	'pin_highlight',
	'music_now_playing',
	'bot_toggle',
	'milestone_stream_counter',
	'milestone_streaks',
	'milestone_community',
	'spin_randomizer',
	'spin_randomizer_deck',
	'randomizer_winner_display',
	'randomizer_restore',
	'video_play_pause',
	'video_restart',
	'video_mute_toggle',
	'cutout_toggle',
	'poll_start_preset',
	'poll_end_crown',
	'poll_extend_30s',
	'poll_cancel',
	'versus_c1_score_up',
	'versus_c2_score_up',
	'versus_c1_round_up',
	'versus_c2_round_up',
	'versus_swap_sides',
	'versus_reset_scores',
	'speedrun_race_start_all',
	'speedrun_r1_finish',
	'speedrun_r2_finish',
	'speedrun_timers_mode_toggle',
	'tournament_e1_score_up',
	'tournament_e2_score_up',
	'tournament_e1_round_up',
	'tournament_e2_round_up',
	'tournament_advance_winner',
	'tournament_next_match',
	'tournament_toggle_highlight',
	'tournament_toggle_focus',
	'tournament_round_next',
	'tournament_round_prev',
	'tournament_cycle_bracket',
	'poll_tournament_toggle_focus',
	'tier_vote_start',
	'tier_vote_lock',
	'tier_vote_place',
	'tier_vote_cancel',
]

function createSelf(populated = false) {
	const state = {
		timers: {},
		goals: [],
		rules: [],
		pages: {},
		slideshows: [],
		videos: [],
		cutouts: [],
		overlayVisibility: [],
		chatChoices: [],
	}
	if (populated) {
		Object.assign(state, {
			timers: { countdown: { id: 'countdown', label: 'Countdown' }, custom: { id: 'custom' } },
			goals: [{ id: 'goal-1', title: 'Community goal' }, { id: 'goal-2' }],
			rules: [{ id: 'rule-1', name: 'Follow alert' }, { id: 'rule-2' }],
			randomizerPresets: [{ id: 'wheel-1', name: 'Wheel' }, { id: 'wheel-2' }],
			randomizerButtonPresets: [{ id: 'phrases-1', name: 'Phrases' }, { id: 'phrases-2' }],
			chatChoices: [
				{ id: 'timed', label: 'Timed: Reminder' },
				{ id: 'hello', label: '!hello' },
				{ id: 'trigger', label: 'Trigger: Example' },
			],
			pollPresets: [{ id: 'poll-1', title: 'Pick one', choices: [{ label: 'A' }, { label: 'B' }] }, { id: 'poll-2' }],
			matchupPresets: [{ id: 'matchup-1', name: 'Versus' }, { id: 'matchup-2', title: 'Race' }, { id: 'matchup-3' }],
			pages: {
				scene: {
					id: 'scene',
					overlayName: 'Scene',
					pages: [
						{ id: 'intro', name: 'Intro' },
						{ id: 'nested::page', name: 'Nested' },
					],
				},
				other: { id: 'other', overlayName: 'Other', pages: [{ id: 'main', name: 'Main' }] },
			},
			slideshows: [{ overlayId: 'scene', elementId: 'slides', overlayName: 'Scene', name: 'Slides' }],
			videos: [{ overlayId: 'scene', elementId: 'video::nested', overlayName: 'Scene', name: 'Video' }],
			cutouts: [{ overlayId: 'scene', elementId: 'mask', overlayName: 'Scene', name: 'Mask', shape: 'circle' }],
			overlayVisibility: [
				{ key: 'scene', label: 'Scene' },
				{ key: 'other', label: 'Other' },
			],
			tierList: {
				items: [{ id: 'ranked', name: 'Ranked', tierId: 'a' }, { id: 'next', name: 'Next' }, { id: 'unnamed' }],
				presets: [{ id: 'fallback', title: 'Fallback' }],
			},
			tierListPresets: [{ id: 'tier-1', name: 'Standard' }, { id: 'tier-2', title: 'Custom' }, { id: 'tier-3' }],
			tournament: {
				activeMatchId: 'match-1',
				matches: [
					{
						id: 'match-1',
						roundName: 'Final',
						entrant1: { name: 'Red', score: 2 },
						entrant2: { name: 'Blue', score: 1 },
					},
					{ id: 'match-2', label: 'Semi', entrant1: 'Green', entrant2: 'Gold', scores: [1, 0] },
					{ id: 'match-3', entrant1: 'Silver', entrant2: 'TBD', score1: 3, score2: 2 },
					{ id: 'bye', isBye: true, entrant1: 'Bye', entrant2: 'BYE' },
					{ id: 'empty' },
				],
			},
		})
	}
	return {
		state,
		api: {},
		setActionDefinitions(definitions) {
			this.actions = definitions
		},
		setPresetDefinitions(definitions) {
			this.presets = definitions
		},
	}
}

function digest(value) {
	const serialized = JSON.stringify(value, (_key, item) =>
		typeof item === 'function' ? item.toString().replace(/\s+/g, ' ') : item,
	)
	return createHash('sha256').update(serialized).digest('hex')
}

// Captured from the monolithic definitions before extracting feature domains.
const baseline = {
	empty: '0f2b166b1e2ef6f3645b563bc7816608c929718a2843ce68cded7992d45db3ac',
	populated: 'c607223535ded57b57f62866581889387a445c70d0eb6771fad363b0c847df35',
	fallback: 'f95e5fd29faef20d6787ec5795ee54a7184285eb5ab4dd76bbe7aedfe5a954cc',
	presets: '14cbfff1aad235483a27e8f936c9160515ef302ca5e28b58e110c2e41e527780',
}

test('Domain assembly preserves legacy IDs, order, options, callbacks and preset definitions', () => {
	const actual = {}
	for (const scenario of ['empty', 'populated', 'fallback']) {
		const self = createSelf(scenario !== 'empty')
		if (scenario === 'fallback') {
			delete self.state.tierListPresets
			self.state.tierList.items = [{ id: 'ranked', name: 'Ranked', tierId: 'a' }]
			self.state.chatChoices = [{ id: 'timed', label: 'Timed: Reminder' }]
		}
		defineActions(self)
		definePresets(self)
		assert.deepEqual(Object.keys(self.actions).slice(0, actionIds.length), actionIds)
		assert.deepEqual(Object.keys(self.presets).slice(0, presetIds.length), presetIds)
		actual[scenario] = digest(Object.fromEntries(actionIds.map((id) => [id, self.actions[id]])))
		actual.presets = digest(Object.fromEntries(presetIds.map((id) => [id, self.presets[id]])))
	}
	assert.deepEqual(actual, baseline)
})

test('Domain assembly appends speaker and OBS definitions without replacing legacy definitions', () => {
	const self = createSelf()
	self.state.speakers = [
		{
			overlayId: 'scene',
			overlayName: 'Scene',
			elementId: 'speaker',
			name: 'Speaker',
			speakerBadge: { speaker: { name: 'Example Guest', showHandle: true } },
		},
	]
	defineActions(self)
	definePresets(self)
	const speakerActionCount = Object.keys(speakerActions(self)).length
	const addedActions = Object.fromEntries(
		Object.entries(self.actions).slice(actionIds.length, actionIds.length + speakerActionCount),
	)
	const speakerPresetCount = Object.keys(speakerPresets(self)).length
	const addedPresets = Object.fromEntries(
		Object.entries(self.presets).slice(presetIds.length, presetIds.length + speakerPresetCount),
	)
	assert.deepEqual(Object.keys(addedActions), Object.keys(speakerActions(self)))
	assert.deepEqual(Object.keys(addedPresets), Object.keys(speakerPresets(self)))
	assert.equal(digest(addedActions), digest(speakerActions(self)))
	assert.equal(digest(addedPresets), digest(speakerPresets(self)))
})

test('Shared choices preserve empty placeholders, media labels and composite page IDs', () => {
	const empty = createSelf()
	for (const [builder, label] of [
		['pageChoices', '(no multi-page overlays found)'],
		['pagedOverlayChoices', '(no multi-page overlays found)'],
		['slideshowChoices', '(no slideshows found)'],
		['videoChoices', '(no videos found)'],
		['cutoutChoices', '(no cutouts found)'],
	]) {
		assert.deepEqual(choices[builder](empty), [{ id: '', label }])
	}
	const self = createSelf(true)
	assert.deepEqual(choices.pageChoices(self)[1], { id: 'scene::nested::page', label: 'Scene / Nested' })
	assert.deepEqual(choices.splitPage('scene::nested::page'), { overlay: 'scene', page: 'nested::page' })
	assert.deepEqual(choices.slideshowChoices(self), [{ id: 'scene::slides', label: 'Scene / Slides' }])
	assert.deepEqual(choices.videoChoices(self), [{ id: 'scene::video::nested', label: 'Scene / Video' }])
	assert.deepEqual(choices.cutoutChoices(self), [{ id: 'scene::mask', label: 'Scene / Mask (circle)' }])
	assert.equal(choices.findVideo(self, 'scene::video::nested'), self.state.videos[0])
	assert.equal(choices.findSlideshow(self, 'scene::slides'), self.state.slideshows[0])
	assert.equal(choices.findCutout(self, 'scene::mask'), self.state.cutouts[0])
})

test('Extracted actions retain shared run polling and error handling across domains', async () => {
	const self = createSelf()
	const calls = []
	self.poll = () => calls.push('poll')
	self.log = (...args) => calls.push(args)
	self.api.alertQueue = async (action) => calls.push(['queue', action])
	self.api.pageAction = async (...args) => calls.push(['page', ...args])
	self.api.startSession = async () => {
		throw new Error('unavailable')
	}
	defineActions(self)
	await self.actions.alert_queue.callback({ options: { action: 'skip' } })
	await self.actions.page_goto.callback({ options: { page: 'scene::nested::page' } })
	await self.actions.start_session.callback()
	assert.deepEqual(calls, [
		['queue', 'skip'],
		'poll',
		['page', 'scene', 'goto', { page: 'nested::page' }],
		'poll',
		['error', 'unavailable'],
	])
})

test('All registered actions include a non-empty description', () => {
	const self = createSelf(true)
	defineActions(self)
	const entries = Object.entries(self.actions)
	assert.ok(entries.length > 0)
	for (const [id, def] of entries) {
		assert.equal(
			typeof def.description === 'string' && def.description.trim().length > 0,
			true,
			`Expected action "${id}" to define a non-empty description`,
		)
	}
})

test('alert_replay_last replays the last 1..N alerts in chronological order', async () => {
	const self = createSelf()
	const calls = []
	self.poll = () => calls.push('poll')
	self.log = (level, msg) => calls.push(['log', level, msg])
	self.api.replayAlert = async (id) => {
		calls.push(['replay', id])
		return { ok: true, id }
	}
	defineActions(self)

	const replay = self.actions.alert_replay_last
	assert.ok(replay)
	assert.deepEqual(replay.options, [
		{
			id: 'count',
			type: 'number',
			label: 'Number of alerts to replay',
			default: 1,
			min: 1,
			max: 50,
		},
	])

	// Empty history logs a warning without calling replayAlert
	self.state.alerts = { history: [] }
	await replay.callback({ options: { count: 2 } })
	assert.deepEqual(calls, [['log', 'warn', 'No alert history to replay']])

	// Populate unsorted history and verify omitted options, count=1, count=2, and count=3
	self.state.alerts = {
		history: [
			{ id: 'a2', shownAt: '2026-01-01T10:02:00.000Z' },
			{ id: 'a4', at: '2026-01-01T10:04:00.000Z' },
			{ id: 'a1', shownAt: '2026-01-01T10:01:00.000Z' },
			{ id: 'a3', shownAt: '2026-01-01T10:03:00.000Z' },
		],
	}

	calls.length = 0
	await replay.callback()
	assert.deepEqual(calls, [['replay', 'a4'], 'poll'])

	calls.length = 0
	await replay.callback({ options: { count: 1 } })
	assert.deepEqual(calls, [['replay', 'a4'], 'poll'])

	calls.length = 0
	await replay.callback({ options: { count: 2 } })
	assert.deepEqual(calls, [['replay', 'a3'], ['replay', 'a4'], 'poll'])

	calls.length = 0
	await replay.callback({ options: { count: 3 } })
	assert.deepEqual(calls, [['replay', 'a2'], ['replay', 'a3'], ['replay', 'a4'], 'poll'])
})
