const assert = require('node:assert/strict')
const { test } = require('node:test')
const defineActions = require('../src/actions')
const defineFeedbacks = require('../src/feedbacks')
const definePresets = require('../src/presets')
const { updateVariables, defineVariables } = require('../src/variables')

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
			trivia: {
				status: 'question',
				currentIndex: 0,
				totalQuestions: 3,
				unplayedCount: 4,
				activeQuestion: {
					totalVotes: 12,
					remainingSeconds: 15,
					id: 'q-1',
					category: 'Gaming',
					question: 'What company developed Super Mario Bros.?',
					choices: [
						{ letter: 'A', text: 'Nintendo', percent: 85, votes: 10 },
						{ letter: 'B', text: 'Sega', percent: 15, votes: 2 },
					],
					correctIndex: null,
					done: false,
				},
				questions: [
					{ id: 'q-1', question: 'What company developed Super Mario Bros.?', category: 'Gaming', done: false },
					{
						id: 'q-2',
						question: 'In what year was the NES released in North America?',
						category: 'History',
						done: true,
					},
					{ id: 'q-3', question: 'Is Mario a plumber?', category: 'Trivia', done: false },
				],
				presets: [{ id: 'preset-gaming', name: 'Gaming Pack' }],
			},
			triviaPresets: [{ id: 'preset-gaming', name: 'Gaming Pack' }],
		},
		api: {
			triviaStart: async (params) => {
				self.startCalled = params
			},
			triviaReveal: async () => {
				self.revealCalled = true
			},
			triviaNext: async () => {
				self.nextCalled = true
			},
			triviaPrev: async () => {
				self.prevCalled = true
			},
			triviaReset: async () => {
				self.resetCalled = true
			},
			triviaResetDone: async () => {
				self.resetDoneCalled = true
			},
			triviaShuffle: async () => {
				self.shuffleCalled = true
			},
			triviaLoadPreset: async (id) => {
				self.loadedPresetId = id
			},
			triviaVote: async (choice, user) => {
				self.voted = { choice, user }
			},
		},
		async parseVariablesInString(value) {
			return value
		},
		setActionDefinitions(definitions) {
			self.actions = definitions
		},
		setFeedbackDefinitions(definitions) {
			self.feedbacks = definitions
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
		logs: [],
		log(level, message) {
			self.logs.push({ level, message })
		},
	}
	return self
}

test('Trivia: Companion actions invoke StreamPulse API endpoints', async () => {
	const self = createModuleMock()
	defineActions(self)

	// trivia_start
	const startAction = self.actions.trivia_start
	assert.ok(startAction, 'trivia_start action must exist')
	await startAction.callback({ options: { question: 'q-1', duration: 25 } })
	assert.deepEqual(self.startCalled, { id: 'q-1', duration: 25 })

	// trivia_reveal
	const revealAction = self.actions.trivia_reveal
	assert.ok(revealAction, 'trivia_reveal action must exist')
	await revealAction.callback({ options: {} })
	assert.equal(self.revealCalled, true)

	// trivia_next
	const nextAction = self.actions.trivia_next
	assert.ok(nextAction, 'trivia_next action must exist')
	await nextAction.callback({ options: {} })
	assert.equal(self.nextCalled, true)

	// trivia_prev
	const prevAction = self.actions.trivia_prev
	assert.ok(prevAction, 'trivia_prev action must exist')
	await prevAction.callback({ options: {} })
	assert.equal(self.prevCalled, true)

	// trivia_reset
	const resetAction = self.actions.trivia_reset
	assert.ok(resetAction, 'trivia_reset action must exist')
	await resetAction.callback({ options: {} })
	assert.equal(self.resetCalled, true)

	// trivia_reset_done
	const resetDoneAction = self.actions.trivia_reset_done
	assert.ok(resetDoneAction, 'trivia_reset_done action must exist')
	await resetDoneAction.callback({ options: {} })
	assert.equal(self.resetDoneCalled, true)

	// trivia_shuffle
	const shuffleAction = self.actions.trivia_shuffle
	assert.ok(shuffleAction, 'trivia_shuffle action must exist')
	await shuffleAction.callback({ options: {} })
	assert.equal(self.shuffleCalled, true)

	// trivia_load_preset without confirm
	const loadPresetAction = self.actions.trivia_load_preset
	assert.ok(loadPresetAction, 'trivia_load_preset action must exist')
	await loadPresetAction.callback({ options: { preset: 'preset-gaming', confirm: false } })
	assert.equal(self.loadedPresetId, undefined)
	assert.ok(self.logs.some((l) => l.level === 'warn'))

	// trivia_load_preset with confirm
	await loadPresetAction.callback({ options: { preset: 'preset-gaming', confirm: true } })
	assert.equal(self.loadedPresetId, 'preset-gaming')

	// trivia_vote
	const voteAction = self.actions.trivia_vote
	assert.ok(voteAction, 'trivia_vote action must exist')
	await voteAction.callback({ options: { choice: 'B' } })
	assert.deepEqual(self.voted, { choice: 'B', user: 'StreamDeck' })
})

