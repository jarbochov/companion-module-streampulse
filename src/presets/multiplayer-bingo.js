const { GREEN, RED, AMBER, BLUE, WHITE, DARK_GRAY } = require('./colors')

module.exports = function () {
	const presets = {}

	presets['mp_bingo_lock_toggle'] = {
		type: 'button',
		category: 'Multiplayer Bingo',
		name: 'Toggle Player Stamping Lock',
		style: {
			text: 'BINGO\\nLOCK\\n$(streampulse:multiplayer_bingo_locked)',
			size: '14',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [{ actionId: 'multiplayer_bingo_flags', options: { field: 'locked', mode: 'toggle' } }],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'multiplayer_bingo_locked',
				options: {},
				style: {
					text: 'BINGO\\nLOCKED',
					bgcolor: AMBER,
					color: WHITE,
					size: '14',
				},
			},
		],
	}

	presets['mp_bingo_hide_toggle'] = {
		type: 'button',
		category: 'Multiplayer Bingo',
		name: 'Toggle Overlay Visibility',
		style: {
			text: 'BINGO\\nSHOWN',
			size: '14',
			color: WHITE,
			bgcolor: GREEN,
		},
		steps: [
			{
				down: [{ actionId: 'multiplayer_bingo_flags', options: { field: 'hidden', mode: 'toggle' } }],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'multiplayer_bingo_hidden',
				options: {},
				style: {
					text: 'BINGO\\nHIDDEN',
					bgcolor: RED,
					color: WHITE,
					size: '14',
				},
			},
		],
	}

	presets['mp_bingo_four_corners_toggle'] = {
		type: 'button',
		category: 'Multiplayer Bingo',
		name: 'Toggle Four Corners Win Mode',
		style: {
			text: 'BINGO\\n4 CORNERS\\n$(streampulse:mp_bingo_four_corners)',
			size: '12',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [{ actionId: 'multiplayer_bingo_flags', options: { field: 'fourCorners', mode: 'toggle' } }],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'mp_bingo_four_corners',
				options: {},
				style: {
					bgcolor: BLUE,
					color: WHITE,
				},
			},
		],
	}

	presets['mp_bingo_confirm_calls_toggle'] = {
		type: 'button',
		category: 'Multiplayer Bingo',
		name: 'Toggle Host Confirm Calls Mode',
		style: {
			text: 'BINGO\\nHOST\\nCONFIRM',
			size: '12',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [{ actionId: 'multiplayer_bingo_flags', options: { field: 'confirmCalls', mode: 'toggle' } }],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'mp_bingo_confirm_calls',
				options: {},
				style: {
					bgcolor: BLUE,
					color: WHITE,
				},
			},
		],
	}

	presets['mp_bingo_confirm_all_pending'] = {
		type: 'button',
		category: 'Multiplayer Bingo',
		name: 'Confirm All Pending Calls',
		style: {
			text: 'BINGO\\nCONFIRM\\n$(streampulse:mp_bingo_pending_count) PEND',
			size: '12',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [{ actionId: 'multiplayer_bingo_pending', options: { action: 'confirm', scope: 'all' } }],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'mp_bingo_pending_calls',
				options: {},
				style: {
					bgcolor: AMBER,
					color: WHITE,
				},
			},
		],
	}

	presets['mp_bingo_dismiss_all_pending'] = {
		type: 'button',
		category: 'Multiplayer Bingo',
		name: 'Dismiss All Pending Calls',
		style: {
			text: 'BINGO\\nDISMISS\\nALL',
			size: '14',
			color: WHITE,
			bgcolor: RED,
		},
		steps: [
			{
				down: [{ actionId: 'multiplayer_bingo_pending', options: { action: 'dismiss', scope: 'all' } }],
				up: [],
			},
		],
		feedbacks: [],
	}

	return presets
}
