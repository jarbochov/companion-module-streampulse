const assert = require('node:assert/strict')
const { test } = require('node:test')
const defineActions = require('../src/actions')
const { StreamPulseApi } = require('../src/api')

test('Race controls address each selected runner without one-based competitor ambiguity', async () => {
	const calls = []
	const api = new StreamPulseApi('localhost', 3000)
	api.request = async (path, options) => {
		calls.push({ path, ...options })
		return { status: 'ok' }
	}
	const self = {
		state: {
			timers: {},
			goals: [],
			rules: [],
			pages: {},
			slideshows: [],
			videos: [],
			cutouts: [],
			overlayVisibility: [],
		},
		api,
		setActionDefinitions(actions) {
			this.actions = actions
		},
		poll() {},
		log(level, message) {
			assert.fail(`${level}: ${message}`)
		},
	}
	defineActions(self)
	for (const action of ['finish', 'toggle', 'reset']) {
		for (const runner of [0, 1, 2, 3]) {
			await self.actions.matchup_runner.callback({ options: { action, runner } })
			assert.deepEqual(calls.at(-1), {
				path: `/api/matchup/clock/race/${action}`,
				method: 'POST',
				body: { index: runner },
			})
		}
	}
})
