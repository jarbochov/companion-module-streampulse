const matchupPresetChoices = (self) => {
	const list = (self.state.matchupPresets || []).map((p) => ({ id: p.id, label: p.name || p.title || p.id }))
	return list.length ? list : [{ id: '', label: '(no matchup presets found)' }]
}

module.exports = function (self, run) {
	return {
		matchup_score: {
			name: 'Versus: Change game or round score',
			options: [
				{
					id: 'runner',
					type: 'dropdown',
					label: 'Competitor',
					choices: [
						{ id: 0, label: 'Competitor 1' },
						{ id: 1, label: 'Competitor 2' },
						{ id: 2, label: 'Competitor 3' },
						{ id: 3, label: 'Competitor 4' },
					],
					default: 0,
				},
				{
					id: 'target',
					type: 'dropdown',
					label: 'Score Type',
					choices: [
						{ id: 'game', label: 'Game Score (Match Pips / Series)' },
						{ id: 'round', label: 'Round in Game (Round Pips)' },
					],
					default: 'game',
				},
				{ id: 'delta', type: 'number', label: 'Change (+/-)', default: 1, min: -100, max: 100 },
			],
			callback: async ({ options }) =>
				run(() => {
					const payload = { index: Number(options.runner) || 0 }
					if (options.target === 'round') {
						payload.roundDelta = Number(options.delta) || 0
					} else {
						payload.delta = Number(options.delta) || 0
					}
					return self.api.matchupPost('/score', payload)
				})(),
		},
		matchup_clock: {
			name: 'Versus: Clock / speedrun race control',
			options: [
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: '/clock/start', label: 'Start clock' },
						{ id: '/clock/pause', label: 'Pause clock' },
						{ id: '/clock/reset', label: 'Reset clock' },
						{ id: '/clock/race/start-all', label: 'Race: start all runners (sync)' },
						{ id: '/clock/race/pause-all', label: 'Race: pause all runners' },
						{ id: '/clock/race/reset-all', label: 'Race: reset all runners' },
						{ id: 'timers_finish', label: 'Race Timers: Main Clock Only — Reveal on Finish (+Delta)' },
						{ id: 'timers_always', label: 'Race Timers: Always Show Live Runner Timers' },
						{ id: 'timers_toggle', label: 'Race Timers: Toggle Reveal on Finish vs Always Show' },
						{ id: 'mode_race', label: 'Clock Mode: Speedrun Race' },
						{ id: 'mode_countdown', label: 'Clock Mode: Countdown' },
						{ id: 'mode_stopwatch', label: 'Clock Mode: Stopwatch' },
						{ id: 'none', label: 'Clock: set to None (hidden)' },
					],
					default: '/clock/start',
				},
			],
			callback: async ({ options }) =>
				run(() => {
					if (options.action === 'none') return self.api.matchupPost('/clock/set', { enabled: false })
					if (options.action === 'mode_race') return self.api.matchupPost('/clock/set', { enabled: true, mode: 'race' })
					if (options.action === 'mode_countdown')
						return self.api.matchupPost('/clock/set', { enabled: true, mode: 'countdown' })
					if (options.action === 'mode_stopwatch')
						return self.api.matchupPost('/clock/set', { enabled: true, mode: 'stopwatch' })
					if (options.action === 'timers_finish')
						return self.api.matchupPost('/clock/set', { runnerTimersMode: 'finish' })
					if (options.action === 'timers_always')
						return self.api.matchupPost('/clock/set', { runnerTimersMode: 'always' })
					if (options.action === 'timers_toggle') {
						const cur =
							self.state.matchup && self.state.matchup.clock && self.state.matchup.clock.runnerTimersMode === 'always'
								? 'always'
								: 'finish'
						return self.api.matchupPost('/clock/set', {
							runnerTimersMode: cur === 'finish' ? 'always' : 'finish',
						})
					}
					return self.api.matchupPost(options.action)
				})(),
		},
		matchup_runner: {
			name: 'Versus: Runner finish / toggle / reset',
			options: [
				{
					id: 'runner',
					type: 'dropdown',
					label: 'Runner',
					choices: [
						{ id: 0, label: 'Runner 1' },
						{ id: 1, label: 'Runner 2' },
						{ id: 2, label: 'Runner 3' },
						{ id: 3, label: 'Runner 4' },
					],
					default: 0,
				},
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'finish', label: 'Finish (Lock Split & Reveal Delta)' },
						{ id: 'toggle', label: 'Start / pause individual runner' },
						{ id: 'reset', label: 'Reset individual runner' },
					],
					default: 'finish',
				},
			],
			callback: async ({ options }) =>
				run(() => self.api.matchupPost(`/clock/race/${options.action}`, { index: Number(options.runner) || 0 }))(),
		},
		matchup_general: {
			name: 'Versus: Swap sides / reset scores / queue / presets',
			options: [
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: '/swap', label: 'Swap sides (P1 <-> P2)' },
						{ id: '/reset-scores', label: 'Reset scores & rounds (0-0)' },
						{ id: '/history/snapshot', label: 'Save progress to match history' },
						{ id: '/queue/next', label: 'Next matchup in queue' },
						{ id: '/queue/prev', label: 'Previous matchup in queue' },
						{ id: '/presets/load', label: 'Load matchup preset' },
					],
					default: '/history/snapshot',
				},
				{
					id: 'preset',
					type: 'dropdown',
					label: 'Matchup Preset',
					choices: matchupPresetChoices(self),
					default: matchupPresetChoices(self)[0].id,
					isVisibleExpression: `$(options:action) == '/presets/load'`,
				},
			],
			callback: async ({ options }) =>
				run(() =>
					options.action === '/presets/load'
						? self.api.matchupPost('/presets/load', { id: options.preset })
						: self.api.matchupPost(options.action),
				)(),
		},
	}
}
