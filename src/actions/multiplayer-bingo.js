function bingoCardChoices(state) {
	const cards = state?.session?.cards || []
	return [
		{ id: '', label: '(Clear focus / show all cards)' },
		...cards.map((c) => ({ id: c.id, label: c.playerName || c.name || c.id })),
	]
}

function bingoPackChoices(state) {
	const packs = state?.packs || []
	return packs.length
		? packs.map((p) => ({ id: p.id, label: p.name || p.id }))
		: [{ id: '', label: '(no prompt packs found)' }]
}

function bingoPromptChoices(state) {
	const prompts = state?.activePack?.prompts || []
	return prompts.length
		? prompts.map((p, idx) => {
				const text = typeof p === 'string' ? p : p?.text || p?.label || `Prompt ${idx + 1}`
				return { id: String(idx), label: `${idx + 1}. ${text}` }
			})
		: [{ id: '0', label: '(no prompts found)' }]
}

module.exports = function (self, run) {
	const cardChoices = bingoCardChoices(self.state.multiplayerBingo)
	const packChoices = bingoPackChoices(self.state.multiplayerBingo)
	const promptChoices = bingoPromptChoices(self.state.multiplayerBingo)
	return {
		multiplayer_bingo_flags: {
			name: 'Multiplayer Bingo: Lock, hide or toggle board modes',
			description:
				'Lock/unlock player stamping, hide/show the OBS overlay, or toggle Four Corners Win Mode and Host Confirm Player Calls Mode.',
			options: [
				{
					id: 'field',
					type: 'dropdown',
					label: 'Setting',
					choices: [
						{ id: 'locked', label: 'Player Stamping Lock' },
						{ id: 'hidden', label: 'Overlay Hidden' },
						{ id: 'fourCorners', label: 'Four Corners Win Mode' },
						{ id: 'confirmCalls', label: 'Host Confirm Player Calls Mode' },
					],
					default: 'locked',
				},
				{
					id: 'mode',
					type: 'dropdown',
					label: 'State',
					choices: [
						{ id: 'toggle', label: 'Toggle' },
						{ id: 'true', label: 'Enable (On)' },
						{ id: 'false', label: 'Disable (Off)' },
					],
					default: 'toggle',
				},
			],
			callback: async ({ options }) =>
				run(() => {
					const cur = Boolean(self.state.multiplayerBingo?.session?.[options.field])
					const next = options.mode === 'toggle' ? !cur : options.mode === 'true'
					return self.api.request('/api/multiplayer-bingo/flags', {
						method: 'POST',
						body: { [options.field]: next },
					})
				})(),
		},
		multiplayer_bingo_focus: {
			name: 'Multiplayer Bingo: Focus player card',
			description: 'Zoom the Multiplayer Bingo overlay onto one player card or clear focus to show all cards.',
			options: [
				{
					id: 'card',
					type: 'dropdown',
					label: 'Player Card',
					choices: cardChoices,
					default: '',
				},
				{
					id: 'toggle',
					type: 'checkbox',
					label: 'Toggle off if already focused',
					default: true,
				},
			],
			callback: async ({ options }) =>
				run(() =>
					self.api.request('/api/multiplayer-bingo/focus', {
						method: 'POST',
						body: { card: options.card || '', toggle: Boolean(options.toggle) },
					}),
				)(),
		},
		multiplayer_bingo_board: {
			name: 'Multiplayer Bingo: Shuffle or reset cards',
			description: 'Shuffle all player cards with fresh prompts or clear all stamped cells.',
			options: [
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'reset', label: 'Clear All Stamps (Reset Board)' },
						{ id: 'shuffle', label: 'Deal Fresh Shuffled Cards' },
					],
					default: 'reset',
				},
				{
					id: 'confirm',
					type: 'checkbox',
					label: 'Confirm modifying all live player bingo cards',
					default: false,
				},
			],
			callback: async ({ options }) => {
				if (!options.confirm) {
					self.log('warn', 'Multiplayer Bingo board reset/shuffle ignored: confirm checkbox is unchecked')
					return
				}
				return run(() =>
					self.api.request(`/api/multiplayer-bingo/${options.action === 'shuffle' ? 'shuffle' : 'reset'}`, {
						method: 'POST',
					}),
				)()
			},
		},
		multiplayer_bingo_call: {
			name: 'Multiplayer Bingo: Host Caller mark/unmark prompt',
			description: 'Mark, unmark, or toggle a prompt across all player cards as the Host Caller.',
			options: [
				{
					id: 'prompt',
					type: 'dropdown',
					label: 'Prompt',
					choices: promptChoices,
					default: promptChoices[0].id,
				},
				{
					id: 'customPrompt',
					type: 'textinput',
					label: 'Override prompt index (0-based, optional)',
					default: '',
					useVariables: true,
				},
				{
					id: 'mode',
					type: 'dropdown',
					label: 'State',
					choices: [
						{ id: 'toggle', label: 'Toggle' },
						{ id: 'true', label: 'Mark Called' },
						{ id: 'false', label: 'Unmark Called' },
					],
					default: 'toggle',
				},
			],
			callback: async ({ options }) =>
				run(async () => {
					const custom = (await self.parseVariablesInString(String(options.customPrompt || ''))).trim()
					const prompt = Number(custom !== '' ? custom : options.prompt)
					if (!Number.isInteger(prompt) || prompt < 0) throw new Error('Valid 0-based prompt index is required')
					const body = { prompt }
					if (options.mode === 'true') body.called = true
					else if (options.mode === 'false') body.called = false
					return self.api.request('/api/multiplayer-bingo/call', {
						method: 'POST',
						body,
					})
				})(),
		},
		multiplayer_bingo_pack_select: {
			name: 'Multiplayer Bingo: Select prompt pack',
			description: 'Switch the active Multiplayer Bingo prompt pack and deal fresh shuffled cards.',
			options: [
				{
					id: 'pack',
					type: 'dropdown',
					label: 'Prompt Pack',
					choices: packChoices,
					default: packChoices[0].id,
				},
				{
					id: 'confirm',
					type: 'checkbox',
					label: 'Confirm switching prompt pack (deals fresh cards)',
					default: false,
				},
			],
			callback: async ({ options }) => {
				if (!options.confirm) {
					self.log('warn', 'Multiplayer Bingo pack select ignored: confirm checkbox is unchecked')
					return
				}
				return run(() => {
					const id = String(options.pack || '').trim()
					if (!id) throw new Error('Select a prompt pack first')
					return self.api.request('/api/multiplayer-bingo/packs/select', {
						method: 'POST',
						body: { id },
					})
				})()
			},
		},
		multiplayer_bingo_pending: {
			name: 'Multiplayer Bingo: Confirm or dismiss pending player calls',
			description: 'Approve or dismiss pending player cell calls when Host Confirm Mode is enabled.',
			options: [
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'confirm', label: 'Confirm (Approve)' },
						{ id: 'dismiss', label: 'Dismiss (Reject)' },
					],
					default: 'confirm',
				},
				{
					id: 'scope',
					type: 'dropdown',
					label: 'Scope',
					choices: [
						{ id: 'all', label: 'All Pending Calls' },
						{ id: 'prompt', label: 'Specific Prompt Index' },
					],
					default: 'all',
				},
				{
					id: 'prompt',
					type: 'dropdown',
					label: 'Prompt',
					choices: promptChoices,
					default: promptChoices[0].id,
					isVisible: (options) => options.scope === 'prompt',
				},
				{
					id: 'customPrompt',
					type: 'textinput',
					label: 'Override prompt index (0-based, optional)',
					default: '',
					useVariables: true,
					isVisible: (options) => options.scope === 'prompt',
				},
			],
			callback: async ({ options }) =>
				run(async () => {
					const endpoint =
						options.action === 'dismiss' ? '/api/multiplayer-bingo/dismiss' : '/api/multiplayer-bingo/confirm'
					if (options.scope === 'prompt') {
						const custom = (await self.parseVariablesInString(String(options.customPrompt || ''))).trim()
						const prompt = Number(custom !== '' ? custom : options.prompt)
						if (!Number.isInteger(prompt) || prompt < 0) throw new Error('Valid 0-based prompt index is required')
						return self.api.request(endpoint, { method: 'POST', body: { prompt } })
					}
					return self.api.request(endpoint, { method: 'POST', body: { all: true } })
				})(),
		},
	}
}

module.exports.bingoCardChoices = bingoCardChoices
module.exports.bingoPackChoices = bingoPackChoices
module.exports.bingoPromptChoices = bingoPromptChoices
