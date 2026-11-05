const { GREEN, RED, BLUE, PURPLE, WHITE, DARK_GRAY } = require('./colors')

module.exports = function () {
	const presets = {}

	presets['versus_c1_score_up'] = {
		type: 'button',
		category: 'Versus & Speedrun',
		name: 'P1 Game Score +1',
		style: {
			text: '$(streampulse:matchup_c1_name)\\nSCORE: $(streampulse:matchup_c1_score)\\n+1 GAME',
			size: '12',
			color: WHITE,
			bgcolor: RED,
		},
		steps: [
			{
				down: [
					{
						actionId: 'matchup_score',
						options: { runner: 0, target: 'game', delta: 1 },
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['versus_c2_score_up'] = {
		type: 'button',
		category: 'Versus & Speedrun',
		name: 'P2 Game Score +1',
		style: {
			text: '$(streampulse:matchup_c2_name)\\nSCORE: $(streampulse:matchup_c2_score)\\n+1 GAME',
			size: '12',
			color: WHITE,
			bgcolor: BLUE,
		},
		steps: [
			{
				down: [
					{
						actionId: 'matchup_score',
						options: { runner: 1, target: 'game', delta: 1 },
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['versus_c1_round_up'] = {
		type: 'button',
		category: 'Versus & Speedrun',
		name: 'P1 Round +1',
		style: {
			text: '$(streampulse:matchup_c1_name)\\nRND: $(streampulse:matchup_c1_rounds)\\n+1 RND',
			size: '12',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'matchup_score',
						options: { runner: 0, target: 'round', delta: 1 },
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['versus_c2_round_up'] = {
		type: 'button',
		category: 'Versus & Speedrun',
		name: 'P2 Round +1',
		style: {
			text: '$(streampulse:matchup_c2_name)\\nRND: $(streampulse:matchup_c2_rounds)\\n+1 RND',
			size: '12',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'matchup_score',
						options: { runner: 1, target: 'round', delta: 1 },
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['versus_swap_sides'] = {
		type: 'button',
		category: 'Versus & Speedrun',
		name: 'Swap Sides (P1 <-> P2)',
		style: {
			text: 'SWAP\\nSIDES\\nP1 <-> P2',
			size: '12',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'matchup_general',
						options: { action: '/swap', preset: '' },
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['versus_reset_scores'] = {
		type: 'button',
		category: 'Versus & Speedrun',
		name: 'Reset Match Scores (0-0)',
		style: {
			text: 'RESET\\nSCORES\\n0 - 0',
			size: '12',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'matchup_general',
						options: { action: '/reset-scores', preset: '' },
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['speedrun_race_start_all'] = {
		type: 'button',
		category: 'Versus & Speedrun',
		name: 'Speedrun: Sync Start All & Master Clock',
		style: {
			text: 'RACE\\nSTART\\n$(streampulse:matchup_clock)',
			size: '12',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'matchup_clock',
						options: { action: '/clock/race/start-all' },
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'matchup_clock_running',
				options: {},
				style: {
					bgcolor: GREEN,
					color: WHITE,
				},
			},
		],
	}

	presets['speedrun_r1_finish'] = {
		type: 'button',
		category: 'Versus & Speedrun',
		name: 'Speedrun: Runner 1 Finish Split (+Delta)',
		style: {
			text: 'FINISH R1\\n$(streampulse:matchup_c1_name)\\n$(streampulse:matchup_c1_delta)',
			size: '10',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'matchup_runner',
						options: { runner: 0, action: 'finish' },
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'matchup_runner_finished',
				options: { runner: 0 },
				style: {
					text: '$(streampulse:matchup_c1_place) $(streampulse:matchup_c1_name)\\n$(streampulse:matchup_c1_time)\\n$(streampulse:matchup_c1_delta)',
					bgcolor: GREEN,
					color: WHITE,
					size: '10',
				},
			},
		],
	}

	presets['speedrun_r2_finish'] = {
		type: 'button',
		category: 'Versus & Speedrun',
		name: 'Speedrun: Runner 2 Finish Split (+Delta)',
		style: {
			text: 'FINISH R2\\n$(streampulse:matchup_c2_name)\\n$(streampulse:matchup_c2_delta)',
			size: '10',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'matchup_runner',
						options: { runner: 1, action: 'finish' },
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'matchup_runner_finished',
				options: { runner: 1 },
				style: {
					text: '$(streampulse:matchup_c2_place) $(streampulse:matchup_c2_name)\\n$(streampulse:matchup_c2_time)\\n$(streampulse:matchup_c2_delta)',
					bgcolor: GREEN,
					color: WHITE,
					size: '10',
				},
			},
		],
	}

	presets['speedrun_timers_mode_toggle'] = {
		type: 'button',
		category: 'Versus & Speedrun',
		name: 'Speedrun: Toggle Reveal on Finish vs Always Show',
		style: {
			text: 'TIMERS\\nMODE:\\n$(streampulse:matchup_runner_timers_mode)',
			size: '12',
			color: WHITE,
			bgcolor: PURPLE,
		},
		steps: [
			{
				down: [
					{
						actionId: 'matchup_clock',
						options: { action: 'timers_toggle' },
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	return presets
}
