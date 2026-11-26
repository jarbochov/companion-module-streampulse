function projectChoices(state, includeActive = false) {
	const projects = state?.projects || []
	const list = projects.map((p) => ({ id: p.id, label: p.name || p.id }))
	if (includeActive) return [{ id: '', label: '(Active project)' }, ...list]
	return list.length ? list : [{ id: '', label: '(no projects found)' }]
}

module.exports = function (self, run) {
	const cs = self.state.creditSuite
	const projChoices = projectChoices(cs, false)
	const projChoicesWithActive = projectChoices(cs, true)

	return {
		credit_suite_transport: {
			name: 'Credit Suite: Playback transport (play / pause / toggle / restart / stop)',
			description: 'Control live Credit Suite playback on OBS overlays via WebSocket transport.',
			options: [
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'toggle', label: 'Toggle Play / Pause' },
						{ id: 'play', label: 'Play' },
						{ id: 'pause', label: 'Pause' },
						{ id: 'restart', label: 'Restart from Top' },
						{ id: 'stop', label: 'Stop & Reset' },
					],
					default: 'toggle',
				},
				{
					id: 'project',
					type: 'dropdown',
					label: 'Project',
					choices: projChoicesWithActive,
					default: '',
				},
			],
			callback: async ({ options }) =>
				run(() =>
					self.api.request(`/api/credit-suite/${encodeURIComponent(options.action || 'toggle')}`, {
						method: 'POST',
						body: options.project ? { projectId: options.project } : {},
					}),
				)(),
		},
		credit_suite_activate: {
			name: 'Credit Suite: Select active project',
			description: 'Switch the active Credit Suite project shown on the default live overlay URL.',
			options: [
				{
					id: 'project',
					type: 'dropdown',
					label: 'Project',
					choices: projChoices,
					default: projChoices[0].id,
				},
			],
			callback: async ({ options }) =>
				run(() => {
					if (!options.project) throw new Error('Select a Credit Suite project first')
					return self.api.request('/api/credit-suite/activate', {
						method: 'POST',
						body: { projectId: options.project },
					})
				})(),
		},
		credit_suite_jump: {
			name: 'Credit Suite: Jump to section marker or timestamp',
			description: 'Jump playback directly to a named credit section marker or exact timestamp in seconds.',
			options: [
				{
					id: 'mode',
					type: 'dropdown',
					label: 'Target Type',
					choices: [
						{ id: 'marker', label: 'Section Marker Name' },
						{ id: 'seek', label: 'Timestamp (seconds)' },
					],
					default: 'marker',
				},
				{
					id: 'target',
					type: 'textinput',
					label: 'Marker name or seconds',
					default: '',
					useVariables: true,
				},
				{
					id: 'play',
					type: 'dropdown',
					label: 'After Jump',
					choices: [
						{ id: 'true', label: 'Play' },
						{ id: 'false', label: 'Pause' },
						{ id: '', label: 'Keep Current State' },
					],
					default: 'true',
				},
				{
					id: 'project',
					type: 'dropdown',
					label: 'Project',
					choices: projChoicesWithActive,
					default: '',
				},
			],
			callback: async ({ options }) =>
				run(async () => {
					const raw = (await self.parseVariablesInString(String(options.target || ''))).trim()
					if (!raw) throw new Error('Target marker or timestamp is required')
					const body = {}
					if (options.project) body.projectId = options.project
					if (options.play === 'true') body.play = true
					else if (options.play === 'false') body.play = false
					if (options.mode === 'seek') {
						const sec = Number(raw)
						if (!Number.isFinite(sec) || sec < 0) throw new Error('Timestamp must be a non-negative number of seconds')
						body.t = sec
						return self.api.request('/api/credit-suite/seek', { method: 'POST', body })
					}
					body.marker = raw
					return self.api.request('/api/credit-suite/jump', { method: 'POST', body })
				})(),
		},
		credit_suite_speed: {
			name: 'Credit Suite: Set playback speed',
			description: 'Adjust the live playback speed multiplier for Credit Suite (0.25x to 4x).',
			options: [
				{
					id: 'rate',
					type: 'dropdown',
					label: 'Playback Speed',
					allowCustom: true,
					choices: [
						{ id: '0.5', label: '0.5x (Slow)' },
						{ id: '0.75', label: '0.75x' },
						{ id: '1', label: '1.0x (Normal)' },
						{ id: '1.25', label: '1.25x' },
						{ id: '1.5', label: '1.5x (Fast)' },
						{ id: '2', label: '2.0x (Double)' },
						{ id: '3', label: '3.0x' },
					],
					default: '1',
				},
				{
					id: 'project',
					type: 'dropdown',
					label: 'Project',
					choices: projChoicesWithActive,
					default: '',
				},
			],
			callback: async ({ options }) =>
				run(async () => {
					const parsed = Number(await self.parseVariablesInString(String(options.rate || '1')))
					const rate = Number.isFinite(parsed) ? parsed : 1
					return self.api.request('/api/credit-suite/speed', {
						method: 'POST',
						body: { rate, ...(options.project ? { projectId: options.project } : {}) },
					})
				})(),
		},
	}
}

module.exports.projectChoices = projectChoices
