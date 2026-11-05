const { GREEN, RED, AMBER, BLUE, PURPLE, WHITE, BLACK, DARK_GRAY } = require('./colors')

module.exports = function () {
	const presets = {}

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

	return presets
}
