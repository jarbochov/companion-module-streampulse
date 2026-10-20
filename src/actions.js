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
const randomizerPresetChoices = (self) => {
	const list = (self.state.randomizerPresets || []).map((p) => ({ id: p.id, label: p.name || p.id }))
	return [{ id: '', label: '(Active / Current Preset)' }, ...list]
}
const chatCommandChoices = (self) => {
	const list = (self.state.chatChoices || []).filter((c) => !c.label.startsWith('Timed:'))
	return list.length ? list : [{ id: '', label: '(no commands or triggers found)' }]
}

const {
	overlayChoices,
	pageChoices,
	pagedOverlayChoices,
	splitPage,
	slideshowChoices,
	videoChoices,
	cutoutChoices,
} = require('./choices')

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
		video_control: {
			name: 'Overlay: video playback',
			options: [
				{
					id: 'video',
					type: 'dropdown',
					label: 'Video element',
					choices: videoChoices(self),
					default: videoChoices(self)[0].id,
				},
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'toggle', label: 'Play / Pause' },
						{ id: 'play', label: 'Play' },
						{ id: 'pause', label: 'Pause' },
						{ id: 'restart', label: 'Restart' },
						{ id: 'stop', label: 'Stop' },
						{ id: 'toggle-mute', label: 'Toggle mute' },
						{ id: 'mute', label: 'Mute' },
						{ id: 'unmute', label: 'Unmute' },
					],
					default: 'toggle',
				},
			],
			callback: async ({ options }) => {
				const { overlay, page } = splitPage(options.video)
				return run(() => self.api.videoControl(overlay, page, options.action))()
			},
		},
		cutout_control: {
			name: 'Overlay: cutout (alpha punchthrough)',
			options: [
				{
					id: 'cutout',
					type: 'dropdown',
					label: 'Cutout element',
					choices: cutoutChoices(self),
					default: cutoutChoices(self)[0].id,
				},
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'toggle', label: 'Toggle punchthrough hole' },
						{ id: 'show', label: 'Punch hole (show cutout)' },
						{ id: 'hide', label: 'Fill / cover hole (hide cutout)' },
					],
					default: 'toggle',
				},
			],
			callback: async ({ options }) => {
				const { overlay, page } = splitPage(options.cutout)
				return run(() => self.api.cutoutControl(overlay, page, options.action))()
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
		chat_run_command: {
			name: 'Chat bot: run a command or trigger',
			description:
				'Executes a command or trigger (silent commands run background API/webhook actions without sending chat messages)',
			options: [
				{
					id: 'command',
					type: 'dropdown',
					label: 'Command or trigger',
					choices: chatCommandChoices(self),
					default: chatCommandChoices(self)[0].id,
				},
				{
					id: 'custom_command',
					type: 'textinput',
					label: 'Or custom command name (overrides dropdown if set)',
					default: '',
					useVariables: true,
				},
				{
					id: 'arg',
					type: 'textinput',
					label: 'Argument / parameter (optional, e.g. target username)',
					default: '',
					useVariables: true,
				},
			],
			callback: async (e) => {
				try {
					const custom = await self.parseVariablesInString(e.options.custom_command || '')
					const cmd = (custom.trim() || e.options.command || '').trim().replace(/^!/, '')
					if (!cmd) return
					const arg = await self.parseVariablesInString(e.options.arg || '')
					await self.api.chatRun(cmd, arg, 'StreamDeck')
					self.poll()
				} catch (err) {
					self.log('error', err.message)
				}
			},
		},
		chat_quote: {
			name: 'Chat bot: send a quote to chat',
			description: 'Posts a quote to chat. Leave ID blank for a random quote or specify a quote ID number.',
			options: [
				{
					id: 'id',
					type: 'textinput',
					label: 'Quote ID (optional, blank = random)',
					default: '',
					useVariables: true,
				},
			],
			callback: async (e) => {
				try {
					const id = await self.parseVariablesInString(e.options.id || '')
					await self.api.chatQuote(id.trim())
					self.poll()
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
			name: 'Randomizer: spin wheel, roller or card deck',
			description: 'Trigger a live randomizer spin on stream overlays',
			options: [
				{
					id: 'preset',
					type: 'dropdown',
					label: 'Preset',
					choices: randomizerPresetChoices(self),
					default: '',
					allowCustom: true,
				},
				{
					id: 'mode',
					type: 'dropdown',
					label: 'Display Mode',
					choices: [
						{ id: 'roller', label: 'Slot-Machine Roller (Vertical)' },
						{ id: 'wheel', label: 'Spinning Wheel' },
						{ id: 'deck', label: 'Physical Card Deck' },
					],
					default: 'roller',
				},
				{
					id: 'duration',
					type: 'dropdown',
					label: 'Spin Duration',
					choices: [
						{ id: '4', label: 'Fast (4 seconds)' },
						{ id: '6', label: 'Normal (6 seconds)' },
						{ id: '8', label: 'Long Dramatic (8 seconds)' },
						{ id: '10', label: 'High Stakes (10 seconds)' },
					],
					default: '6',
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
				{
					id: 'theme',
					type: 'dropdown',
					label: 'Theme (optional)',
					choices: [
						{ id: '', label: '(Overlay Default / Configured Theme)' },
						{ id: 'purple', label: 'Purple Chaos' },
						{ id: 'rainbow', label: 'Vibrant Rainbow' },
						{ id: 'cyberpunk', label: 'Cyberpunk Neon' },
						{ id: 'gold', label: 'Royal Gold & Navy' },
						{ id: 'fire', label: 'Fire & Magma' },
						{ id: 'midnight', label: 'Midnight Nebula' },
						{ id: 'matrix', label: 'Hacker Terminal' },
					],
					default: '',
				},
			],
			callback: async ({ options }) => {
				self.state.randomizerSpinning = true
				self.checkFeedbacks('randomizer_spinning')
				await run(() =>
					self.api.randomizerSpin({
						preset: options.preset || undefined,
						mode: options.mode,
						duration: Number(options.duration) || 6,
						suspense: options.suspense,
						theme: options.theme || undefined,
					}),
				)()
			},
		},
	})
}
