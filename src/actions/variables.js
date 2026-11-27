module.exports = function (self, run) {
	return {
		variable_counter: {
			name: 'Variables: Number counter controls (increment, decrement, reset)',
			description:
				'Change a Number variable using its saved bounds and precision; reset uses its explicit reset value. Legacy counters remain supported.',
			options: [
				{ id: 'name', type: 'textinput', label: 'Number API name (without group prefix)', default: '' },
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					default: 'increment',
					choices: [
						{ id: 'increment', label: 'Increment' },
						{ id: 'decrement', label: 'Decrement' },
						{ id: 'reset', label: 'Reset' },
					],
				},
				{
					id: 'use_saved_step',
					type: 'checkbox',
					label: 'Use saved Number step',
					default: false,
					isVisible: (options) => options.action !== 'reset',
				},
				{
					id: 'amount',
					type: 'number',
					label: 'Amount',
					default: 1,
					min: 0.000000000001,
					max: 100000,
					isVisible: (options) => !options.use_saved_step && options.action !== 'reset',
				},
			],
			callback: async (e) => {
				try {
					await self.api.variable(
						e.options.name,
						e.options.action,
						e.options.use_saved_step || e.options.action === 'reset' ? {} : { amount: e.options.amount },
					)
				} catch (err) {
					self.log('error', err.message)
				}
			},
		},
		variable_set: {
			name: 'Variables: Set a value',
			description:
				'Set a StreamPulse variable value. Existing Numbers retain bounds, precision, reset value and group membership.',
			options: [
				{ id: 'name', type: 'textinput', label: 'Variable API name (without group prefix)', default: '' },
				{ id: 'value', type: 'textinput', label: 'Value', default: '', useVariables: true },
			],
			callback: async (e) => {
				try {
					await self.api.variable(e.options.name, 'set', { value: await self.parseVariablesInString(e.options.value) })
				} catch (err) {
					self.log('error', err.message)
				}
			},
		},
		variable_roll: {
			name: 'Variables: Roll list / topic',
			description: 'Advance or randomize a StreamPulse list variable (e.g. topic list, challenge wheel)',
			options: [{ id: 'name', type: 'textinput', label: 'List API name (without group prefix)', default: '' }],
			callback: async (e) => run(() => self.api.variableRoll(e.options.name))(),
		},
		variable_toggle: {
			name: 'Variables: Toggle boolean or tag',
			description: 'Toggle a boolean toggle variable (leave Tag blank) or toggle a specific tag on a tags variable.',
			options: [
				{ id: 'name', type: 'textinput', label: 'Variable API name (without group prefix)', default: '' },
				{
					id: 'tag',
					type: 'textinput',
					label: 'Tag value (blank = toggle boolean)',
					default: '',
					useVariables: true,
				},
			],
			callback: async (e) =>
				run(async () => {
					const name = String(e.options.name || '').trim()
					if (!name) throw new Error('Variable API name is required')
					const tag = (await self.parseVariablesInString(String(e.options.tag || ''))).trim()
					return self.api.variable(name, 'toggle', tag ? { value: tag } : {})
				})(),
		},
		variable_select_step: {
			name: 'Variables: Cycle select variable (next / prev)',
			description: 'Advance a StreamPulse select variable to the next or previous configured option.',
			options: [
				{ id: 'name', type: 'textinput', label: 'Select API name (without group prefix)', default: '' },
				{
					id: 'direction',
					type: 'dropdown',
					label: 'Direction',
					default: 'next',
					choices: [
						{ id: 'next', label: 'Next option' },
						{ id: 'prev', label: 'Previous option' },
					],
				},
			],
			callback: async (e) =>
				run(async () => {
					const name = String(e.options.name || '').trim()
					if (!name) throw new Error('Select variable API name is required')
					const dir = e.options.direction === 'prev' ? 'prev' : 'next'
					return self.api.variable(name, dir, {})
				})(),
		},
		variable_tags_clear: {
			name: 'Variables: Clear all tags',
			description: 'Remove all active tags from a StreamPulse tags variable.',
			options: [{ id: 'name', type: 'textinput', label: 'Tags API name (without group prefix)', default: '' }],
			callback: async (e) =>
				run(async () => {
					const name = String(e.options.name || '').trim()
					if (!name) throw new Error('Tags variable API name is required')
					return self.api.variable(name, 'clear', {})
				})(),
		},
	}
}
