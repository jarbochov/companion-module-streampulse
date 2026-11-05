const { GREEN, WHITE, DARK_GRAY } = require('./colors')

module.exports = function () {
	const presets = {}

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

	return presets
}
