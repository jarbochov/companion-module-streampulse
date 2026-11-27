function bingoDisplayChoices(displays) {
	const list = Array.isArray(displays) ? displays : []
	return list.length
		? list.map((d) => ({ id: d.id, label: d.name || d.id }))
		: [{ id: '', label: '(no bingo displays found)' }]
}

module.exports = function (self, run) {
	const choices = bingoDisplayChoices(self.state.bingoDisplays)
	return {
		display_bingo_control: {
			name: 'Display Library: Bingo card toggle / shuffle / reset',
			description: 'Toggle/stamp a cell, shuffle card order, or reset stamps on a saved Display Library Bingo card.',
			options: [
				{
					id: 'display',
					type: 'dropdown',
					label: 'Bingo Display',
					choices,
					default: choices[0].id,
				},
				{
					id: 'customDisplay',
					type: 'textinput',
					label: 'Override Display ID (optional)',
					default: '',
					useVariables: true,
				},
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'toggle', label: 'Toggle / Set Cell Stamp' },
						{ id: 'shuffle', label: 'Shuffle Card (Deal Fresh Order)' },
						{ id: 'reset', label: 'Reset Stamps (Clear Board)' },
					],
					default: 'toggle',
				},
				{
					id: 'cell',
					type: 'number',
					label: 'Cell index (0-based, top-left = 0)',
					default: 0,
					min: 0,
					max: 48,
					isVisible: (options) => options.action === 'toggle',
				},
				{
					id: 'stamped',
					type: 'dropdown',
					label: 'Stamp state',
					choices: [
						{ id: 'toggle', label: 'Toggle' },
						{ id: 'true', label: 'Stamp (On)' },
						{ id: 'false', label: 'Unstamp (Off)' },
					],
					default: 'toggle',
					isVisible: (options) => options.action === 'toggle',
				},
				{
					id: 'confirm',
					type: 'checkbox',
					label: 'Confirm shuffling or resetting this Bingo display',
					default: false,
					isVisible: (options) => options.action !== 'toggle',
				},
			],
			callback: async ({ options }) => {
				const action = options.action === 'shuffle' || options.action === 'reset' ? options.action : 'toggle'
				if (action !== 'toggle' && !options.confirm) {
					self.log('warn', 'Display Library Bingo shuffle/reset ignored: confirm checkbox is unchecked')
					return
				}
				return run(async () => {
					const custom = (await self.parseVariablesInString(String(options.customDisplay || ''))).trim()
					const displayId = custom || String(options.display || '').trim()
					if (!displayId) throw new Error('Select a Bingo display or provide a display ID')
					if (action === 'shuffle' || action === 'reset') {
						return self.api.request(`/api/variable-displays/${encodeURIComponent(displayId)}/bingo/${action}`, {
							method: 'POST',
						})
					}
					const cell = Number(options.cell)
					if (!Number.isInteger(cell) || cell < 0) throw new Error('Valid 0-based cell index is required')
					const body = { cell }
					if (options.stamped === 'true') body.stamped = true
					else if (options.stamped === 'false') body.stamped = false
					return self.api.request(`/api/variable-displays/${encodeURIComponent(displayId)}/bingo/toggle`, {
						method: 'POST',
						body,
					})
				})()
			},
		},
	}
}

module.exports.bingoDisplayChoices = bingoDisplayChoices
