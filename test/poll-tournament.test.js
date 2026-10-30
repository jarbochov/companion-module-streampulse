const assert = require('node:assert/strict')
const { test } = require('node:test')
const defineActions = require('../src/actions')
const { StreamPulseApi } = require('../src/api')

function createModuleMock(presets = []) {
	const calls = []
	const errors = []
	const api = new StreamPulseApi('localhost', 3000)
	api.request = async (path, options = {}) => {
		calls.push({ path, ...options })
		return path.endsWith('/presets') && !options.method ? { status: 'ok', presets } : { status: 'ok' }
	}
	const self = {
		state: {
			timers: {},
			goals: [],
			rules: [],
			chatChoices: [],
			randomizerPresets: [],
			overlayVisibility: [],
			pages: {},
			slideshows: [],
			videos: [],
			cutouts: [],
		},
		api,
		calls,
		errors,
		pollCount: 0,
		async parseVariablesInString(value) {
			return value.replace('$(custom:name)', 'Friday bracket').replace('$(custom:id)', 'saved-id')
		},
		setActionDefinitions(definitions) {
			self.actions = definitions
		},
		poll() {
			self.pollCount++
		},
		log(level, message) {
			errors.push({ level, message })
		},
	}
	defineActions(self)
	return self
}

test('Poll Tournament saves templates and checkpoints without fetching library lists', async () => {
	const self = createModuleMock()
	assert.equal(self.calls.length, 0)
	await self.actions.poll_tournament_save_template.callback({ options: { name: '  $(custom:name)  ' } })
	await self.actions.poll_tournament_save_checkpoint.callback({ options: { name: '' } })
	assert.deepEqual(self.calls, [
		{
			path: '/api/polls/tournament/presets',
			method: 'POST',
			body: { name: 'Friday bracket', fromActive: true },
		},
		{ path: '/api/polls/tournament/checkpoints', method: 'POST', body: { name: '' } },
	])
	assert.equal(self.pollCount, 2)
	assert.deepEqual(self.errors, [])
})

test('Destructive Poll Tournament actions require an explicitly checked confirmation and nonempty ID', async () => {
	const self = createModuleMock()
	for (const key of ['poll_tournament_restore', 'poll_tournament_create_from_template']) {
		const action = self.actions[key]
		assert.equal(action.options.find((option) => option.id === 'confirm').default, false)
		for (const confirm of [undefined, false, 'true']) {
			await action.callback({ options: { id: 'saved-id', confirm } })
			assert.match(self.errors.at(-1).message, /Confirm replacing/)
		}
		await action.callback({ options: { id: '  ', confirm: true } })
		assert.match(self.errors.at(-1).message, /ID is required/)
	}
	assert.deepEqual(self.calls, [])
	assert.equal(self.pollCount, 0)
})

test('Poll Tournament restore sends only the saved ID to the poll history endpoint', async () => {
	const self = createModuleMock()
	await self.actions.poll_tournament_restore.callback({
		options: { id: '  $(custom:id)  ', confirm: true },
	})
	assert.deepEqual(self.calls, [
		{ path: '/api/polls/tournament/history/restore', method: 'POST', body: { id: 'saved-id' } },
	])
	assert.equal(self.pollCount, 1)
	assert.deepEqual(self.errors, [])
})

test('Fresh Poll Tournament creation fetches the selected template on press without reusing identity or progress', async () => {
	const template = {
		id: 'saved-id',
		name: 'Saved template',
		title: 'Friday bracket',
		entrants: ['Red', 'Blue'],
		format: 'single',
		logo: '/media/logo.svg',
		logoSize: 0,
		matchDuration: 45,
		blind: false,
		subMultiplier: 2,
		announceChat: false,
		roundRobinLegs: 2,
		pointsSystem: 'custom',
		pointsPerWin: 3,
		pointsPerDraw: 1,
		pointsPerLoss: 0,
		allowDraws: true,
		progressionMode: 'manual',
		scoringType: 'rounds',
		bestOf: 5,
		isPoll: false,
		matches: [{ winner: 'Red' }],
		status: 'COMPLETED',
		voters: { viewer: 'Red' },
	}
	const self = createModuleMock([{ id: 'other', title: 'Wrong template' }, template])
	assert.deepEqual(self.calls, [])
	await self.actions.poll_tournament_create_from_template.callback({
		options: { id: ' $(custom:id) ', confirm: true },
	})
	assert.deepEqual(self.calls, [
		{ path: '/api/polls/tournament/presets' },
		{
			path: '/api/polls/tournament/create',
			method: 'POST',
			body: {
				title: 'Friday bracket',
				entrants: ['Red', 'Blue'],
				format: 'single',
				logo: '/media/logo.svg',
				logoSize: 0,
				matchDuration: 45,
				blind: false,
				subMultiplier: 2,
				announceChat: false,
				roundRobinLegs: 2,
				pointsSystem: 'custom',
				pointsPerWin: 3,
				pointsPerDraw: 1,
				pointsPerLoss: 0,
				allowDraws: true,
				progressionMode: 'vote',
				scoringType: 'points',
				bestOf: 0,
				isPoll: true,
			},
		},
	])
	assert.equal(template.progressionMode, 'manual')
	assert.equal(self.pollCount, 1)
	assert.deepEqual(self.errors, [])
})

test('A deleted Poll Tournament template never falls back to creating another bracket', async () => {
	const self = createModuleMock()
	await self.actions.poll_tournament_create_from_template.callback({
		options: { id: 'missing', confirm: true },
	})
	assert.deepEqual(self.calls, [{ path: '/api/polls/tournament/presets' }])
	assert.match(self.errors[0].message, /template not found: missing/)
	assert.equal(self.pollCount, 0)
})

test('Active ballot HTTP errors are logged for restore and fresh create without refreshing as a success', async (t) => {
	const self = createModuleMock()
	self.api.request = StreamPulseApi.prototype.request.bind(self.api)
	const requests = []
	t.mock.method(globalThis, 'fetch', async (url, options) => {
		requests.push({ url, method: options.method })
		if (options.method === 'GET') {
			return new Response(JSON.stringify({ status: 'ok', presets: [{ id: 'saved-id', entrants: ['Red', 'Blue'] }] }))
		}
		return new Response(JSON.stringify({ error: 'Cannot replace while a vote is active' }), { status: 409 })
	})
	for (const key of ['poll_tournament_restore', 'poll_tournament_create_from_template']) {
		await self.actions[key].callback({ options: { id: 'saved-id', confirm: true } })
	}
	assert.deepEqual(requests, [
		{ url: 'http://localhost:3000/api/polls/tournament/history/restore', method: 'POST' },
		{ url: 'http://localhost:3000/api/polls/tournament/presets', method: 'GET' },
		{ url: 'http://localhost:3000/api/polls/tournament/create', method: 'POST' },
	])
	assert.deepEqual(self.errors, [
		{ level: 'error', message: 'Cannot replace while a vote is active' },
		{ level: 'error', message: 'Cannot replace while a vote is active' },
	])
	assert.equal(self.pollCount, 0)
})
