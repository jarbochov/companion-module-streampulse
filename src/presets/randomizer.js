const { AMBER, PURPLE, WHITE, DARK_GRAY } = require('./colors')

module.exports = function () {
	const presets = {}

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

	return presets
}
