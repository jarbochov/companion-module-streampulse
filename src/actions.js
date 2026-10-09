const timerChoices = (self) => {
	const list = Object.values(self.state.timers).map((t) => ({ id: t.id, label: t.label || t.id }))
	return list.length ? list : [{ id: '', label: '(no timers found)' }]
}
const goalChoices = (self) => {
	const list = self.state.goals.map((g) => ({ id: g.id, label: g.title || g.id }))
	return list.length ? list : [{ id: '', label: '(no goals found)' }]
}
const ruleChoices = (self) => {
	const list = self.state.rules.map((r) => ({ id: r.id, label: r.name || r.id }))
	return list.length ? list : [{ id: '', label: '(no alert rules found)' }]
}

const { pageChoices, pagedOverlayChoices, splitPage } = require('./choices')

module.exports = function (self) {
	const run = (fn) => async () => {
		try {
			await fn()
			self.poll()
		} catch (err) {
			self.log('error', err.message)
		}
	}

	self.setActionDefinitions({
		timer_control: {
			name: 'Timer: control',
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
			name: 'Goal: control',
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
		alert_queue: {
			name: 'Alerts: queue control',
			options: [
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'skip', label: 'Skip current alert' },
						{ id: 'pause', label: 'Pause queue' },
						{ id: 'resume', label: 'Resume queue' },
						{ id: 'clear', label: 'Clear queue' },
					],
					default: 'skip',
				},
			],
			callback: async ({ options }) => run(() => self.api.alertQueue(options.action))(),
		},
		alert_test: {
			name: 'Alerts: fire test for rule',
			options: [
				{ id: 'rule', type: 'dropdown', label: 'Rule', choices: ruleChoices(self), default: ruleChoices(self)[0].id },
			],
			callback: async ({ options }) => run(() => self.api.alertTest(options.rule))(),
		},
		page_set_enabled: {
			name: 'Overlay page: enable / disable',
			options: [
				{ id: 'page', type: 'dropdown', label: 'Page', choices: pageChoices(self), default: pageChoices(self)[0].id },
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'enable', label: 'Enable' },
						{ id: 'disable', label: 'Disable' },
						{ id: 'toggle', label: 'Toggle' },
					],
					default: 'toggle',
				},
			],
			callback: async ({ options }) => {
				const { overlay, page } = splitPage(options.page)
				return run(() => self.api.pageAction(overlay, options.action, { page }))()
			},
		},
		page_goto: {
			name: 'Overlay page: show page',
			options: [
				{ id: 'page', type: 'dropdown', label: 'Page', choices: pageChoices(self), default: pageChoices(self)[0].id },
			],
			callback: async ({ options }) => {
				const { overlay, page } = splitPage(options.page)
				return run(() => self.api.pageAction(overlay, 'goto', { page }))()
			},
		},
		page_navigate: {
			name: 'Overlay page: navigate',
			options: [
				{
					id: 'overlay',
					type: 'dropdown',
					label: 'Overlay',
					choices: pagedOverlayChoices(self),
					default: pagedOverlayChoices(self)[0].id,
				},
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'next', label: 'Next page' },
						{ id: 'prev', label: 'Previous page' },
						{ id: 'first', label: 'First page' },
						{ id: 'last', label: 'Last page' },
						{ id: 'auto', label: 'Toggle auto-advance' },
					],
					default: 'next',
				},
			],
			callback: async ({ options }) => run(() => self.api.pageAction(options.overlay, options.action))(),
		},
		end_session: {
			name: 'Session: end and archive',
			options: [],
			callback: async () => run(() => self.api.endSession())(),
		},
	})
}
