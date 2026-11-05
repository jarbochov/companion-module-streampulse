const { GREEN, RED, AMBER, BLUE, WHITE, DARK_GRAY } = require('./colors')

module.exports = function () {
	const presets = {}

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

	return presets
}
