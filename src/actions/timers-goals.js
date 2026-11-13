const timerChoices = (self) => {
	const list = Object.values(self.state.timers).map((t) => ({ id: t.id, label: t.label || t.id }))
	return list.length ? list : [{ id: '', label: '(no timers found)' }]
}

const goalChoices = (self) => {
	const list = self.state.goals.map((g) => ({ id: g.id, label: g.title || g.id }))
	return list.length ? list : [{ id: '', label: '(no goals found)' }]
}

module.exports = function (self, run) {
	return {
		timer_control: {
			name: 'Timer: Control (start, pause, resume, reset, add/subtract)',
			description: 'Start, pause, resume, reset, adjust time, or toggle overlay visibility for a timer',
			options: [
				{
					id: 'timer',
					type: 'dropdown',
					label: 'Timer',
					choices: timerChoices(self),
					default: timerChoices(self)[0].id,
				},
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'start', label: 'Start' },
						{ id: 'pause', label: 'Pause' },
						{ id: 'resume', label: 'Resume' },
						{ id: 'reset', label: 'Reset' },
						{ id: 'add_time', label: 'Add time' },
						{ id: 'subtract_time', label: 'Subtract time' },
						{ id: 'visibility', label: 'Toggle overlay visibility' },
					],
					default: 'start',
				},
				{
					id: 'minutes',
					type: 'number',
					label: 'Minutes (add / subtract)',
					default: 1,
					min: 0,
					max: 1440,
					isVisibleExpression: `$(options:action) == 'add_time' || $(options:action) == 'subtract_time'`,
				},
				{
					id: 'seconds',
					type: 'number',
					label: 'Seconds (add / subtract)',
					default: 0,
					min: 0,
					max: 3600,
					isVisibleExpression: `$(options:action) == 'add_time' || $(options:action) == 'subtract_time'`,
				},
			],
			callback: async ({ options }) =>
				run(() => {
					const params = {}
					if (options.action === 'add_time' || options.action === 'subtract_time') {
						params.minutes = options.minutes
						params.seconds = options.seconds
					}
					if (options.action === 'visibility') params.mode = 'toggle'
					return self.api.timerControl(options.timer, options.action, params)
				})(),
		},
		goal_action: {
			name: 'Goal: Control (reset, enable, disable, toggle)',
			description: 'Reset progress or enable, disable, or toggle a broadcast goal',
			options: [
				{ id: 'goal', type: 'dropdown', label: 'Goal', choices: goalChoices(self), default: goalChoices(self)[0].id },
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'reset', label: 'Reset progress' },
						{ id: 'toggle', label: 'Toggle enabled' },
						{ id: 'enable', label: 'Enable' },
						{ id: 'disable', label: 'Disable' },
					],
					default: 'reset',
				},
			],
			callback: async ({ options }) => run(() => self.api.goalAction(options.goal, options.action))(),
		},
	}
}
