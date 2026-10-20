const assert = require('node:assert/strict')
const { test } = require('node:test')
const defineActions = require('../src/actions')
const definePresets = require('../src/presets')
const { updateVariables } = require('../src/variables')

function createModuleMock() {
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
			status: null,
			alerts: null,
			randomizerLast: { mode: 'deck', duration: 8 },
		},
		api: { randomizerSpin: async (options) => (self.spinOptions = options) },
		setActionDefinitions(definitions) {
			self.actions = definitions
		},
		setPresetDefinitions(definitions) {
			self.presets = definitions
		},
		setVariableDefinitions(definitions) {
			self.variableDefinitions = definitions
		},
		setVariableValues(values) {
			self.variableValues = values
		},
		checkFeedbacks() {},
		async poll() {},
		log(level, message) {
			throw new Error(`${level}: ${message}`)
		},
	}
	return self
}

test('Randomizer Companion action supports card deck mode and duration', async () => {
	const self = createModuleMock()
	defineActions(self)
	const action = self.actions.randomizer_spin
	const modes = action.options.find((option) => option.id === 'mode').choices.map((choice) => choice.id)
	assert.deepEqual(modes, ['roller', 'wheel', 'deck'])
	assert.deepEqual(
		action.options.find((option) => option.id === 'duration').choices.map((choice) => choice.id),
		['4', '6', '8', '10'],
	)
	await action.callback({ options: { preset: '', mode: 'deck', duration: '8', suspense: 'normal', theme: '' } })
	assert.deepEqual(self.spinOptions, { preset: undefined, mode: 'deck', duration: 8, suspense: 'normal', theme: undefined })
})

test('Randomizer Companion presets display the mode and duration and include a card-deck button', () => {
	const self = createModuleMock()
	definePresets(self)
	const spinButton = self.presets.spin_randomizer
	assert.match(spinButton.style.text, /randomizer_last_mode/)
	assert.match(spinButton.style.text, /randomizer_last_duration/)
	assert.equal(self.presets.spin_randomizer_deck.steps[0].down[0].options.mode, 'deck')
	assert.match(self.presets.spin_randomizer_deck.style.text, /randomizer_last_duration/)
})

test('Randomizer Companion exposes the last spin duration in seconds', () => {
	const self = createModuleMock()
	self.state.randomizerLast = { mode: 'deck', duration: 8 }
	updateVariables(self)
	assert.equal(self.variableValues.randomizer_last_mode, 'deck')
	assert.equal(self.variableValues.randomizer_last_duration, 8)
	assert.ok(self.variableDefinitions.some((definition) => definition.variableId === 'randomizer_last_duration'))
})
