const { GREEN, WHITE, DARK_GRAY } = require('./colors')

module.exports = function (self) {
	const presets = {}
	for (const set of self.state.variableSets || []) {
		presets[`variable_set_rotation_${set.id}`] = {
			type: 'button',
			category: 'Variable Sets',
			name: `${set.name || set.id}: Toggle Rotation`,
			style: { text: `${set.name || set.id}\\nROTATION`, size: '14', color: WHITE, bgcolor: DARK_GRAY },
			steps: [{ down: [{ actionId: 'variable_set_rotation_toggle', options: { set: set.id } }], up: [] }],
			feedbacks: [
				{ feedbackId: 'variable_set_rotating', options: { set: set.id }, style: { color: WHITE, bgcolor: GREEN } },
			],
		}
	}
	return presets
}
