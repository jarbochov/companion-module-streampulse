module.exports = function (self, run) {
	return {
		variable_counter: {
			name: 'Variables: Number counter controls (increment, decrement, reset)',
			description:
				'Change a Number variable using its saved bounds and precision; reset uses its explicit reset value. Legacy counters remain supported.',
			options: [
				{ id: 'name', type: 'textinput', label: 'Number variable name', default: '' },
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
				{ id: 'name', type: 'textinput', label: 'Variable name', default: '' },
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
			options: [{ id: 'name', type: 'textinput', label: 'List variable name', default: '' }],
			callback: async (e) => run(() => self.api.variableRoll(e.options.name))(),
		},
	}
}