test('Trivia: Feedbacks and Variables expose live state', async () => {
	const self = createModuleMock()
	await defineFeedbacks(self)
	defineVariables(self)
	updateVariables(self)

	// Variables check
	assert.equal(self.variableValues.trivia_status, 'question')
	assert.equal(self.variableValues.trivia_question, 'What company developed Super Mario Bros.?')
	assert.equal(self.variableValues.trivia_category, 'Gaming')
	assert.equal(self.variableValues.trivia_choice_count, '2')
	assert.equal(self.variableValues.trivia_votes, '12')
	assert.equal(self.variableValues.trivia_remaining, '15')
	assert.equal(self.variableValues.trivia_index, '1')
	assert.equal(self.variableValues.trivia_total, '3')
	assert.equal(self.variableValues.trivia_unplayed, '4')
	assert.equal(self.variableValues.trivia_correct_answer, '')
	assert.equal(self.variableValues.trivia_correct_letter, '')

	// Feedbacks check
	assert.equal(self.feedbacks.trivia_phase.callback({ options: { phase: 'question' } }), true)
	assert.equal(self.feedbacks.trivia_phase.callback({ options: { phase: 'reveal' } }), false)
	assert.equal(self.feedbacks.trivia_phase.callback({ options: { phase: 'idle' } }), false)
	assert.equal(self.feedbacks.trivia_unplayed_remaining.callback(), true)

	self.state.trivia.status = 'reveal'
	self.state.trivia.activeQuestion.correctIndex = 0
	updateVariables(self)
	assert.equal(self.variableValues.trivia_correct_answer, 'Nintendo')
	assert.equal(self.variableValues.trivia_correct_letter, 'A')
	assert.equal(self.feedbacks.trivia_phase.callback({ options: { phase: 'reveal' } }), true)

	const fullState = self.state.trivia
	self.state.status = { trivia: { ...fullState } }
	delete self.state.status.trivia.questions
	self.state.trivia = null
	updateVariables(self)
	assert.equal(self.variableValues.trivia_total, '3', 'status summaries expose totalQuestions without a bank')
	self.state.trivia = fullState

	// Simulate all done
	self.state.trivia.unplayedCount = 0
	self.state.trivia.questions = self.state.trivia.questions.map((q) => ({ ...q, done: true }))
	assert.equal(self.feedbacks.trivia_unplayed_remaining.callback(), false)
})

test('Trivia: Companion presets are defined in the Trivia category', () => {
	const self = createModuleMock()
	definePresets(self)

	assert.ok(self.presets.trivia_start, 'trivia_start preset must exist')
	assert.equal(self.presets.trivia_start.category, 'Trivia')
	assert.ok(self.presets.trivia_reveal, 'trivia_reveal preset must exist')
	assert.equal(self.presets.trivia_reveal.category, 'Trivia')
	assert.ok(self.presets.trivia_next, 'trivia_next preset must exist')
	assert.equal(self.presets.trivia_next.category, 'Trivia')
	assert.ok(self.presets.trivia_prev, 'trivia_prev preset must exist')
	assert.equal(self.presets.trivia_prev.category, 'Trivia')
	assert.ok(self.presets.trivia_reset, 'trivia_reset preset must exist')
	assert.equal(self.presets.trivia_reset.category, 'Trivia')
	assert.ok(self.presets.trivia_reset_done, 'trivia_reset_done preset must exist')
	assert.equal(self.presets.trivia_reset_done.category, 'Trivia')
	assert.ok(self.presets.trivia_shuffle, 'trivia_shuffle preset must exist')
	assert.equal(self.presets.trivia_shuffle.category, 'Trivia')
})
