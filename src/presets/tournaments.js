const { GREEN, RED, BLUE, PURPLE, WHITE, DARK_GRAY } = require('./colors')

module.exports = function () {
	const presets = {}

	presets['tournament_e1_score_up'] = {
		type: 'button',
		category: 'Tournaments',
		name: 'Tournament: Entrant 1 Game +1',
		style: {
			text: '$(streampulse:tournament_e1_name)\\nSCORE: $(streampulse:tournament_e1_score)\\n+1 GAME',
			size: '12',
			color: WHITE,
			bgcolor: RED,
		},
		steps: [
			{
				down: [
					{
						actionId: 'tournament_score',
						options: { matchId: '', entrant: 0, target: 'game', delta: 1 },
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['tournament_e2_score_up'] = {
		type: 'button',
		category: 'Tournaments',
		name: 'Tournament: Entrant 2 Game +1',
		style: {
			text: '$(streampulse:tournament_e2_name)\\nSCORE: $(streampulse:tournament_e2_score)\\n+1 GAME',
			size: '12',
			color: WHITE,
			bgcolor: BLUE,
		},
		steps: [
			{
				down: [
					{
						actionId: 'tournament_score',
						options: { matchId: '', entrant: 1, target: 'game', delta: 1 },
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['tournament_e1_round_up'] = {
		type: 'button',
		category: 'Tournaments',
		name: 'Tournament: Entrant 1 Round +1',
		style: {
			text: '$(streampulse:tournament_e1_name)\\nRND: $(streampulse:tournament_e1_rounds)\\n+1 RND',
			size: '12',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'tournament_score',
						options: { matchId: '', entrant: 0, target: 'round', delta: 1 },
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['tournament_e2_round_up'] = {
		type: 'button',
		category: 'Tournaments',
		name: 'Tournament: Entrant 2 Round +1',
		style: {
			text: '$(streampulse:tournament_e2_name)\\nRND: $(streampulse:tournament_e2_rounds)\\n+1 RND',
			size: '12',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'tournament_score',
						options: { matchId: '', entrant: 1, target: 'round', delta: 1 },
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['tournament_advance_winner'] = {
		type: 'button',
		category: 'Tournaments',
		name: 'Tournament: Confirm & Advance Winner',
		style: {
			text: 'ADVANCE\\nWINNER\\n$(streampulse:tournament_round)',
			size: '12',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'tournament_advance',
						options: { matchId: '', winner: 'auto' },
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'tournament_win_ready',
				options: {},
				style: {
					text: 'ADVANCE\\n$(streampulse:tournament_pending_winner)\\nTARGET MET',
					bgcolor: GREEN,
					color: WHITE,
					size: '10',
				},
			},
		],
	}

	presets['tournament_next_match'] = {
		type: 'button',
		category: 'Tournaments',
		name: 'Tournament: Next Ready Match',
		style: {
			text: 'NEXT\\nMATCH\\n$(streampulse:tournament_round)',
			size: '12',
			color: WHITE,
			bgcolor: PURPLE,
		},
		steps: [
			{
				down: [
					{
						actionId: 'tournament_control',
						options: { action: 'next_match', matchId: '' },
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['tournament_toggle_highlight'] = {
		type: 'button',
		category: 'Tournaments',
		name: 'Tournament: Toggle Live Bracket Highlight',
		style: {
			text: 'BRACKET\\nLIVE GLOW\\nTOGGLE',
			size: '12',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'tournament_control',
						options: { action: 'toggle_highlight', matchId: '' },
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['tournament_toggle_focus'] = {
		type: 'button',
		category: 'Tournaments',
		name: 'Tournament: Toggle Camera Focus',
		style: {
			text: 'BRACKET\\nCAMERA\\nFOCUS',
			size: '12',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'tournament_view',
						options: {
							target: 'versus',
							focus: 'toggle',
							round: 'no_change',
							bracket: 'no_change',
							glide: 'no_change',
							matchId: '',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'tournament_focus_active',
				options: { target: 'versus' },
				style: {
					bgcolor: BLUE,
					color: WHITE,
					text: 'BRACKET\\nCAMERA\\nZOOMED',
				},
			},
		],
	}

	presets['tournament_round_next'] = {
		type: 'button',
		category: 'Tournaments',
		name: 'Tournament: Camera Next Round',
		style: {
			text: 'BRACKET\\nROUND\\nNEXT >',
			size: '12',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'tournament_view',
						options: {
							target: 'versus',
							focus: 'no_change',
							round: 'next',
							bracket: 'no_change',
							glide: 'no_change',
							matchId: '',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['tournament_round_prev'] = {
		type: 'button',
		category: 'Tournaments',
		name: 'Tournament: Camera Previous Round',
		style: {
			text: 'BRACKET\\nROUND\\n< PREV',
			size: '12',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'tournament_view',
						options: {
							target: 'versus',
							focus: 'no_change',
							round: 'prev',
							bracket: 'no_change',
							glide: 'no_change',
							matchId: '',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['tournament_cycle_bracket'] = {
		type: 'button',
		category: 'Tournaments',
		name: 'Tournament: Cycle Section (Winners/Losers/Finals)',
		style: {
			text: 'BRACKET\\nSECTION\\nCYCLE',
			size: '12',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'tournament_view',
						options: {
							target: 'versus',
							focus: 'no_change',
							round: 'no_change',
							bracket: 'cycle',
							glide: 'no_change',
							matchId: '',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['poll_tournament_toggle_focus'] = {
		type: 'button',
		category: 'Polls & Trivia',
		name: 'Poll Tournament: Toggle Camera Focus',
		style: {
			text: 'AUDIENCE\\nBRACKET\\nFOCUS',
			size: '12',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'tournament_view',
						options: {
							target: 'poll',
							focus: 'toggle',
							round: 'no_change',
							bracket: 'no_change',
							glide: 'no_change',
							matchId: '',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'tournament_focus_active',
				options: { target: 'poll' },
				style: {
					bgcolor: BLUE,
					color: WHITE,
					text: 'AUDIENCE\\nBRACKET\\nZOOMED',
				},
			},
		],
	}

	return presets
}
