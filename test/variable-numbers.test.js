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

test('Standalone toggle, select and tags variable actions hit toggle, next, prev and clear endpoints', async () => {
	const calls = []
	const errors = []
	const self = {
		api: { variable: async (...args) => calls.push(args) },
		parseVariablesInString: async (v) => v,
		log: (level, msg) => errors.push([level, msg]),
	}
	const run = (fn) => async () => {
		try {
			await fn()
		} catch (err) {
			self.log('error', err.message)
		}
	}
	const defs = actions(self, run)

	await defs.variable_toggle.callback({ options: { name: 'mic_live', tag: '' } })
	await defs.variable_toggle.callback({ options: { name: 'badges', tag: 'vip' } })
	await defs.variable_select_step.callback({ options: { name: 'camera_mode', direction: 'next' } })
	await defs.variable_select_step.callback({ options: { name: 'camera_mode', direction: 'prev' } })
	await defs.variable_tags_clear.callback({ options: { name: 'badges' } })

	assert.deepEqual(calls, [
		['mic_live', 'toggle', {}],
		['badges', 'toggle', { value: 'vip' }],
		['camera_mode', 'next', {}],
		['camera_mode', 'prev', {}],
		['badges', 'clear', {}],
	])

	await defs.variable_toggle.callback({ options: { name: '   ', tag: '' } })
	assert.equal(errors.length, 1)
	assert.equal(errors[0][0], 'error')
})
