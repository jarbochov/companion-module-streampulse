const { AMBER, PURPLE, WHITE, DARK_GRAY } = require('./colors')

module.exports = function () {
	const presets = {}

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

	return presets
}
