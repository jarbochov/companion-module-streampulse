const { BLUE, RED, WHITE, DARK_GRAY } = require('./colors')

module.exports = function (self) {
	const presets = {}
	const firstRunbook = self?.state?.operator?.runbooks?.[0]?.id || ''

	presets['operator_active_board'] = {
		type: 'button',
		category: 'Operator',
		name: 'Active Operator Board Status',
		style: {
			text: 'OPERATOR\\n$(streampulse:operator_profile)\\n$(streampulse:operator_runbooks_count) RB',
			size: '12',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [{ down: [], up: [] }],
		feedbacks: [],
	}

	presets['operator_runbook_toggle_cue1'] = {
		type: 'button',
		category: 'Operator',
		name: 'Toggle Runbook Cue #1',
		style: {
			text: 'RUNBOOK\\nTOGGLE\\nCUE #1',
			size: '14',
			color: WHITE,
			bgcolor: BLUE,
		},
		steps: [
			{
				down: [
					{
						actionId: 'operator_runbook_toggle',
						options: {
							runbook: firstRunbook,
							customRunbook: '',
							targetType: 'index',
							index: 1,
							itemId: '',
							done: 'toggle',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['operator_runbook_reset'] = {
		type: 'button',
		category: 'Operator',
		name: 'Reset Runbook Checks',
		style: {
			text: 'RUNBOOK\\nRESET\\nCHECKS',
			size: '14',
			color: WHITE,
			bgcolor: RED,
		},
		steps: [
			{
				down: [
					{
						actionId: 'operator_runbook_reset',
						options: {
							runbook: firstRunbook,
							customRunbook: '',
							confirm: false,
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
