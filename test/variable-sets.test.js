const assert = require('node:assert/strict')
const { test } = require('node:test')
const { StreamPulseApi } = require('../src/api')
const defineActions = require('../src/actions')
const defineFeedbacks = require('../src/feedbacks')
const definePresets = require('../src/presets')
const { defineVariables, updateVariables } = require('../src/variables')

const sets = () => [
	{
		id: 'casters',
		name: 'Casters',
		slotsCount: 2,
		roster: [
			{ id: 'alex', label: 'Alex' },
			{ id: 'sam', label: 'Sam' },
		],
		slots: ['alex', 'sam'],
		activeEntry: '',
		rotation: { enabled: true, entryId: 'sam' },
	},
	{ id: 'guest', name: 'Guest', slotsCount: 0, roster: [{ id: 'lee', label: 'Lee' }], slots: [], activeEntry: 'lee' },
]
function mock() {
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
			status: null,
			alerts: null,
			variableSets: sets(),
		},
		calls: [],
		api: {
			async variableSetControl(...args) {
				self.calls.push(args)
			},
		},
		async parseVariablesInString(value) {
			return value.replace('$(test:entry)', 'Alex')
		},
		setActionDefinitions(value) {
			self.actions = value
		},
		setFeedbackDefinitions(value) {
			self.feedbacks = value
		},
		setPresetDefinitions(value) {
			self.presets = value
		},
		setVariableDefinitions(value) {
			self.definitions = value
		},
		setVariableValues(value) {
			self.values = value
		},
		async poll() {
			self.polls = (self.polls || 0) + 1
		},
		log(level, message) {
			throw new Error(`${level}: ${message}`)
		},
	}
	return self
}

test('Variable Set API encodes IDs and sends JSON without altering empty entries', async () => {
	const api = new StreamPulseApi('localhost', 3000)
	const calls = []
	api.request = async (...args) => {
		calls.push(args)
		return { sets: [] }
	}
	await api.variableSets()
	await api.variableSetControl('set / one', 'assign', { slot: 'Left', entry: '' })
	await api.variableSetControl('set / one', 'rotation/next')
	assert.deepEqual(calls, [
		['/api/variables'],
		['/api/variables/sets/set%20%2F%20one/assign', { method: 'POST', body: { slot: 'Left', entry: '' } }],
		['/api/variables/sets/set%20%2F%20one/rotation/next', { method: 'POST', body: {} }],
	])
})

test('Variable Set discovery falls back for older variable responses', async () => {
	const api = new StreamPulseApi('localhost', 3000)
	const calls = []
	api.request = async (path) => {
		calls.push(path)
		return path === '/api/variables' ? { variables: [] } : { sets: [{ id: 'legacy' }] }
	}
	assert.deepEqual(await api.variableSets(), { sets: [{ id: 'legacy' }] })
	assert.deepEqual(calls, ['/api/variables', '/api/variables/sets'])
})

test('tracker actions select discovered fields and items and address entry, slot or all owners', async () => {
	const self = mock()
	self.state.variableSets[0].fields = [{ id: 'progress', label: 'Progress', type: 'checklist', targetSet: 'games' }]
	self.state.variableSets.push({
		id: 'games',
		name: 'Games',
		roster: [{ id: 'game/1', label: 'First game' }],
	})
	defineActions(self)
	const item = JSON.stringify(['casters', 'progress', 'game/1'])
	const tracker = JSON.stringify(['casters', 'progress'])
	assert.deepEqual(self.actions.variable_set_tracker_set.options[0].choices, [
		{ id: item, label: 'Casters / Progress / First game' },
	])
	assert.deepEqual(self.actions.variable_set_tracker_reset.options[0].choices, [
		{ id: tracker, label: 'Casters / Progress' },
	])
	const invoke = (id, options) => self.actions[`variable_set_tracker_${id}`].callback({ options })
	await invoke('set', { tracker: item, scope: 'entry', owner: '$(test:entry)', value: '2' })
	await invoke('step', { tracker: item, scope: 'slot', owner: 'Left', delta: '-1' })
	await invoke('toggle', { tracker: item, scope: 'entry', owner: 'alex' })
	await invoke('reset', { tracker, scope: 'slot', owner: '2' })
	await invoke('reset', { tracker, scope: 'all', owner: 'ignored' })
	assert.deepEqual(self.calls, [
		['casters', 'checklist/set', { field: 'progress', target: 'game/1', entry: 'Alex', value: 2 }],
		['casters', 'checklist/step', { field: 'progress', target: 'game/1', slot: 'Left', delta: -1 }],
		['casters', 'checklist/toggle', { field: 'progress', target: 'game/1', entry: 'alex' }],
		['casters', 'checklist/reset', { field: 'progress', slot: '2' }],
		['casters', 'checklist/reset', { field: 'progress', all: true }],
	])
	assert.equal(self.polls, 5)
})

