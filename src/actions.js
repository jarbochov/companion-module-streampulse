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
const randomizerButtonPresetChoices = (self) => [
	{ id: '', label: '(Studio / Overlay phrase preset)' },
	...((self.state.randomizerButtonPresets || []).map((p) => ({ id: p.id, label: p.name || p.id }))),
	{ id: 'static', label: 'Fixed Single Title' },
]
const chatCommandChoices = (self) => {
	const list = (self.state.chatChoices || []).filter((c) => !c.label.startsWith('Timed:'))
	return list.length ? list : [{ id: '', label: '(no commands or triggers found)' }]
}
const pollPresetChoices = (self) => {
	const list = (self.state.pollPresets || []).map((p) => ({
		id: p.id,
		label: `${p.title || p.name || p.id} (${(p.choices || []).length} choices)`,
	}))
	return [{ id: '', label: '(Custom Poll — enter question & choices below)' }, ...list]
}
const matchupPresetChoices = (self) => {
	const list = (self.state.matchupPresets || []).map((p) => ({ id: p.id, label: p.name || p.title || p.id }))
	return list.length ? list : [{ id: '', label: '(no matchup presets found)' }]
}
const entrantName = (e) => (e && typeof e === 'object' ? e.name || '' : String(e || ''))
const entrantScore = (m, idx) => {
	const e = idx === 0 ? m && m.entrant1 : m && m.entrant2
	if (e && typeof e === 'object' && e.score !== undefined) return Number(e.score) || 0
	if (m && Array.isArray(m.scores) && m.scores[idx] !== undefined) return Number(m.scores[idx]) || 0
	return Number(idx === 0 ? m && m.score1 : m && m.score2) || 0
}
const entrantRounds = (m, idx) => {
	const e = idx === 0 ? m && m.entrant1 : m && m.entrant2
	if (e && typeof e === 'object' && e.rounds !== undefined) return Number(e.rounds) || 0
	return Number(idx === 0 ? m && m.rounds1 : m && m.rounds2) || 0
}
const isReadyMatch = (m) => {
	if (!m || m.isBye) return false
	const n1 = entrantName(m.entrant1)
	const n2 = entrantName(m.entrant2)
	return !!n1 && n1 !== 'TBD' && n1 !== 'BYE' && !!n2 && n2 !== 'TBD' && n2 !== 'BYE'
}
const isCompletedMatch = (m) => m && (m.status === 'COMPLETED' || m.status === 'completed')
const tournamentMatchChoices = (self) => {
	const t = self.state.tournament
	const matches = (t && Array.isArray(t.matches) ? t.matches : []).filter(
		(m) => !m.isBye && (entrantName(m.entrant1) || entrantName(m.entrant2)),
	)
	const list = matches.map((m) => ({
		id: m.id,
		label: `${m.roundName || m.label || m.id}: ${entrantName(m.entrant1) || 'TBD'} vs ${entrantName(m.entrant2) || 'TBD'} (${entrantScore(m, 0)}-${entrantScore(m, 1)})`,
	}))
	return [{ id: '', label: '(Active / First Ready Match)' }, ...list]
}
const resolveActiveTournamentMatch = (self, explicitMatchId, isPoll = false) => {
	const t = isPoll ? self.state.pollTournament : self.state.tournament
	if (!t || !Array.isArray(t.matches)) return null
	if (explicitMatchId) {
		const found = t.matches.find((m) => m.id === explicitMatchId)
		if (found) return found
	}
	if (t.activeMatchId) {
		const active = t.matches.find((m) => m.id === t.activeMatchId)
		if (active) return active
	}
	return (
		t.matches.find((m) => isReadyMatch(m) && !isCompletedMatch(m)) ||
		t.matches.find((m) => !m.isBye && (entrantName(m.entrant1) || entrantName(m.entrant2))) ||
		null
	)
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
						{ id: '', label: '(Studio / Overlay setting)' },
						{ id: 'roller', label: 'Slot-Machine Roller (Vertical)' },
						{ id: 'wheel', label: 'Spinning Wheel' },
						{ id: 'deck', label: 'Physical Card Deck' },
					],
					default: '',
				},
				{
					id: 'duration',
					type: 'dropdown',
					label: 'Spin Duration',
					choices: [
						{ id: '', label: '(Studio / Overlay setting)' },
						{ id: '4', label: 'Fast (4 seconds)' },
						{ id: '6', label: 'Normal (6 seconds)' },
						{ id: '8', label: 'Long Dramatic (8 seconds)' },
						{ id: '10', label: 'High Stakes (10 seconds)' },
					],
					default: '',
				},
				{
					id: 'autohide',
					type: 'dropdown',
					label: 'Winner Auto-hide',
					choices: [
						{ id: '', label: '(Studio / Overlay setting)' },
						{ id: '8', label: 'After 8 seconds (default)' },
						{ id: '15', label: 'After 15 seconds' },
						{ id: '30', label: 'After 30 seconds' },
						{ id: '0', label: 'Never (stay visible)' },
					],
					default: '',
				},
				{
					id: 'suspense',
					type: 'dropdown',
					label: 'Suspense Mode',
					choices: [
						{ id: '', label: '(Studio / Overlay setting)' },
						{ id: 'normal', label: 'Smooth Deceleration (Normal)' },
						{ id: 'tricky', label: 'Tricky Fake-Out (Suspense Nudge)' },
					],
					default: '',
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
				{
					id: 'showButton',
					type: 'dropdown',
					label: 'Show on-screen spin button',
					choices: [
						{ id: '', label: '(Studio / Overlay setting)' },
						{ id: 'show', label: 'Show' },
						{ id: 'hide', label: 'Hide' },
					],
					default: '',
				},
				{
					id: 'buttonPreset',
					type: 'dropdown',
					label: 'On-screen button phrase preset',
					choices: randomizerButtonPresetChoices(self),
					default: '',
				},
				{
					id: 'buttonPhrases',
					type: 'textinput',
					label: 'Custom button phrases (one per line; overrides preset)',
					default: '',
					useVariables: true,
					multiline: true,
				},
				{
					id: 'buttonText',
					type: 'textinput',
					label: 'Fixed button title (optional)',
					default: '',
					useVariables: true,
				},
				{
					id: 'elimination',
					type: 'dropdown',
					label: 'Elimination (remove winner from pool)',
					choices: [
						{ id: '', label: '(Preset / Studio setting)' },
						{ id: 'on', label: 'On: remove the winner until restored' },
						{ id: 'off', label: 'Off: keep every choice in play' },
					],
					default: '',
				},
				{
					id: 'winnerHeader',
					type: 'textinput',
					label: 'Winner headline (optional)',
					default: '',
					useVariables: true,
				},
				{
					id: 'winnerSub',
					type: 'textinput',
					label: 'Winner subtitle / phrase (optional)',
					default: '',
					useVariables: true,
				},
			],
			callback: async ({ options }) => {
				await run(async () => {
					const body = {
						preset: options.preset || undefined,
						inheritStudioSettings: true,
					}
					if (options.mode) body.mode = options.mode
					if (options.duration) body.duration = Number(options.duration)
					if (options.autohide !== undefined && options.autohide !== '') body.autohide = Number(options.autohide)
					if (options.suspense) body.suspense = options.suspense
					if (options.theme) body.theme = options.theme
					if (options.showButton === 'show') body.showButton = true
					if (options.showButton === 'hide') body.showButton = false
					if (options.buttonPreset) body.buttonPreset = options.buttonPreset
					if (options.elimination === 'on') body.eliminationMode = true
					if (options.elimination === 'off') body.eliminationMode = false
					const buttonText = await self.parseVariablesInString(options.buttonText || '')
					if (buttonText.trim()) {
						body.buttonText = buttonText.trim()
						if (!options.buttonPhrases?.trim()) body.buttonPreset = 'static'
					}
					const phrases = await self.parseVariablesInString(options.buttonPhrases || '')
					if (phrases.trim()) {
						body.buttonPhrases = phrases.split(/\r?\n/).map((phrase) => phrase.trim()).filter(Boolean)
						body.buttonPreset = 'custom'
					}
					const winnerHeader = await self.parseVariablesInString(options.winnerHeader || '')
					const winnerSub = await self.parseVariablesInString(options.winnerSub || '')
					if (winnerHeader.trim()) body.winnerHeader = winnerHeader.trim()
					if (winnerSub.trim()) body.winnerSub = winnerSub.trim()
					const res = await self.api.randomizerSpin(body)
					if (res && res.payload && !self.wsConnected) {
						self.state.randomizerLast = res.payload
						self.state.randomizerSpinning = true
						self.checkFeedbacks('randomizer_spinning')
						const dur = Math.max(3, Number(res.payload.duration) || 6)
						if (self.randomizerSpinTimer) clearTimeout(self.randomizerSpinTimer)
						self.randomizerSpinTimer = setTimeout(() => {
							self.state.randomizerSpinning = false
							self.checkFeedbacks('randomizer_spinning')
							updateVariables(self)
							self.refreshRandomizerPresets()
						}, dur * 1000)
					}
					return res
				})()
			},
		},
		matchup_score: {
			name: 'Versus: change game or round score',
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
			name: 'Versus: clock / speedrun race control',
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
			name: 'Versus: runner finish / toggle / reset',
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
				run(() => self.api.matchupPost(`/clock/race/${options.action}`, { competitor: Number(options.runner) || 0 }))(),
		},
		matchup_general: {
			name: 'Versus: swap sides / reset scores / queue / presets',
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
		poll_start: {
			name: 'Polls: start poll (preset or custom)',
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
			name: 'Polls: end / extend / cancel active poll',
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
		tournament_score: {
			name: 'Tournament: change match game or round score',
			description: 'Score an entrant in the active (or selected) tournament bracket match',
			options: [
				{
					id: 'matchId',
					type: 'dropdown',
					label: 'Match',
					choices: tournamentMatchChoices(self),
					default: '',
				},
				{
					id: 'entrant',
					type: 'dropdown',
					label: 'Entrant',
					choices: [
						{ id: 0, label: 'Entrant 1 (Left / Top)' },
						{ id: 1, label: 'Entrant 2 (Right / Bottom)' },
					],
					default: 0,
				},
				{
					id: 'target',
					type: 'dropdown',
					label: 'Score Type',
					choices: [
						{ id: 'game', label: 'Game Score (Series Wins)' },
						{ id: 'round', label: 'Round in Game (Round Pips)' },
					],
					default: 'game',
				},
				{ id: 'delta', type: 'number', label: 'Change (+/-)', default: 1, min: -50, max: 50 },
			],
			callback: async ({ options }) =>
				run(() => {
					const m = resolveActiveTournamentMatch(self, options.matchId, false)
					if (!m) return
					const idx = Number(options.entrant) || 0
					const name = entrantName(idx === 0 ? m.entrant1 : m.entrant2)
					const d = Number(options.delta) || 0
					if (options.target === 'round') {
						return self.api.tournamentPost(
							'/score',
							{ matchId: m.id, entrant: name, entrantIndex: idx, roundDelta: d },
							false,
						)
					}
					const nextScore = Math.max(0, entrantScore(m, idx) + d)
					return self.api.tournamentPost(
						'/score',
						{
							matchId: m.id,
							entrant: name,
							entrantIndex: idx,
							delta: d,
							...(idx === 0 ? { entrant1Score: nextScore } : { entrant2Score: nextScore }),
						},
						false,
					)
				})(),
		},
		tournament_advance: {
			name: 'Tournament: confirm & advance match winner',
			description: 'Advance the winner of the active (or selected) match to the next bracket round',
			options: [
				{
					id: 'matchId',
					type: 'dropdown',
					label: 'Match',
					choices: tournamentMatchChoices(self),
					default: '',
				},
				{
					id: 'winner',
					type: 'dropdown',
					label: 'Winner to Advance',
					choices: [
						{ id: 'auto', label: 'Auto (Leading Entrant / Target Met)' },
						{ id: 'e1', label: 'Entrant 1 (Left / Top)' },
						{ id: 'e2', label: 'Entrant 2 (Right / Bottom)' },
						{ id: 'draw', label: 'Draw / Tie (Round Robin / Swiss)' },
					],
					default: 'auto',
				},
			],
			callback: async ({ options }) =>
				run(() => {
					const m = resolveActiveTournamentMatch(self, options.matchId, false)
					if (!m) return
					if (options.winner === 'draw') {
						return self.api.tournamentPost('/advance', { matchId: m.id, winner: 'DRAW', isDraw: true }, false)
					}
					const n1 = entrantName(m.entrant1)
					const n2 = entrantName(m.entrant2)
					const s1 = entrantScore(m, 0)
					const s2 = entrantScore(m, 1)
					const r1 = entrantRounds(m, 0)
					const r2 = entrantRounds(m, 1)
					let winnerName = null
					if (options.winner === 'e1') winnerName = n1
					else if (options.winner === 'e2') winnerName = n2
					else if (m.pendingWinner) winnerName = m.pendingWinner
					else if (s1 > s2) winnerName = n1
					else if (s2 > s1) winnerName = n2
					else if (r1 > r2) winnerName = n1
					else if (r2 > r1) winnerName = n2
					else winnerName = n1
					if (!winnerName) return
					return self.api.tournamentPost('/advance', { matchId: m.id, winner: winnerName }, false)
				})(),
		},
		tournament_control: {
			name: 'Tournament: match selection, highlight & bracket control',
			options: [
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'next_match', label: 'Select Next Ready Match' },
						{ id: 'prev_match', label: 'Select Previous Ready Match' },
						{ id: 'select_match', label: 'Pin Specific Match as Live' },
						{ id: 'unpin_match', label: 'Unpin Live Match (Concurrent Play)' },
						{ id: 'toggle_highlight', label: 'Toggle Live Match Highlight on Bracket' },
						{ id: 'reset_match', label: 'Reset Match Scores (0-0)' },
						{ id: 'rollback_match', label: 'Rollback / Reopen Completed Match' },
						{ id: 'start_poll_match', label: 'Poll Tournament: Launch Audience Vote for Active Match' },
					],
					default: 'next_match',
				},
				{
					id: 'matchId',
					type: 'dropdown',
					label: 'Target Match (optional)',
					choices: tournamentMatchChoices(self),
					default: '',
					isVisibleExpression: `$(options:action) == 'select_match' || $(options:action) == 'reset_match' || $(options:action) == 'rollback_match'`,
				},
			],
			callback: async ({ options }) =>
				run(() => {
					const t = self.state.tournament
					if (options.action === 'start_poll_match') {
						const pm = resolveActiveTournamentMatch(self, options.matchId, true)
						if (!pm) return
						return self.api.tournamentPost('/start-match', { matchId: pm.id }, true)
					}
					if (!t) return
					const ready = (t.matches || []).filter((m) => isReadyMatch(m) && !isCompletedMatch(m))
					if (options.action === 'next_match' || options.action === 'prev_match') {
						if (!ready.length) return
						const idx = ready.findIndex((m) => m.id === t.activeMatchId)
						const step = options.action === 'next_match' ? 1 : -1
						const nextIdx = idx === -1 ? 0 : (idx + step + ready.length) % ready.length
						return self.api.tournamentPost('/select-match', { matchId: ready[nextIdx].id }, false)
					}
					if (options.action === 'select_match') {
						const m = resolveActiveTournamentMatch(self, options.matchId, false)
						return self.api.tournamentPost('/select-match', { matchId: m ? m.id : null }, false)
					}
					if (options.action === 'unpin_match') {
						return self.api.tournamentPost('/select-match', { matchId: null }, false)
					}
					if (options.action === 'toggle_highlight') {
						const cur = t.highlightLive !== false
						return self.api.tournamentPost('/settings', { highlightLive: !cur }, false)
					}
					if (options.action === 'reset_match') {
						const m = resolveActiveTournamentMatch(self, options.matchId, false)
						if (!m) return
						return self.api.tournamentPost('/reset-match', { matchId: m.id }, false)
					}
					if (options.action === 'rollback_match') {
						const m = resolveActiveTournamentMatch(self, options.matchId, false)
						if (!m) return
						return self.api.tournamentPost('/rollback', { matchId: m.id }, false)
					}
				})(),
		},
		randomizer_restore: {
			name: 'Randomizer: restore removed choices',
			description: 'Put every eliminated or taken-out choice back in the pool',
			options: [
				{
					id: 'preset',
					type: 'dropdown',
					label: 'Preset',
					choices: randomizerPresetChoices(self),
					default: '',
					allowCustom: true,
				},
			],
			callback: async ({ options }) => {
				const presetId = options.preset || (self.state.randomizerLast && self.state.randomizerLast.preset) || (self.state.randomizerPresets && self.state.randomizerPresets[0] && self.state.randomizerPresets[0].id)
				if (!presetId) return
				await run(() => self.api.randomizerRestore(presetId))()
			},
		},
	})
}
