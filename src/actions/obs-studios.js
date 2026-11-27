function profileChoices(state) {
	const profiles = state?.profiles || []
	return profiles.length
		? profiles.map((profile) => ({ id: profile.id, label: profile.name || profile.id }))
		: [{ id: '', label: '(no profiles found)' }]
}

function layoutChoices(state) {
	const layouts = state?.layouts || []
	return layouts.length
		? layouts.map((layout) => ({
				id: layout.id,
				label: layout.sceneName ? `${layout.name || layout.id} (${layout.sceneName})` : layout.name || layout.id,
			}))
		: [{ id: '', label: '(no layouts found)' }]
}

function profileOptions(state, label, special) {
	const choices = [...profileChoices(state), ...special]
	return [
		{ id: 'profile', type: 'dropdown', label, choices, default: choices[0].id },
		{ id: 'target', type: 'textinput', label: 'OBS source (blank = active default)', default: '', useVariables: true },
		{ id: 'scene', type: 'textinput', label: 'Scene override (optional)', default: '', useVariables: true },
	]
}

module.exports = function (self, run) {
	const activate =
		(domain) =>
		async ({ options }) =>
			run(async () => {
				const target = await self.parseVariablesInString(String(options.target || ''))
				const scene = await self.parseVariablesInString(String(options.scene || ''))
				if (!target.trim() && ['auto', 'none', 'inherit'].includes(options.profile))
					throw new Error('A source is required for Auto, None or Inherit')
				if (options.profile === 'inherit' && !scene.trim()) throw new Error('A scene is required for Inherit')
				return self.api.request(`/api/obs-${domain}/activate`, {
					method: 'POST',
					body: { profileId: options.profile, sourceName: target.trim(), sceneName: scene.trim() },
				})
			})()
	return {
		obs_border_activate: {
			name: 'OBS Studio: Activate or assign border profile',
			description: 'Set the active default, or assign a profile to an OBS source and optional scene.',
			options: profileOptions(self.state.obsBorders, 'Border profile', [
				{ id: 'none', label: 'None (source only)' },
				{ id: 'inherit', label: 'Inherit (scene override only)' },
			]),
			callback: activate('borders'),
		},
		obs_pattern_activate: {
			name: 'OBS Studio: Activate or assign pattern profile',
			description: 'Set the active default, or assign a profile to an OBS source and optional scene.',
			options: profileOptions(self.state.obsPatterns, 'Pattern profile', [
				{ id: 'auto', label: 'Auto (source only)' },
				{ id: 'inherit', label: 'Inherit (scene override only)' },
			]),
			callback: activate('patterns'),
		},
		obs_border_standby: {
			name: 'OBS Studio: Set border background standby',
			description: 'Enable, disable or toggle standby for a border profile background.',
			options: [
				{
					id: 'profile',
					type: 'dropdown',
					label: 'Border profile',
					choices: profileChoices(self.state.obsBorders),
					default: profileChoices(self.state.obsBorders)[0].id,
				},
				{
					id: 'enabled',
					type: 'dropdown',
					label: 'Standby',
					choices: [
						{ id: 'toggle', label: 'Toggle' },
						{ id: '1', label: 'On' },
						{ id: '0', label: 'Off' },
					],
					default: 'toggle',
				},
			],
			callback: async ({ options }) =>
				run(() =>
					self.api.request('/api/obs-borders/standby', {
						method: 'POST',
						body: { profileId: options.profile, enabled: options.enabled },
					}),
				)(),
		},
		obs_layout_apply: {
			name: 'OBS Studio: Apply saved scene layout',
			description: 'Smoothly animate OBS scene sources to a saved OBS Layout Studio preset.',
			options: [
				{
					id: 'layout',
					type: 'dropdown',
					label: 'Saved Layout',
					choices: layoutChoices(self.state.obsLayout),
					default: layoutChoices(self.state.obsLayout)[0].id,
				},
				{
					id: 'durationMs',
					type: 'number',
					label: 'Duration override (ms, 0 = preset default)',
					default: 0,
					min: 0,
					max: 10000,
				},
			],
			callback: async ({ options }) =>
				run(() => {
					if (!options.layout) throw new Error('Select a saved OBS layout first')
					const body = { id: options.layout }
					if (Number(options.durationMs) > 0) body.durationMs = Number(options.durationMs)
					return self.api.request('/api/obs-layout/layouts/apply', {
						method: 'POST',
						body,
					})
				})(),
		},
		obs_layout_aspect: {
			name: 'OBS Studio: Morph or cycle source aspect ratio',
			description:
				'Smoothly morph an OBS source to a target aspect ratio or cycle through ratios via OBS Layout & Aspect Studio.',
			options: [
				{
					id: 'sourceName',
					type: 'textinput',
					label: 'OBS source name',
					default: '',
					useVariables: true,
				},
				{
					id: 'ratio',
					type: 'dropdown',
					label: 'Aspect ratio',
					choices: [
						{ id: 'cycle', label: 'Cycle Next Ratio' },
						{ id: 'native', label: 'Native (Original)' },
						{ id: '16:9', label: '16:9 (Widescreen)' },
						{ id: '4:3', label: '4:3 (Classic)' },
						{ id: '1:1', label: '1:1 (Square)' },
						{ id: '4:5', label: '4:5 (Portrait)' },
						{ id: '9:16', label: '9:16 (Vertical)' },
						{ id: '21:9', label: '21:9 (Ultrawide)' },
					],
					default: 'cycle',
				},
				{
					id: 'durationMs',
					type: 'number',
					label: 'Transition duration (ms)',
					default: 450,
					min: 0,
					max: 10000,
				},
			],
			callback: async ({ options }) =>
				run(async () => {
					const sourceName = (await self.parseVariablesInString(String(options.sourceName || ''))).trim()
					if (!sourceName) throw new Error('OBS source name is required')
					const ratio = String(options.ratio || 'cycle')
					const body = {
						sourceName,
						...(ratio === 'cycle' ? { action: 'cycle' } : { action: 'set', ratio }),
					}
					if (Number.isFinite(Number(options.durationMs))) {
						body.durationMs = Math.max(0, Number(options.durationMs))
					}
					return self.api.request('/api/obs-layout/aspect', {
						method: 'POST',
						body,
					})
				})(),
		},
	}
}

module.exports.profileChoices = profileChoices
module.exports.layoutChoices = layoutChoices