test('Variable Set actions use discovered choices and correct command payloads', async () => {
	const self = mock()
	defineActions(self)
	assert.deepEqual(self.actions.variable_set_assign.options[0].choices, [
		{ id: 'casters', label: 'Casters' },
		{ id: 'guest', label: 'Guest' },
	])
	const invoke = async (id, options) =>
		self.actions[`variable_set_${id}`].callback({ options: { set: 'casters', ...options } })
	await invoke('assign', { slot: 'Left', entry: '$(test:entry)' })
	await invoke('assign', { slot: '1', entry: '' })
	await invoke('clear', { slot: 'all' })
	await invoke('next', { slot: '2' })
	await invoke('prev', { slot: 'Left' })
	await invoke('advance', { mode: 'page' })
	await invoke('rewind', { mode: 'shift' })
	await invoke('swap', { from: '1', to: '2' })
	await invoke('entry_toggle', { entry: 'alex', enabled: 'toggle' })
	await invoke('entry_toggle', { entry: 'sam', enabled: 'false' })
	await invoke('queue_add', { slot: '2', entry: 'alex' })
	await invoke('queue_remove', { slot: '2', index: '0' })
	await invoke('queue_clear', { slot: 'all' })
	for (const action of ['start', 'stop', 'toggle', 'next', 'prev']) await invoke(`rotation_${action}`, {})
	await invoke('rotation_configure', { intervalSeconds: 20, mode: 'random' })
	assert.deepEqual(
		self.calls.map(([, action, body]) => [action, body]),
		[
			['assign', { slot: 'Left', entry: 'Alex' }],
			['assign', { slot: '1', entry: '' }],
			['clear', { slot: 'all' }],
			['next', { slot: '2' }],
			['prev', { slot: 'Left' }],
			['advance', { mode: 'page' }],
			['rewind', { mode: 'shift' }],
			['swap', { from: '1', to: '2' }],
			['entry/toggle', { entry: 'alex' }],
			['entry/toggle', { entry: 'sam', enabled: false }],
			['queue/add', { slot: '2', entry: 'alex' }],
			['queue/remove', { slot: '2', index: '0' }],
			['queue/clear', { slot: 'all' }],
			...['start', 'stop', 'toggle', 'next', 'prev'].map((action) => [`rotation/${action}`, {}]),
			['rotation', { intervalSeconds: 20, mode: 'random' }],
		],
	)
	assert.equal(self.polls, self.calls.length)
})

test('Variable Set values, definitions, feedbacks and presets follow shape and state', async () => {
	const self = mock()
	defineVariables(self)
	updateVariables(self)
	await defineFeedbacks(self)
	definePresets(self)
	assert.ok(Array.isArray(self.definitions))
	assert.deepEqual(Object.fromEntries(Object.entries(self.values).filter(([id]) => id.startsWith('set_'))), {
		set_casters_rotation: 'on',
		set_casters_rotation_entry: 'Sam',
		set_casters_active: 'Alex',
		set_casters_slot1: 'Alex',
		set_casters_slot2: 'Sam',
		set_guest_rotation: 'off',
		set_guest_rotation_entry: '',
		set_guest_active: 'Lee',
	})
	const active = (set, entry, source = 'any') =>
		self.feedbacks.variable_set_entry_active.callback({ options: { set, entry, source } })
	assert.equal(self.feedbacks.variable_set_rotating.callback({ options: { set: 'guest' } }), false)
	assert.equal(self.feedbacks.variable_set_rotating.callback({ options: { set: 'casters' } }), true)
	assert.equal(active('casters', 'sam', 'rotation'), true)
	assert.equal(active('casters', 'Alex', 'slots'), true)
	assert.equal(active('casters', 'Alex', 'rotation'), false)
	assert.equal(active('guest', 'lee', 'active'), true)
	assert.equal(active('guest', '', 'any'), false)
	assert.equal(active('guest', 'lee', 'rotation'), false)
	assert.equal(active('missing', 'lee'), false)
	assert.equal(self.presets.variable_set_rotation_casters.steps[0].down[0].actionId, 'variable_set_rotation_toggle')
	self.state.variableSets[0].name = 'Renamed'
	self.state.variableSets[0].slotsCount = 1
	self.state.variableSets[0].slots = ['unknown']
	self.state.variableSets[0].rotation.entryId = ''
	self.state.variableSets.pop()
	updateVariables(self)
	assert.equal(self.values.set_casters_slot1, '')
	assert.equal(self.values.set_casters_rotation_entry, '')
	assert.ok(self.definitions.some((def) => def.variableId === 'set_casters_active' && def.name.includes('Renamed')))
	assert.ok(
		!self.definitions.some((def) => def.variableId === 'set_casters_slot2' || def.variableId === 'set_guest_active'),
	)
})

test('Variable Set IDs preserve consecutive underscores in variable names', () => {
	const self = mock()
	self.state.variableSets = [
		{ id: 'team_one', slotsCount: 0, roster: [{ id: 'a', label: 'A' }], activeEntry: 'a' },
		{ id: 'team__one', slotsCount: 0, roster: [{ id: 'b', label: 'B' }], activeEntry: 'b' },
	]
	updateVariables(self)
	assert.equal(self.values.set_team_one_active, 'A')
	assert.equal(self.values.set_team__one_active, 'B')
	assert.ok(self.definitions.some((def) => def.variableId === 'set_team__one_active'))
})
