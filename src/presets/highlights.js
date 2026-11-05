const { AMBER, BLUE, WHITE, BLACK } = require('./colors')

module.exports = function () {
	const presets = {}

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

	return presets
}
