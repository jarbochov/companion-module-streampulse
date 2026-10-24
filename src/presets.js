const { combineRgb } = require('@companion-module/base')

const GREEN = combineRgb(0, 170, 0)
const RED = combineRgb(204, 0, 0)
const AMBER = combineRgb(204, 136, 0)
const BLUE = combineRgb(26, 115, 232)
const PURPLE = combineRgb(145, 71, 255)
const WHITE = combineRgb(255, 255, 255)
const BLACK = combineRgb(0, 0, 0)
const DARK_GRAY = combineRgb(26, 27, 30)

module.exports = function (self) {
	const presets = {}

	// ---- Stream Status Presets ---------------------------------------------
	presets['live_status'] = {
		type: 'button',
		category: 'Stream Status',
		name: 'Live Stream & Viewers',
		style: {
			text: 'STREAM\\nOFFLINE',
			size: '14',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'session_live',
				options: {},
				style: {
					text: 'LIVE\\n$(streampulse:viewers) v\\n$(streampulse:stream_uptime)',
					bgcolor: RED,
					color: WHITE,
					size: '14',
				},
			},
		],
	}

	presets['server_status'] = {
		type: 'button',
		category: 'Stream Status',
		name: 'Server Status & Uptime',
		style: {
			text: 'SERVER\\nOFFLINE',
			size: '14',
			color: WHITE,
			bgcolor: RED,
		},
		steps: [
			{
				down: [
					{
						actionId: 'restart_server',
						options: {},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'server_online',
				options: {},
				style: {
					text: 'PULSE\\nONLINE\\n$(streampulse:streampulse_uptime)',
					bgcolor: GREEN,
					color: WHITE,
					size: '12',
				},
			},
		],
	}

	// ---- Timer Presets -----------------------------------------------------
	presets['timer_countdown'] = {
		type: 'button',
		category: 'Timers',
		name: 'Countdown Timer (Tap: Pause/Resume, Hold: Reset)',
		style: {
			text: 'TIMER\\n$(streampulse:timer_countdown_remaining)',
			size: '14',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'timer_control',
						options: {
							timer: 'countdown',
							action: 'pause',
						},
					},
				],
				up: [],
			},
			{
				down: [
					{
						actionId: 'timer_control',
						options: {
							timer: 'countdown',
							action: 'resume',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'timer_state',
				options: { timer: 'countdown', state: 'running' },
				style: { bgcolor: GREEN, color: WHITE },
			},
			{
				feedbackId: 'timer_state',
				options: { timer: 'countdown', state: 'paused' },
				style: { bgcolor: AMBER, color: WHITE },
			},
			{
				feedbackId: 'timer_state',
				options: { timer: 'countdown', state: 'completed' },
				style: { bgcolor: RED, color: WHITE },
			},
		],
	}

	presets['timer_add_1m'] = {
		type: 'button',
		category: 'Timers',
		name: 'Timer: +1 Minute',
		style: {
			text: '+1 MIN\\nTIMER',
			size: '14',
			color: WHITE,
			bgcolor: BLUE,
		},
		steps: [
			{
				down: [
					{
						actionId: 'timer_control',
						options: {
							timer: 'countdown',
							action: 'add_time',
							minutes: 1,
							seconds: 0,
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['timer_sub_1m'] = {
		type: 'button',
		category: 'Timers',
		name: 'Timer: -1 Minute',
		style: {
			text: '-1 MIN\\nTIMER',
			size: '14',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'timer_control',
						options: {
							timer: 'countdown',
							action: 'subtract_time',
							minutes: 1,
							seconds: 0,
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	// ---- Alerts Presets ----------------------------------------------------
	presets['alert_queue_skip'] = {
		type: 'button',
		category: 'Alerts',
		name: 'Alert Queue (Tap: Skip, Shows Pending)',
		style: {
			text: 'ALERTS\\nSkip\\nQ: $(streampulse:alerts_pending)',
			size: '14',
			color: WHITE,
			bgcolor: PURPLE,
		},
		steps: [
			{
				down: [
					{
						actionId: 'alert_queue',
						options: { action: 'skip' },
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'alert_queue_paused',
				options: {},
				style: { bgcolor: AMBER, color: WHITE },
			},
		],
	}

	presets['alert_replay'] = {
		type: 'button',
		category: 'Alerts',
		name: 'Replay Last Alert',
		style: {
			text: 'ALERT\\nReplay\\nLast',
			size: '14',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'alert_replay_last',
						options: {},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['alert_test_follow'] = {
		type: 'button',
		category: 'Alerts',
		name: 'Test Alert: Follow',
		style: {
			text: 'TEST\\nALERT\\nFollow',
			size: '14',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'alert_test_event',
						options: { trigger: 'follow', user: 'TestViewer' },
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	// ---- Clips & Highlights Presets ----------------------------------------
	presets['mark_clip'] = {
		type: 'button',
		category: 'Clips & Highlights',
		name: 'Mark Clip Candidate',
		style: {
			text: 'MARK\\nCLIP',
			size: '18',
			color: BLACK,
			bgcolor: AMBER,
		},
		steps: [
			{
				down: [
					{
						actionId: 'mark_clip',
						options: {},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['pin_highlight'] = {
		type: 'button',
		category: 'Clips & Highlights',
		name: 'Pin Last Chat Message',
		style: {
			text: 'PIN\\nCHAT\\nMSG',
			size: '14',
			color: WHITE,
			bgcolor: BLUE,
		},
		steps: [
			{
				down: [
					{
						actionId: 'pin_last_highlight',
						options: {},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	// ---- Music Presets -----------------------------------------------------
	presets['music_now_playing'] = {
		type: 'button',
		category: 'Music',
		name: 'Now Playing & Toggle Overlay',
		style: {
			text: 'MUSIC\\n$(streampulse:track)\\n$(streampulse:artist)',
			size: '10',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'music_overlay',
						options: { action: 'toggle' },
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'music_playing',
				options: {},
				style: { bgcolor: GREEN, color: WHITE },
			},
			{
				feedbackId: 'music_overlay_visible',
				options: {},
				style: { color: WHITE },
			},
		],
	}

	// ---- Chat Bot Presets --------------------------------------------------
	presets['bot_toggle'] = {
		type: 'button',
		category: 'Chat Bot',
		name: 'Toggle Chat Bot',
		style: {
			text: 'BOT\\n$(streampulse:chat_bot_state)',
			size: '14',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'chat_bot_toggle',
						options: { mode: 'toggle' },
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'chat_bot_on',
				options: {},
				style: { bgcolor: GREEN, color: WHITE },
			},
		],
	}

	// ---- Milestones & Streaks Presets --------------------------------------
	presets['milestone_stream_counter'] = {
		type: 'button',
		category: 'Milestones & Streaks',
		name: 'Stream Number & Lifetime Hours',
		style: {
			text: 'STREAM\\n#$(streampulse:milestone_stream_number)\\n$(streampulse:milestone_total_hours) hrs',
			size: '14',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['milestone_streaks'] = {
		type: 'button',
		category: 'Milestones & Streaks',
		name: 'Daily & Weekly Streaks',
		style: {
			text: 'STREAK\\n$(streampulse:milestone_daily_streak)d daily\\n$(streampulse:milestone_weekly_streak)w weekly',
			size: '14',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['milestone_community'] = {
		type: 'button',
		category: 'Milestones & Streaks',
		name: 'Community Lifetime Stats',
		style: {
			text: 'COMMUNITY\\n$(streampulse:milestone_lifetime_chatters) chatters\\n$(streampulse:milestone_lifetime_messages) msgs',
			size: '12',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [],
				up: [],
			},
		],
		feedbacks: [],
	}

	// ---- Randomizer & Wheel Presets ----------------------------------------
	presets['spin_randomizer'] = {
		type: 'button',
		category: 'Overlays',
		name: 'Spin Randomizer (Wheel / Roller / Deck)',
		style: {
			text: 'SPIN\\n$(streampulse:randomizer_last_mode)\\n$(streampulse:randomizer_last_duration)s',
			size: '14',
			color: WHITE,
			bgcolor: PURPLE,
		},
		steps: [
			{
				down: [
					{
						actionId: 'randomizer_spin',
						options: {
							preset: '',
							mode: '',
							duration: '',
							autohide: '',
							suspense: '',
							theme: '',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'randomizer_spinning',
				options: {},
				style: {
					text: 'SPINNING...\\n$(streampulse:randomizer_last_duration)s',
					bgcolor: AMBER,
					color: WHITE,
				},
			},
		],
	}

	presets['spin_randomizer_deck'] = {
		type: 'button',
		category: 'Overlays',
		name: 'Draw Randomizer Card',
		style: {
			text: 'DRAW\\nCARD\\n$(streampulse:randomizer_last_duration)s',
			size: '14',
			color: WHITE,
			bgcolor: PURPLE,
		},
		steps: [
			{
				down: [
					{
						actionId: 'randomizer_spin',
						options: {
							preset: '',
							mode: 'deck',
							duration: '',
							autohide: '',
							suspense: '',
							theme: '',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'randomizer_spinning',
				options: {},
				style: {
					text: 'DRAWING...\\n$(streampulse:randomizer_last_duration)s',
					bgcolor: AMBER,
					color: WHITE,
				},
			},
		],
	}

	presets['randomizer_winner_display'] = {
		type: 'button',
		category: 'Overlays',
		name: 'Randomizer Winner Display',
		style: {
			text: 'WINNER:\\n$(streampulse:randomizer_last_winner)',
			size: '14',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'randomizer_spinning',
				options: {},
				style: {
					text: 'CHOOSING...',
					bgcolor: AMBER,
					color: WHITE,
				},
			},
		],
	}

	presets['randomizer_restore'] = {
		type: 'button',
		category: 'Overlays',
		name: 'Restore Randomizer Choices',
		style: {
			text: 'RESTORE\\nCHOICES\\n($(streampulse:randomizer_removed) out)',
			size: '12',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'randomizer_restore',
						options: {
							preset: '',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	// ---- Custom Overlay Video & Cutout Presets -----------------------------
	presets['video_play_pause'] = {
		type: 'button',
		category: 'Overlays',
		name: 'Video Play / Pause',
		style: {
			text: 'VIDEO\\nPLAY/PAUSE',
			size: '12',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'video_control',
						options: {
							action: 'toggle',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['video_restart'] = {
		type: 'button',
		category: 'Overlays',
		name: 'Video Restart',
		style: {
			text: 'VIDEO\\nRESTART',
			size: '12',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'video_control',
						options: {
							action: 'restart',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['video_mute_toggle'] = {
		type: 'button',
		category: 'Overlays',
		name: 'Video Mute / Unmute',
		style: {
			text: 'VIDEO\\nMUTE',
			size: '12',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'video_control',
						options: {
							action: 'toggle-mute',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['cutout_toggle'] = {
		type: 'button',
		category: 'Overlays',
		name: 'Cutout Toggle Hole',
		style: {
			text: 'CUTOUT\\nHOLE',
			size: '12',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'cutout_control',
						options: {
							action: 'toggle',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	// ---- Polls Presets -----------------------------------------------------
	presets['poll_start_preset'] = {
		type: 'button',
		category: 'Polls',
		name: 'Start Poll (Shows Live Votes & Timer)',
		style: {
			text: 'START\\nPOLL',
			size: '14',
			color: WHITE,
			bgcolor: PURPLE,
		},
		steps: [
			{
				down: [
					{
						actionId: 'poll_start',
						options: {
							preset: '',
							title: 'Chat Poll',
							choices: 'Option 1, Option 2',
							duration: 60,
							blind: false,
							subMultiplier: false,
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'poll_active',
				options: {},
				style: {
					text: 'POLL LIVE\\n$(streampulse:poll_total_votes)v\\n$(streampulse:poll_remaining)',
					bgcolor: GREEN,
					color: WHITE,
					size: '12',
				},
			},
		],
	}

	presets['poll_end_crown'] = {
		type: 'button',
		category: 'Polls',
		name: 'End Poll & Crown Winner',
		style: {
			text: 'END POLL\\n$(streampulse:poll_leader)',
			size: '12',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'poll_control',
						options: { action: 'end', seconds: 30 },
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'poll_active',
				options: {},
				style: {
					bgcolor: AMBER,
					color: BLACK,
				},
			},
		],
	}

	presets['poll_extend_30s'] = {
		type: 'button',
		category: 'Polls',
		name: 'Extend Poll +30s',
		style: {
			text: 'POLL\\n+30 SEC',
			size: '14',
			color: WHITE,
			bgcolor: BLUE,
		},
		steps: [
			{
				down: [
					{
						actionId: 'poll_control',
						options: { action: 'extend', seconds: 30 },
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['poll_cancel'] = {
		type: 'button',
		category: 'Polls',
		name: 'Cancel / Dismiss Poll',
		style: {
			text: 'CANCEL\\nPOLL',
			size: '14',
			color: WHITE,
			bgcolor: RED,
		},
		steps: [
			{
				down: [
					{
						actionId: 'poll_control',
						options: { action: 'cancel', seconds: 30 },
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	// ---- Versus & Speedrun Presets -----------------------------------------
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

	// ---- Tournament Bracket Presets ----------------------------------------
	presets['tournament_e1_score_up'] = {
		type: 'button',
		category: 'Tournaments',
		name: 'Tournament: Entrant 1 Game +1',
		style: {
			text: '$(streampulse:tournament_e1_name)\\nSCORE: $(streampulse:tournament_e1_score)\\n+1 GAME',
			size: '12',
			color: WHITE,
			bgcolor: RED,
		},
		steps: [
			{
				down: [
					{
						actionId: 'tournament_score',
						options: { matchId: '', entrant: 0, target: 'game', delta: 1 },
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['tournament_e2_score_up'] = {
		type: 'button',
		category: 'Tournaments',
		name: 'Tournament: Entrant 2 Game +1',
		style: {
			text: '$(streampulse:tournament_e2_name)\\nSCORE: $(streampulse:tournament_e2_score)\\n+1 GAME',
			size: '12',
			color: WHITE,
			bgcolor: BLUE,
		},
		steps: [
			{
				down: [
					{
						actionId: 'tournament_score',
						options: { matchId: '', entrant: 1, target: 'game', delta: 1 },
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['tournament_e1_round_up'] = {
		type: 'button',
		category: 'Tournaments',
		name: 'Tournament: Entrant 1 Round +1',
		style: {
			text: '$(streampulse:tournament_e1_name)\\nRND: $(streampulse:tournament_e1_rounds)\\n+1 RND',
			size: '12',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'tournament_score',
						options: { matchId: '', entrant: 0, target: 'round', delta: 1 },
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['tournament_e2_round_up'] = {
		type: 'button',
		category: 'Tournaments',
		name: 'Tournament: Entrant 2 Round +1',
		style: {
			text: '$(streampulse:tournament_e2_name)\\nRND: $(streampulse:tournament_e2_rounds)\\n+1 RND',
			size: '12',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'tournament_score',
						options: { matchId: '', entrant: 1, target: 'round', delta: 1 },
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['tournament_advance_winner'] = {
		type: 'button',
		category: 'Tournaments',
		name: 'Tournament: Confirm & Advance Winner',
		style: {
			text: 'ADVANCE\\nWINNER\\n$(streampulse:tournament_round)',
			size: '12',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'tournament_advance',
						options: { matchId: '', winner: 'auto' },
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'tournament_win_ready',
				options: {},
				style: {
					text: 'ADVANCE\\n$(streampulse:tournament_pending_winner)\\nTARGET MET',
					bgcolor: GREEN,
					color: WHITE,
					size: '10',
				},
			},
		],
	}

	presets['tournament_next_match'] = {
		type: 'button',
		category: 'Tournaments',
		name: 'Tournament: Next Ready Match',
		style: {
			text: 'NEXT\\nMATCH\\n$(streampulse:tournament_round)',
			size: '12',
			color: WHITE,
			bgcolor: PURPLE,
		},
		steps: [
			{
				down: [
					{
						actionId: 'tournament_control',
						options: { action: 'next_match', matchId: '' },
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['tournament_toggle_highlight'] = {
		type: 'button',
		category: 'Tournaments',
		name: 'Tournament: Toggle Live Bracket Highlight',
		style: {
			text: 'BRACKET\\nLIVE GLOW\\nTOGGLE',
			size: '12',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'tournament_control',
						options: { action: 'toggle_highlight', matchId: '' },
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	self.setPresetDefinitions(presets)
}
