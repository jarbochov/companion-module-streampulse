const { GREEN, RED, AMBER, BLUE, WHITE, DARK_GRAY } = require('./colors')

module.exports = function () {
	const presets = {}

	presets['tier_vote_start'] = {
		type: 'button',
		category: 'Tier Maker',
		name: 'Start Vote (Next Unranked)',
		style: {
			text: 'TIER\\nVOTE\\nSTART',
			size: '14',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'tier_vote_start',
						options: { item: '', duration: 60, mode: '' },
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'tier_voting_active',
				options: {},
				style: {
					text: 'VOTING\\n$(streampulse:tier_item)\\n$(streampulse:tier_time)s',
					bgcolor: BLUE,
					color: WHITE,
					size: '12',
				},
			},
		],
	}

	presets['tier_vote_lock'] = {
		type: 'button',
		category: 'Tier Maker',
		name: 'Lock Voting',
		style: {
			text: 'TIER\\nLOCK\\nVOTES',
			size: '14',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [
					{
						actionId: 'tier_vote_lock',
						options: {},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'tier_vote_locked',
				options: {},
				style: {
					text: 'LOCKED\\n$(streampulse:tier_consensus)\\n$(streampulse:tier_votes) v',
					bgcolor: AMBER,
					color: WHITE,
					size: '12',
				},
			},
		],
	}

	presets['tier_vote_place'] = {
		type: 'button',
		category: 'Tier Maker',
		name: 'Place in Consensus Tier',
		style: {
			text: 'LOCK &\\nPLACE\\n$(streampulse:tier_consensus)',
			size: '14',
			color: WHITE,
			bgcolor: GREEN,
		},
		steps: [
			{
				down: [
					{
						actionId: 'tier_vote_end',
						options: { apply: 'true' },
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['tier_vote_cancel'] = {
		type: 'button',
		category: 'Tier Maker',
		name: 'Cancel Active Vote',
		style: {
			text: 'CANCEL\\nTIER\\nVOTE',
			size: '14',
			color: WHITE,
			bgcolor: RED,
		},
		steps: [
			{
				down: [
					{
						actionId: 'tier_vote_cancel',
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
