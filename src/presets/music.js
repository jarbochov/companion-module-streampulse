const { GREEN, WHITE, DARK_GRAY } = require('./colors')

module.exports = function () {
	const presets = {}

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

	return presets
}
