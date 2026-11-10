const triviaQuestionChoices = (self) => {
	const questions = (self.state.trivia && self.state.trivia.questions) || []
	const list = questions.map((q, idx) => ({
		id: q.id,
		label: `${idx + 1}. [${q.category || 'Trivia'}] ${(q.question || '').slice(0, 40)}${q.done ? ' (Done)' : ''}`,
	}))
	return [{ id: '', label: '(Next / active question)' }, ...list]
}

const triviaPresetChoices = (self) => {
	const list = (self.state.triviaPresets || (self.state.trivia && self.state.trivia.presets) || []).map((p) => ({
		id: p.id,
		label: p.name || p.id,
	}))
	return list.length ? list : [{ id: '', label: '(no presets found)' }]
}

module.exports = function (self, run) {
	return {
		trivia_start: {
			name: 'Trivia: Start / Show question',
			description: 'Display a question, start countdown, and open chat voting',
			options: [
				{
					id: 'question',
					type: 'dropdown',
					label: 'Question',
					choices: triviaQuestionChoices(self),
					default: '',
				},
				{
					id: 'duration',
					type: 'number',
					label: 'Timer duration in seconds (0 = question default)',
					default: 20,
					min: 0,
					max: 300,
				},
			],
			callback: async ({ options }) =>
				run(() => {
					const params = {}
					if (options.question) params.id = options.question
					if (options.duration !== undefined && Number(options.duration) > 0) {
						params.duration = Number(options.duration)
					}
					return self.api.triviaStart(params)
				})(),
		},
		trivia_reveal: {
			name: 'Trivia: Reveal correct answer',
			description: 'Stop timer, close voting, and reveal the correct answer',
			options: [],
			callback: async () => run(() => self.api.triviaReveal())(),
		},
		trivia_next: {
			name: 'Trivia: Next question',
			description: 'Advance to the next question in the bank (or next unplayed in random order)',
			options: [],
			callback: async () => run(() => self.api.triviaNext())(),
		},
		trivia_prev: {
			name: 'Trivia: Previous question',
			description: 'Return to the previous question in sequential order',
			options: [],
			callback: async () => run(() => self.api.triviaPrev())(),
		},
		trivia_reset: {
			name: 'Trivia: Reset overlay to idle',
			description: 'Reset active question and return overlay to idle state',
			options: [],
			callback: async () => run(() => self.api.triviaReset())(),
		},
		trivia_reset_done: {
			name: 'Trivia: Reset (Done) played status',
			description: 'Clear played status on all questions so the full bank can repeat',
			options: [],
			callback: async () => run(() => self.api.triviaResetDone())(),
		},
		trivia_shuffle: {
			name: 'Trivia: Shuffle question bank',
			description: 'Randomize the order of questions in the active bank',
			options: [],
			callback: async () => run(() => self.api.triviaShuffle())(),
		},
		trivia_load_preset: {
			name: 'Trivia: Load question pack preset',
			description: 'Load a saved trivia preset and question list',
			options: [
				{
					id: 'preset',
					type: 'dropdown',
					label: 'Preset',
					choices: triviaPresetChoices(self),
					default: (triviaPresetChoices(self)[0] || {}).id,
				},
				{
					id: 'confirm',
					type: 'checkbox',
					label: 'I confirm loading this preset replaces current questions',
					default: false,
				},
			],
			callback: async ({ options }) => {
				if (!options.confirm) {
					self.log('warn', 'Trivia load preset cancelled: confirmation box was not checked')
					return
				}
				if (!options.preset) return
				return run(() => self.api.triviaLoadPreset(options.preset))()
			},
		},
		trivia_vote: {
			name: 'Trivia: Cast vote',
			description: 'Vote for an answer option (A-F, 1-6, True, False)',
			options: [
				{
					id: 'choice',
					type: 'dropdown',
					label: 'Choice',
					choices: [
						{ id: 'A', label: 'A (Option 1 / True)' },
						{ id: 'B', label: 'B (Option 2 / False)' },
						{ id: 'C', label: 'C (Option 3)' },
						{ id: 'D', label: 'D (Option 4)' },
						{ id: 'E', label: 'E (Option 5)' },
						{ id: 'F', label: 'F (Option 6)' },
						{ id: 'true', label: 'True' },
						{ id: 'false', label: 'False' },
					],
					default: 'A',
				},
			],
			callback: async ({ options }) => run(() => self.api.triviaVote(options.choice, 'StreamDeck'))(),
		},
	}
}
