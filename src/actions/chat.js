const chatCommandChoices = (self) => {
	const list = (self.state.chatChoices || []).filter((c) => !c.label.startsWith('Timed:'))
	return list.length ? list : [{ id: '', label: '(no commands or triggers found)' }]
}

module.exports = function (self, run) {
	return {
		chat_bot_toggle: {
			name: 'Chat Bot: Turn on, off or toggle',
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
			name: 'Chat Bot: Send a chat message',
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
			name: 'Chat Bot: Run a command or trigger',
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
			name: 'Chat Bot: Send a quote to chat',
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
	}
}
