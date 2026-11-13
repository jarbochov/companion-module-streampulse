const ruleChoices = (self) => {
	const list = self.state.rules.map((r) => ({ id: r.id, label: r.name || r.id }))
	return list.length ? list : [{ id: '', label: '(no alert rules found)' }]
}

module.exports = function (self, run) {
	return {
		alert_queue: {
			name: 'Alerts: Queue control (skip, pause, resume, clear)',
			description: 'Skip the current alert, pause or resume the queue, or clear waiting alerts',
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
		alert_mute: {
			name: 'Alerts: Mute / unmute display',
			description: 'Hold or resume alert display on overlays while keeping incoming alerts queued',
			options: [
				{
					id: 'state',
					type: 'dropdown',
					label: 'State',
					choices: [
						{ id: 'toggle', label: 'Toggle' },
						{ id: 'mute', label: 'Mute' },
						{ id: 'unmute', label: 'Unmute' },
					],
					default: 'toggle',
				},
			],
			callback: async ({ options }) => {
				const cur = !!(self.state.alerts && self.state.alerts.muted)
				const next = options.state === 'toggle' ? !cur : options.state === 'mute'
				await run(() => self.api.alertMute(next))()
			},
		},
		alert_fire: {
			name: 'Alerts: Fire alert or announcement',
			description: 'Fire a rule or announcement now, optionally overriding its text',
			options: [
				{
					id: 'rule',
					type: 'dropdown',
					label: 'Rule / announcement',
					choices: ruleChoices(self),
					default: ruleChoices(self)[0].id,
				},
				{ id: 'message', type: 'textinput', label: 'Text override (optional)', default: '', useVariables: true },
			],
			callback: async ({ options }) => run(() => self.api.alertTrigger(options.rule, options.message))(),
		},
		alert_replay_last: {
			name: 'Alerts: Replay last alert',
			description: 'Replay the most recent alert or the last N alerts from history',
			options: [
				{
					id: 'count',
					type: 'number',
					label: 'Number of alerts to replay',
					default: 1,
					min: 1,
					max: 50,
				},
			],
			callback: async ({ options } = {}) => {
				const history = (self.state.alerts && self.state.alerts.history) || []
				const count = Math.max(1, Math.min(50, Math.round(Number(options?.count) || 1)))
				const stamp = (a) => Date.parse(a.shownAt || a.at) || 0
				const targets = history
					.slice()
					.sort((a, b) => stamp(b) - stamp(a))
					.slice(0, count)
					.reverse()
				if (!targets.length) return self.log('warn', 'No alert history to replay')
				return run(async () => {
					for (const item of targets) {
						await self.api.replayAlert(item.id)
					}
				})()
			},
		},
		alert_test: {
			name: 'Alerts: Fire test for rule',
			description: 'Fire a test alert for a specific rule regardless of trigger conditions',
			options: [
				{ id: 'rule', type: 'dropdown', label: 'Rule', choices: ruleChoices(self), default: ruleChoices(self)[0].id },
			],
			callback: async ({ options }) => run(() => self.api.alertTest(options.rule))(),
		},
		alert_test_event: {
			name: 'Alerts: Simulate stream event (follow, sub, bits, raid)',
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
		alert_test_webhook: {
			name: 'Alerts: Test webhook or Companion button press',
			description: 'Test an HTTP webhook URL or Companion /press endpoint directly from Companion',
			options: [
				{
					id: 'url',
					type: 'textinput',
					label: 'Webhook or Companion URL (e.g. http://127.0.0.1:8000/api/location/1/0/0/press/)',
					default: 'http://127.0.0.1:8000/api/location/1/0/0/press/',
				},
				{
					id: 'method',
					type: 'dropdown',
					label: 'HTTP Method',
					choices: [
						{ id: 'POST', label: 'POST (Default & required for Companion /press)' },
						{ id: 'GET', label: 'GET' },
					],
					default: 'POST',
				},
			],
			callback: async ({ options }) => run(() => self.api.alertTestWebhook(options.url, options.method))(),
		},
	}
}
