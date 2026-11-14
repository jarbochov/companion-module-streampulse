const test = require('node:test')
const assert = require('node:assert/strict')
const actions = require('../src/actions/variables')

test('Number actions preserve explicit amounts and optionally use the saved step', async () => {
	const calls = []
	const self = { api: { variable: async (...args) => calls.push(args) }, log: () => {} }
	const controls = actions(self, () => {})['variable_counter']
	await controls.callback({ options: { name: 'score', action: 'increment', amount: 0.25 } })
	await controls.callback({ options: { name: 'score', action: 'decrement', amount: 1, use_saved_step: true } })
	await controls.callback({ options: { name: 'score', action: 'reset', amount: 1 } })
	assert.deepEqual(calls, [
		['score', 'increment', { amount: 0.25 }],
		['score', 'decrement', {}],
		['score', 'reset', {}],
	])
})
