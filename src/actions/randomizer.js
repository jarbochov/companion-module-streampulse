const randomizerPresetChoices = (self) => {
	const list = (self.state.randomizerPresets || []).map((p) => ({ id: p.id, label: p.name || p.id }))
	return [{ id: '', label: '(Active / Current Preset)' }, ...list]
}

const randomizerButtonPresetChoices = (self) => [
	{ id: '', label: '(Studio / Overlay phrase preset)' },
	...(self.state.randomizerButtonPresets || []).map((p) => ({ id: p.id, label: p.name || p.id })),
	{ id: 'static', label: 'Fixed Single Title' },
]

module.exports = function (self, run) {
	return {
		randomizer_spin: {
			name: 'Randomizer: Spin wheel, roller or card deck',
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
						body.buttonPhrases = phrases
							.split(/\r?\n/)
							.map((phrase) => phrase.trim())
							.filter(Boolean)
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
		randomizer_restore: {
			name: 'Randomizer: Restore removed choices',
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
				const presetId =
					options.preset ||
					(self.state.randomizerLast && self.state.randomizerLast.preset) ||
					(self.state.randomizerPresets && self.state.randomizerPresets[0] && self.state.randomizerPresets[0].id)
				if (!presetId) return
				await run(() => self.api.randomizerRestore(presetId))()
			},
		},
	}
}
