function operatorProfileChoices(state) {
	const profiles = state?.profiles || []
	return profiles.length
		? profiles.map((p) => ({ id: p.id, label: p.name || p.id }))
		: [{ id: '', label: '(no operator presets found)' }]
}

module.exports = function (self, run) {
	const choices = operatorProfileChoices(self.state.operator)
	return {
		operator_profile_select: {
			name: 'Operator: Switch active preset board',
			description: 'Switch the active Operator Mode preset board live across connected StreamPulse browsers.',
			options: [
				{
					id: 'profile',
					type: 'dropdown',
					label: 'Operator Preset',
					choices,
					default: choices[0].id,
				},
				{
					id: 'customTarget',
					type: 'textinput',
					label: 'Override ID or Name (optional)',
					default: '',
					useVariables: true,
				},
			],
			callback: async ({ options }) =>
				run(async () => {
					const custom = (await self.parseVariablesInString(String(options.customTarget || ''))).trim()
					const target = custom || String(options.profile || '').trim()
					if (!target) throw new Error('Select an Operator preset or provide a preset ID/name')
					return self.api.request('/api/operator/profile/select', {
						method: 'POST',
						body: { id: target },
					})
				})(),
		},
	}
}

module.exports.operatorProfileChoices = operatorProfileChoices
