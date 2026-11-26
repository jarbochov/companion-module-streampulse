function bingoCardChoices(state) {
	const cards = state?.session?.cards || []
	return [
		{ id: '', label: '(Clear focus / show all cards)' },
		...cards.map((c) => ({ id: c.id, label: c.playerName || c.id })),
	]
}

module.exports = function (self, run) {
	const cardChoices = bingoCardChoices(self.state.multiplayerBingo)
	return {
		multiplayer_bingo_flags: {
			name: 'Multiplayer Bingo: Lock or hide board',
			description: 'Lock/unlock player card stamping or hide/show the Multiplayer Bingo OBS overlay.',
			options: [
				{
					id: 'field',
					type: 'dropdown',
					label: 'Setting',
					choices: [
						{ id: 'locked', label: 'Player Stamping Lock' },
						{ id: 'hidden', label: 'Overlay Hidden' },
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
	}
}

module.exports.bingoCardChoices = bingoCardChoices
