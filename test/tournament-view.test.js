const assert = require('node:assert/strict')
const { test } = require('node:test')
const defineActions = require('../src/actions')
const defineFeedbacks = require('../src/feedbacks')
const { defineVariables, updateVariables } = require('../src/variables')
const { StreamPulseApi } = require('../src/api')

function createModuleMock() {
	const calls = []
	const errors = []
	const api = new StreamPulseApi('localhost', 3000)
	api.request = async (path, options = {}) => {
		calls.push({ path, ...options })
		return { status: 'ok', view: options.body }
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
			chatChoices: [],
			randomizerPresets: [],
			overlayVisibility: [],
			tournament: {
				title: 'Retro Championship',
				viewSettings: { focus: 1, bracket: 'winners' },
			},
			pollTournament: {
				title: 'Audience Bracket',
				viewSettings: { focus: 0, bracket: 'all' },
			},
		},
		api,
		calls,
		errors,
		variableValues: {},
		setActionDefinitions(definitions) {
			self.actions = definitions
		},
		setFeedbackDefinitions(definitions) {
			self.feedbacks = definitions
		},
		setVariableDefinitions(definitions) {
			self.variableDefs = definitions
		},
		setVariableValues(values) {
			self.variableValues = values
		},
		checkFeedbacks() {},
		log(level, message) {
			errors.push({ level, message })
		},
	}
	defineActions(self)
	defineFeedbacks(self)
	defineVariables(self)
	return self
}

test('Tournament View Companion Action triggers /api/tournament/view and /api/polls/tournament/view', async () => {
	const self = createModuleMock()

	// 1. Toggle focus on versus overlay
	await self.actions.tournament_view.callback({
		options: { target: 'versus', focus: 'toggle', round: 'no_change', bracket: 'no_change', glide: 'no_change' },
	})
	assert.equal(self.calls.length, 1)
	assert.deepEqual(self.calls[0], {
		path: '/api/tournament/view',
		method: 'POST',
		body: { focus: 'toggle' },
	})

	// 2. Pan round and switch bracket on poll overlay
	await self.actions.tournament_view.callback({
		options: { target: 'poll', focus: '1', round: 'next', bracket: 'finals', glide: '0' },
	})
	assert.equal(self.calls.length, 2)
	assert.deepEqual(self.calls[1], {
		path: '/api/polls/tournament/view',
		method: 'POST',
		body: { focus: '1', round: 'next', bracket: 'finals', glide: '0' },
	})

	// 3. Custom round name option
	await self.actions.tournament_view.callback({
		options: {
			target: 'versus',
			focus: 'no_change',
			round: 'custom',
			roundValue: 'Semifinals',
			bracket: 'no_change',
			glide: 'no_change',
		},
	})
	assert.equal(self.calls.length, 3)
	assert.deepEqual(self.calls[2], {
		path: '/api/tournament/view',
		method: 'POST',
		body: { round: 'Semifinals' },
	})
})

test('Tournament View Feedbacks and Variables expose live camera and bracket state', () => {
	const self = createModuleMock()
	updateVariables(self)

	// Variables check
	assert.equal(self.variableValues.tournament_focus, 1)
	assert.equal(self.variableValues.tournament_bracket, 'winners')
	assert.equal(self.variableValues.poll_tournament_focus, 0)
	assert.equal(self.variableValues.poll_tournament_bracket, 'all')

	// Feedbacks check
	const focusFeedback = self.feedbacks.tournament_focus_active
	assert.equal(focusFeedback.callback({ options: { target: 'versus' } }), true)
	assert.equal(focusFeedback.callback({ options: { target: 'poll' } }), false)
	assert.equal(focusFeedback.callback({ options: { target: 'either' } }), true)

	const sectionFeedback = self.feedbacks.tournament_bracket_section
	assert.equal(sectionFeedback.callback({ options: { target: 'versus', section: 'winners' } }), true)
	assert.equal(sectionFeedback.callback({ options: { target: 'versus', section: 'losers' } }), false)
})
