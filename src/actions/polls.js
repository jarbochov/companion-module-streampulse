const pollPresetChoices = (self) => {
	const list = (self.state.pollPresets || []).map((p) => ({
		id: p.id,
		label: `${p.title || p.name || p.id} (${(p.choices || []).length} choices)`,
	}))
	return [{ id: '', label: '(Custom Poll — enter question & choices below)' }, ...list]
}

module.exports = function (self, run) {
	return {
		poll_start: {
			name: 'Polls: Start poll (preset or custom)',
			description: 'Launch an audience poll from a saved preset or custom question & choices',
			options: [
				{
					id: 'preset',
					type: 'dropdown',
					label: 'Poll Preset',
					choices: pollPresetChoices(self),
					default: '',
				},
				{
					id: 'title',
					type: 'textinput',
					label: 'Custom Question / Title (used if no preset selected, or to override)',
					default: '',
					useVariables: true,
				},
				{
					id: 'choices',
					type: 'textinput',
					label: 'Choices (comma-separated, e.g. Yes, No, Maybe)',
					default: 'Option 1, Option 2',
					useVariables: true,
					isVisibleExpression: `$(options:preset) == ''`,
				},
				{
					id: 'duration',
					type: 'number',
					label: 'Duration (seconds)',
					default: 60,
					min: 15,
					max: 1800,
				},
				{
					id: 'blind',
					type: 'checkbox',
					label: 'Blind Voting (hide percentages until poll ends)',
					default: false,
				},
				{
					id: 'subMultiplier',
					type: 'checkbox',
					label: '2x Subscriber Vote Weight',
					default: false,
				},
			],
			callback: async ({ options }) =>
				run(async () => {
					const preset = (self.state.pollPresets || []).find((p) => p.id === options.preset)
					const customTitle = (await self.parseVariablesInString(options.title || '')).trim()
					if (preset) {
						return self.api.pollCreate({
							title: customTitle || preset.title || preset.name || 'Poll',
							choices: preset.choices || [],
							duration: Number(options.duration) || Number(preset.duration) || 60,
							blind: options.blind !== undefined ? !!options.blind : !!preset.blind,
							subMultiplier: options.subMultiplier ? 2 : Number(preset.subMultiplier) || 1,
						})
					}
					const rawChoices = await self.parseVariablesInString(options.choices || '')
					const choices = rawChoices
						.split(',')
						.map((c) => c.trim())
						.filter(Boolean)
						.map((label) => ({ label }))
					return self.api.pollCreate({
						title: customTitle || 'Chat Poll',
						choices: choices.length >= 2 ? choices : [{ label: 'Option 1' }, { label: 'Option 2' }],
						duration: Number(options.duration) || 60,
						blind: !!options.blind,
						subMultiplier: options.subMultiplier ? 2 : 1,
					})
				})(),
		},
		poll_control: {
			name: 'Polls: End / extend / cancel active poll',
			description: 'End the active poll and crown a winner, add time to the timer, or cancel voting',
			options: [
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'end', label: 'End Poll & Crown Winner' },
						{ id: 'extend', label: 'Extend Poll Timer (+seconds)' },
						{ id: 'cancel', label: 'Cancel / Dismiss Poll' },
					],
					default: 'end',
				},
				{
					id: 'seconds',
					type: 'number',
					label: 'Seconds to Add',
					default: 30,
					min: 5,
					max: 600,
					isVisibleExpression: `$(options:action) == 'extend'`,
				},
			],
			callback: async ({ options }) =>
				run(() => {
					if (options.action === 'extend') return self.api.pollExtend(Number(options.seconds) || 30)
					if (options.action === 'cancel') return self.api.pollCancel()
					return self.api.pollEnd()
				})(),
		},
		poll_tournament_create_from_template: {
			name: 'Poll Tournament: Create fresh bracket from template',
			description:
				'Replaces the current bracket with fresh entrants and settings. Requires confirmation; blocked while a linked vote runs.',
			options: [
				{
					id: 'id',
					type: 'textinput',
					label: 'Template ID (from /api/polls/tournament/presets)',
					default: '',
					useVariables: true,
				},
				{
					id: 'confirm',
					type: 'checkbox',
					label: 'I confirm this button may replace the current poll bracket',
					default: false,
				},
			],
			callback: async ({ options }) =>
				run(async () => {
					if (options.confirm !== true) throw new Error('Confirm replacing the current poll bracket before creating.')
					const id = (await self.parseVariablesInString(options.id || '')).trim()
					if (!id) throw new Error('A poll tournament template ID is required.')
					const result = await self.api.tournamentPresets(true)
					const preset = ((result && result.presets) || []).find((p) => p.id === id)
					if (!preset) throw new Error(`Poll tournament template not found: ${id}`)
					const body = {}
					for (const key of [
						'title',
						'entrants',
						'format',
						'logo',
						'logoSize',
						'matchDuration',
						'blind',
						'subMultiplier',
						'announceChat',
						'roundRobinLegs',
						'pointsSystem',
						'pointsPerWin',
						'pointsPerDraw',
						'pointsPerLoss',
						'allowDraws',
					]) {
						if (preset[key] !== undefined) body[key] = preset[key]
					}
					return self.api.tournamentPost(
						'/create',
						{ ...body, progressionMode: 'vote', scoringType: 'points', bestOf: 0, isPoll: true },
						true,
					)
				})(),
		},
		poll_tournament_restore: {
			name: 'Poll Tournament: Load saved bracket / checkpoint',
			description:
				'Replaces the current bracket. Requires confirmation; blocked while any vote runs. Unfinished matches need a new vote.',
			options: [
				{
					id: 'id',
					type: 'textinput',
					label: 'Saved bracket / checkpoint ID (from /api/polls/tournament/history)',
					default: '',
					useVariables: true,
				},
				{
					id: 'confirm',
					type: 'checkbox',
					label: 'I confirm this button may replace the current poll bracket',
					default: false,
				},
			],
			callback: async ({ options }) =>
				run(async () => {
					if (options.confirm !== true) throw new Error('Confirm replacing the current poll bracket before loading.')
					const id = (await self.parseVariablesInString(options.id || '')).trim()
					if (!id) throw new Error('A saved bracket / checkpoint ID is required.')
					return self.api.tournamentPost('/history/restore', { id }, true)
				})(),
		},
		poll_tournament_save_checkpoint: {
			name: 'Poll Tournament: Save progress checkpoint',
			description: 'Save bracket progress without interrupting a running vote. Individual voters are not saved.',
			options: [
				{
					id: 'name',
					type: 'textinput',
					label: 'Checkpoint name (optional)',
					default: '',
					useVariables: true,
				},
			],
			callback: async ({ options }) =>
				run(async () =>
					self.api.tournamentPost(
						'/checkpoints',
						{ name: (await self.parseVariablesInString(options.name || '')).trim() },
						true,
					),
				)(),
		},
		poll_tournament_save_template: {
			name: 'Poll Tournament: Save active bracket as template',
			description: 'Save entrants and settings for a fresh bracket later. Does not interrupt a running vote.',
			options: [
				{
					id: 'name',
					type: 'textinput',
					label: 'Template name (optional)',
					default: '',
					useVariables: true,
				},
			],
			callback: async ({ options }) =>
				run(async () =>
					self.api.tournamentPost(
						'/presets',
						{ name: (await self.parseVariablesInString(options.name || '')).trim(), fromActive: true },
						true,
					),
				)(),
		},
	}
}
