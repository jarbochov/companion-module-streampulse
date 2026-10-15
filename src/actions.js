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

const { overlayChoices, pageChoices, pagedOverlayChoices, splitPage, slideshowChoices } = require('./choices')

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
		slideshow_control: {
			name: 'Slideshow: control',
			options: [
				{
					id: 'show',
					type: 'dropdown',
					label: 'Slideshow',
					choices: slideshowChoices(self),
					default: slideshowChoices(self)[0].id,
				},
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'next', label: 'Next slide' },
						{ id: 'prev', label: 'Previous slide' },
						{ id: 'pause', label: 'Pause' },
						{ id: 'play', label: 'Play' },
						{ id: 'toggle', label: 'Play / pause' },
					],
					default: 'next',
				},
			],
			callback: async ({ options }) => {
				const { overlay, page } = splitPage(options.show)
				return run(() => self.api.slideshowControl(overlay, page, options.action))()
			},
		},
		overlay_visibility: {
			name: 'Overlay: show / hide entire overlay',
			options: [
				{
					id: 'overlay',
					type: 'dropdown',
					label: 'Overlay',
					choices: overlayChoices(self),
					default: overlayChoices(self)[0].id,
				},
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'toggle', label: 'Toggle' },
						{ id: 'on', label: 'Show' },
						{ id: 'off', label: 'Hide' },
					],
					default: 'toggle',
				},
			],
			callback: async ({ options }) => run(() => self.api.overlayVisibilityAction(options.overlay, options.action))(),
		},
		music_overlay: {
			name: 'Music overlay: show / hide',
			options: [
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'toggle', label: 'Toggle' },
						{ id: 'on', label: 'Show' },
						{ id: 'off', label: 'Hide' },
					],
					default: 'toggle',
				},
			],
			callback: async ({ options }) => run(() => self.api.musicOverlayAction(options.action))(),
		},
		pin_last_highlight: {
			name: 'Highlights: pin the last chat message',
			options: [],
			callback: async () => run(() => self.api.pinLastHighlight())(),
		},
		mark_clip: {
			name: 'Clips: mark this moment as a clip candidate',
			options: [],
			callback: async () => run(() => self.api.markClip('companion-button'))(),
		},
		alert_replay_last: {
			name: 'Alerts: replay the last alert',
			options: [],
			callback: async () => {
				const history = (self.state.alerts && self.state.alerts.history) || []
				const stamp = (a) => Date.parse(a.shownAt || a.at) || 0
				const last = history.slice().sort((a, b) => stamp(b) - stamp(a))[0]
				if (!last) return self.log('warn', 'No alert history to replay')
				return run(() => self.api.replayAlert(last.id))()
			},
		},
		variable_counter: {
			name: 'Variable: change a counter',
			description: 'Increment, decrement or reset a StreamPulse counter (created in the Chat Bot page)',
			options: [
				{ id: 'name', type: 'textinput', label: 'Counter name', default: '' },
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					default: 'increment',
					choices: [
						{ id: 'increment', label: 'Increment' },
						{ id: 'decrement', label: 'Decrement' },
						{ id: 'reset', label: 'Reset' },
					],
				},
				{ id: 'amount', type: 'number', label: 'Amount', default: 1, min: 1, max: 100000 },
			],
			callback: async (e) => {
				try {
					await self.api.variable(e.options.name, e.options.action, { amount: e.options.amount })
				} catch (err) {
					self.log('error', err.message)
				}
			},
		},
		variable_set: {
			name: 'Variable: set a value',
			description: 'Set a StreamPulse variable or counter to a value (created if missing)',
			options: [
				{ id: 'name', type: 'textinput', label: 'Variable name', default: '' },
				{ id: 'value', type: 'textinput', label: 'Value', default: '', useVariables: true },
			],
			callback: async (e) => {
				try {
					await self.api.variable(e.options.name, 'set', { value: await self.parseVariablesInString(e.options.value) })
				} catch (err) {
					self.log('error', err.message)
				}
			},
		},
		chat_bot_toggle: {
			name: 'Chat bot: turn on, off or toggle',
			description: 'Lasts until StreamPulse restarts; the Config setting decides the start-up state',
			options: [
				{
					id: 'mode',
					type: 'dropdown',
					label: 'Mode',
					default: 'toggle',
					choices: [
						{ id: 'toggle', label: 'Toggle' },
						{ id: 'on', label: 'On' },
						{ id: 'off', label: 'Off' },
					],
				},
			],
			callback: async (e) => {
				try {
					await self.api.chatEnabled(
						e.options.mode === 'toggle' ? { action: 'toggle' } : { enabled: e.options.mode === 'on' },
					)
					self.poll()
				} catch (err) {
					self.log('error', err.message)
				}
			},
		},
		chat_send: {
			name: 'Chat bot: send a chat message',
			options: [{ id: 'text', type: 'textinput', label: 'Message', default: '', useVariables: true }],
			callback: async (e) => {
				try {
					await self.api.chatSend(await self.parseVariablesInString(e.options.text))
				} catch (err) {
					self.log('error', err.message)
				}
			},
		},
		restart_server: {
			name: 'Server: restart StreamPulse',
			description: 'Restarts the StreamPulse process; the active session continues',
			options: [],
			callback: async () => {
				try {
					await self.api.restartServer()
				} catch (err) {
					self.log('error', err.message)
				}
			},
		},
		stop_server: {
			name: 'Server: stop StreamPulse',
			description:
				'Shuts StreamPulse down and archives the current session. Companion cannot start it again; use a shell script for that.',
			options: [],
			callback: async () => {
				try {
					await self.api.stopServer()
				} catch (err) {
					self.log('error', err.message)
				}
			},
		},
		start_session: {
			name: 'Session: start a new session',
			options: [],
			callback: async () => run(() => self.api.startSession())(),
		},
		end_session: {
			name: 'Session: end and archive',
			options: [],
			callback: async () => run(() => self.api.endSession())(),
		},
		reset_session_data: {
			name: 'Session: reset chat data without archiving',
			description: 'Clears active chat data without saving to session archives',
			options: [],
			callback: async () => run(() => self.api.resetSession())(),
		},
		variable_roll: {
			name: 'Variable: roll list / topic',
			description: 'Advance or randomize a StreamPulse list variable (e.g. topic list, challenge wheel)',
			options: [{ id: 'name', type: 'textinput', label: 'List variable name', default: '' }],
			callback: async (e) => run(() => self.api.variableRoll(e.options.name))(),
		},
		alert_test_event: {
			name: 'Alerts: simulate stream event',
			description: 'Test overlays by firing a simulated Twitch or stream event',
			options: [
				{
					id: 'trigger',
					type: 'dropdown',
					label: 'Event Type',
					default: 'follow',
					choices: [
						{ id: 'follow', label: 'Follow' },
						{ id: 'sub', label: 'New Subscription' },
						{ id: 'resub', label: 'Resub' },
						{ id: 'gift', label: 'Gifted Sub' },
						{ id: 'bits', label: 'Cheer / Bits' },
						{ id: 'donation', label: 'Donation' },
						{ id: 'raid', label: 'Raid' },
						{ id: 'redeem', label: 'Channel Points Redeem' },
					],
				},
				{ id: 'user', type: 'textinput', label: 'Viewer name (optional)', default: 'TestViewer' },
				{ id: 'amount', type: 'number', label: 'Amount (bits, months, viewers)', default: 100, min: 1, max: 100000 },
			],
			callback: async (e) =>
				run(() => self.api.alertTestEvent(e.options.trigger, { user: e.options.user, amount: e.options.amount }))(),
		},
		randomizer_spin: {
			name: 'Randomizer: spin wheel or roller',
			description: 'Trigger a live randomizer spin on stream overlays',
			options: [
				{
					id: 'preset',
					type: 'textinput',
					label: 'Preset ID (optional, leave blank for active preset)',
					default: '',
				},
				{
					id: 'mode',
					type: 'dropdown',
					label: 'Display Mode',
					choices: [
						{ id: 'roller', label: 'Slot-Machine Roller (Vertical)' },
						{ id: 'wheel', label: 'Spinning Wheel' },
					],
					default: 'roller',
				},
				{
					id: 'suspense',
					type: 'dropdown',
					label: 'Suspense Mode',
					choices: [
						{ id: 'normal', label: 'Smooth Deceleration (Normal)' },
						{ id: 'tricky', label: 'Tricky Fake-Out (Suspense Nudge)' },
					],
					default: 'normal',
				},
			],
			callback: async ({ options }) =>
				run(() =>
					self.api.randomizerSpin({
						preset: options.preset || undefined,
						mode: options.mode,
						suspense: options.suspense,
					})
				)(),
		},
	})
}
