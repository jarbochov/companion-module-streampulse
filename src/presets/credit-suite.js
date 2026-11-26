const { GREEN, RED, BLUE, WHITE, DARK_GRAY } = require('./colors')

module.exports = function () {
	const presets = {}

	presets['credit_suite_toggle'] = {
		type: 'button',
		category: 'Credit Suite',
		name: 'Play / Pause Credits',
		style: {
			text: 'CREDITS\\nPLAY\\n$(streampulse:credit_suite_time)/$(streampulse:credit_suite_duration)',
			size: '12',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [{ actionId: 'credit_suite_transport', options: { action: 'toggle', project: '' } }],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'credit_suite_playing',
				options: {},
				style: {
					text: 'ROLLING\\n$(streampulse:credit_suite_time)\\n-$(streampulse:credit_suite_remaining)',
					bgcolor: GREEN,
					color: WHITE,
					size: '12',
				},
			},
		],
	}

	presets['credit_suite_restart'] = {
		type: 'button',
		category: 'Credit Suite',
		name: 'Restart Credits from Top',
		style: {
			text: 'CREDITS\\nRESTART\\n$(streampulse:credit_suite_speed)',
			size: '12',
			color: WHITE,
			bgcolor: BLUE,
		},
		steps: [
			{
				down: [{ actionId: 'credit_suite_transport', options: { action: 'restart', project: '' } }],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['credit_suite_stop'] = {
		type: 'button',
		category: 'Credit Suite',
		name: 'Stop & Reset Credits',
		style: {
			text: 'CREDITS\\nSTOP',
			size: '14',
			color: WHITE,
			bgcolor: RED,
		},
		steps: [
			{
				down: [{ actionId: 'credit_suite_transport', options: { action: 'stop', project: '' } }],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['credit_suite_speed_1x'] = {
		type: 'button',
		category: 'Credit Suite',
		name: 'Credits Speed 1.0x',
		style: {
			text: 'CREDITS\\nSPEED\\n1.0x',
			size: '14',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [{ actionId: 'credit_suite_speed', options: { rate: '1', project: '' } }],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['credit_suite_speed_15x'] = {
		type: 'button',
		category: 'Credit Suite',
		name: 'Credits Speed 1.5x',
		style: {
			text: 'CREDITS\\nSPEED\\n1.5x',
			size: '14',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [{ actionId: 'credit_suite_speed', options: { rate: '1.5', project: '' } }],
				up: [],
			},
		],
		feedbacks: [],
	}

	return presets
}
