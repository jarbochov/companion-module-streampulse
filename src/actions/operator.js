function operatorProfileChoices(state) {
	const profiles = state?.profiles || []
	return profiles.length
		? profiles.map((p) => ({ id: p.id, label: p.name || p.id }))
		: [{ id: '', label: '(no operator presets found)' }]
}

function operatorRunbookChoices(state) {
	const runbooks = state?.runbooks || []
	return runbooks.length
		? runbooks.map((rb) => ({ id: rb.id, label: rb.name || rb.id }))
		: [{ id: '', label: '(no operator runbooks found)' }]
}

module.exports = function (self, run) {
	const choices = operatorProfileChoices(self.state.operator)
	const runbookChoices = operatorRunbookChoices(self.state.operator)
	return {
		operator_profile_select: {
			name: 'Operator: Switch active preset board',
			description: 'Switch the active Operator Mode preset board live across connected StreamPulse browsers.',
			options: [
				{
					id: 'profile',
					type: 'dropdown',
					label: 'Operator Preset',
					choices,
					default: choices[0].id,
				},
				{
					id: 'customTarget',
					type: 'textinput',
					label: 'Override ID or Name (optional)',
					default: '',
					useVariables: true,
				},
			],
			callback: async ({ options }) =>
				run(async () => {
					const custom = (await self.parseVariablesInString(String(options.customTarget || ''))).trim()
					const target = custom || String(options.profile || '').trim()
					if (!target) throw new Error('Select an Operator preset or provide a preset ID/name')
					return self.api.request('/api/operator/profile/select', {
						method: 'POST',
						body: { id: target },
					})
				})(),
		},
		operator_runbook_toggle: {
			name: 'Operator: Toggle runbook cue',
			description: 'Toggle, check, or uncheck a cue item in an Operator Mode runbook by 1-based cue number or item ID.',
			options: [
				{
					id: 'runbook',
					type: 'dropdown',
					label: 'Runbook',
					choices: runbookChoices,
					default: runbookChoices[0].id,
				},
				{
					id: 'customRunbook',
					type: 'textinput',
					label: 'Override Runbook ID or Name (optional)',
					default: '',
					useVariables: true,
				},
				{
					id: 'targetType',
					type: 'dropdown',
					label: 'Cue selector',
					choices: [
						{ id: 'index', label: '1-based cue index' },
						{ id: 'itemId', label: 'Cue item ID' },
					],
					default: 'index',
				},
				{
					id: 'index',
					type: 'number',
					label: 'Cue index (1-based)',
					default: 1,
					min: 1,
					max: 200,
					isVisible: (options) => options.targetType !== 'itemId',
				},
				{
					id: 'itemId',
					type: 'textinput',
					label: 'Cue item ID (e.g. cue-1)',
					default: '',
					useVariables: true,
					isVisible: (options) => options.targetType === 'itemId',
				},
				{
					id: 'done',
					type: 'dropdown',
					label: 'State',
					choices: [
						{ id: 'toggle', label: 'Toggle' },
						{ id: 'true', label: 'Check (Done)' },
						{ id: 'false', label: 'Uncheck (Not Done)' },
					],
					default: 'toggle',
				},
			],
			callback: async ({ options }) =>
				run(async () => {
					const customRb = (await self.parseVariablesInString(String(options.customRunbook || ''))).trim()
					const target = customRb || String(options.runbook || '').trim()
					if (!target) throw new Error('Select a runbook or provide a runbook ID/name')
					const body = {}
					if (options.targetType === 'itemId') {
						const itemId = (await self.parseVariablesInString(String(options.itemId || ''))).trim()
						if (!itemId) throw new Error('Cue item ID is required')
						body.itemId = itemId
					} else {
						const oneBased = Number(options.index)
						const zeroBased = Math.round(oneBased) - 1
						if (!Number.isInteger(zeroBased) || zeroBased < 0) {
							throw new Error('Cue index must be 1 or greater')
						}
						body.index = zeroBased
					}
					if (options.done === 'true') body.done = true
					else if (options.done === 'false') body.done = false
					return self.api.request(`/api/operator/runbooks/${encodeURIComponent(target)}/toggle`, {
						method: 'POST',
						body,
					})
				})(),
		},
		operator_runbook_reset: {
			name: 'Operator: Reset runbook checks',
			description: 'Clear all completed checkmarks in an Operator Mode runbook.',
			options: [
				{
					id: 'runbook',
					type: 'dropdown',
					label: 'Runbook',
					choices: runbookChoices,
					default: runbookChoices[0].id,
				},
				{
					id: 'customRunbook',
					type: 'textinput',
					label: 'Override Runbook ID or Name (optional)',
					default: '',
					useVariables: true,
				},
				{
					id: 'confirm',
					type: 'checkbox',
					label: 'Confirm resetting all checkmarks in this runbook',
					default: false,
				},
			],
			callback: async ({ options }) => {
				if (!options.confirm) {
					self.log('warn', 'Operator runbook reset ignored: confirm checkbox is unchecked')
					return
				}
				return run(async () => {
					const customRb = (await self.parseVariablesInString(String(options.customRunbook || ''))).trim()
					const target = customRb || String(options.runbook || '').trim()
					if (!target) throw new Error('Select a runbook or provide a runbook ID/name')
					return self.api.request(`/api/operator/runbooks/${encodeURIComponent(target)}/reset`, {
						method: 'POST',
					})
				})()
			},
		},
	}
}

module.exports.operatorProfileChoices = operatorProfileChoices
module.exports.operatorRunbookChoices = operatorRunbookChoices
