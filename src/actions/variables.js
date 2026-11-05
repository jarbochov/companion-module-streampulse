module.exports = function (self, run) {
	return {
		variable_counter: {
			name: 'Variables: Change a counter (increment, decrement, reset)',
			description: 'Increment, decrement or reset a StreamPulse counter (created in the Chat Bot page)',
			options: [
				{ id: 'name', type: 'textinput', label: 'Counter name', default: '' },
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
				{ id: 'amount', type: 'number', label: 'Amount', default: 1, min: 1, max: 100000 },
			],
			callback: async (e) => {
				try {
					await self.api.variable(e.options.name, e.options.action, { amount: e.options.amount })
				} catch (err) {
					self.log('error', err.message)
				}
			},
		},
		variable_set: {
			name: 'Variables: Set a value',
			description: 'Set a StreamPulse variable or counter to a value (created if missing)',
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
