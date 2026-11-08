const { GREEN, RED, AMBER, BLUE, WHITE, DARK_GRAY } = require('./colors')

module.exports = function () {
	const presets = {}

	presets['trivia_start'] = {
		type: 'button',
		category: 'Trivia',
		name: 'Start / Show Question',
		style: {
			text: 'TRIVIA\\nSTART\\n$(streampulse:trivia_index)/$(streampulse:trivia_total)',
			size: '14',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'trivia_start',
						options: { question: '', duration: 20 },
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'trivia_phase',
				options: { phase: 'question' },
				style: {
					text: 'Q $(streampulse:trivia_index)\\n$(streampulse:trivia_remaining)s\\n$(streampulse:trivia_votes)v',
					bgcolor: BLUE,
					color: WHITE,
					size: '12',
				},
			},
		],
	}

	presets['trivia_reveal'] = {
		type: 'button',
		category: 'Trivia',
		name: 'Reveal Answer',
		style: {
			text: 'TRIVIA\\nREVEAL\\nANSWER',
			size: '14',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'trivia_reveal',
						options: {},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'trivia_phase',
				options: { phase: 'reveal' },
				style: {
					text: 'ANSWER\\n$(streampulse:trivia_correct_letter)\\n$(streampulse:trivia_votes)v',
					bgcolor: GREEN,
					color: WHITE,
					size: '12',
				},
			},
		],
	}

	presets['trivia_next'] = {
		type: 'button',
		category: 'Trivia',
		name: 'Next Question',
		style: {
			text: 'TRIVIA\\nNEXT\\nQ',
			size: '14',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'trivia_next',
						options: {},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['trivia_prev'] = {
		type: 'button',
		category: 'Trivia',
		name: 'Previous Question',
		style: {
			text: 'TRIVIA\\nPREV\\nQ',
			size: '14',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'trivia_prev',
						options: {},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['trivia_reset'] = {
		type: 'button',
		category: 'Trivia',
		name: 'Reset Overlay (Idle)',
		style: {
			text: 'TRIVIA\\nRESET\\nIDLE',
			size: '14',
			color: WHITE,
			bgcolor: RED,
		},
		steps: [
			{
				down: [
					{
						actionId: 'trivia_reset',
						options: {},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['trivia_reset_done'] = {
		type: 'button',
		category: 'Trivia',
		name: 'Reset (Done) Played Status',
		style: {
			text: 'RESET\\nDONE\\n$(streampulse:trivia_unplayed) LEFT',
			size: '12',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'trivia_reset_done',
						options: {},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'trivia_unplayed_remaining',
				options: {},
				style: {
					bgcolor: AMBER,
					color: WHITE,
				},
			},
		],
	}

	presets['trivia_shuffle'] = {
		type: 'button',
		category: 'Trivia',
		name: 'Shuffle Questions',
		style: {
			text: 'SHUFFLE\\nTRIVIA\\nBANK',
			size: '14',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'trivia_shuffle',
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
