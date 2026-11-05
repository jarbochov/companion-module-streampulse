const { WHITE, DARK_GRAY } = require('./colors')

module.exports = function () {
	const presets = {}

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

	return presets
}
