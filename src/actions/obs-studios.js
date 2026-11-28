function profileChoices(state) {
	const profiles = state?.profiles || []
	return profiles.length
		? profiles.map((profile) => ({ id: profile.id, label: profile.name || profile.id }))
		: [{ id: '', label: '(no profiles found)' }]
}

function sourceChoices(state, inactiveId = 'none') {
	const assignments = state?.assignments || {}
	const profileNames = new Map((state?.profiles || []).map((p) => [p.id, p.name || p.id]))
	const sourceSet = new Set([
		...Object.keys(assignments),
		...(Array.isArray(state?.knownSources) ? state.knownSources : []),
	])
	for (const list of Object.values(state?.sceneSources || {})) {
		if (Array.isArray(list)) list.forEach((src) => src && sourceSet.add(src))
	}
	const entries = [...sourceSet]
		.map((name) => String(name || '').trim())
		.filter(Boolean)
		.map((name) => {
			const cfg = assignments[name] || {}
			const defId = cfg.defaultProfileId || ''
			const hasDef = Boolean(defId && defId !== inactiveId && defId !== 'inherit')
			const sceneOverrides = Object.entries(cfg.sceneOverrides || cfg.byScene || {}).filter(
				([, pid]) => pid && pid !== inactiveId && pid !== 'inherit',
			)
			const active = hasDef || sceneOverrides.length > 0
			const parts = []
			if (hasDef) parts.push(profileNames.get(defId) || defId)
			if (sceneOverrides.length === 1) {
				const [scn, pid] = sceneOverrides[0]
				parts.push(`${scn}: ${profileNames.get(pid) || pid}`)
			} else if (sceneOverrides.length > 1) {
				parts.push(`${sceneOverrides.length} scene overrides`)
			}
			const label = parts.length ? `${name} [${parts.join(' · ')}]` : name
			return { id: name, label, active }
		})
	entries.sort((a, b) => Number(b.active) - Number(a.active) || a.id.localeCompare(b.id))
	return entries.map(({ id, label }) => ({ id, label }))
}

function sceneChoices(state, inactiveId = 'none') {
	const assignments = state?.assignments || {}
	const sceneSet = new Set([
		...(Array.isArray(state?.knownScenes) ? state.knownScenes : []),
		...Object.keys(state?.sceneSources || {}),
	])
	const overrideCounts = new Map()
	for (const cfg of Object.values(assignments)) {
		for (const [scn, pid] of Object.entries(cfg?.sceneOverrides || cfg?.byScene || {})) {
			if (!scn) continue
			sceneSet.add(scn)
			if (pid && pid !== inactiveId && pid !== 'inherit') {
				overrideCounts.set(scn, (overrideCounts.get(scn) || 0) + 1)
			}
		}
	}
	const entries = [...sceneSet]
		.map((name) => String(name || '').trim())
		.filter(Boolean)
		.map((name) => {
			const count = overrideCounts.get(name) || 0
			const label = count > 0 ? `${name} [${count} active]` : name
			return { id: name, label, count }
		})
	entries.sort((a, b) => b.count - a.count || a.id.localeCompare(b.id))
	return entries.map(({ id, label }) => ({ id, label }))
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

function profileOptions(state, label, special, inactiveId = 'none') {
	const choices = [...profileChoices(state), ...special]
	return [
		{ id: 'profile', type: 'dropdown', label, choices, default: choices[0].id },
		{
			id: 'targets',
			type: 'multidropdown',
			label: 'OBS sources (multi-select; blank = active default)',
			choices: sourceChoices(state, inactiveId),
			default: [],
			minSelection: 0,
		},
		{
			id: 'scenes',
			type: 'multidropdown',
			label: 'Scenes (optional multi-select; blank = source default)',
			choices: sceneChoices(state, inactiveId),
			default: [],
			minSelection: 0,
		},
		{ id: 'target', type: 'textinput', label: 'Custom OBS source (optional, supports variables)', default: '', useVariables: true },
		{ id: 'scene', type: 'textinput', label: 'Custom scene override (optional, supports variables)', default: '', useVariables: true },
	]
}

module.exports = function (self, run) {
	const activate =
		(domain) =>
		async ({ options }) =>
			run(async () => {
				const rawTarget = await self.parseVariablesInString(String(options.target || ''))
				const rawScene = await self.parseVariablesInString(String(options.scene || ''))
				const targets = [
					...(Array.isArray(options.targets) ? options.targets : []),
					...rawTarget.split(','),
				]
					.map((v) => String(v || '').trim())
					.filter(Boolean)
				const scenes = [
					...(Array.isArray(options.scenes) ? options.scenes : []),
					...rawScene.split(','),
				]
					.map((v) => String(v || '').trim())
					.filter(Boolean)
				const uniqueTargets = [...new Set(targets)]
				const uniqueScenes = [...new Set(scenes)]
				if (!uniqueTargets.length && ['auto', 'none', 'inherit'].includes(options.profile))
					throw new Error('A source is required for Auto, None or Inherit')
				if (options.profile === 'inherit' && !uniqueScenes.length) throw new Error('A scene is required for Inherit')
				const body =
					uniqueTargets.length > 1 || uniqueScenes.length > 1
						? { profileId: options.profile, sourceNames: uniqueTargets, sceneNames: uniqueScenes }
						: {
								profileId: options.profile,
								sourceName: uniqueTargets[0] || '',
								sceneName: uniqueScenes[0] || '',
							}
				return self.api.request(`/api/obs-${domain}/activate`, {
					method: 'POST',
					body,
				})
			})()
	return {
		obs_border_activate: {
			name: 'OBS Studio: Activate or assign border profile',
			description: 'Set the active default, or assign a profile to one or more OBS sources and optional scenes.',
			options: profileOptions(
				self.state.obsBorders,
				'Border profile',
				[
					{ id: 'none', label: 'None (source only)' },
					{ id: 'inherit', label: 'Inherit (scene override only)' },
				],
				'none',
			),
			callback: activate('borders'),
		},
		obs_pattern_activate: {
			name: 'OBS Studio: Activate or assign pattern profile',
			description: 'Set the active default, or assign a profile to one or more OBS sources and optional scenes.',
			options: profileOptions(
				self.state.obsPatterns,
				'Pattern profile',
				[
					{ id: 'auto', label: 'Auto (source only)' },
					{ id: 'inherit', label: 'Inherit (scene override only)' },
				],
				'auto',
			),
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
