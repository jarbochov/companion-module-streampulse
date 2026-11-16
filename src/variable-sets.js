const setChoices = (self) => {
	const list = (self.state.variableSets || []).map((set) => ({ id: set.id, label: set.name || set.id }))
	return list.length ? list : [{ id: '', label: '(no Variable Sets found)' }]
}

const setOption = (self) => ({
	id: 'set',
	type: 'dropdown',
	label: 'Variable Set',
	choices: setChoices(self),
	default: setChoices(self)[0].id,
})

const trackerChoices = (sets, withTarget = false) => {
	const choices = []
	for (const set of sets || []) {
		for (const field of set.fields || []) {
			const fieldId = field.id || field.key
			if (field.type !== 'checklist' || !fieldId) continue
			const label = `${set.name || set.id} / ${field.label || field.name || fieldId}`
			if (!withTarget) {
				choices.push({ id: JSON.stringify([set.id, fieldId]), label })
				continue
			}
			const targetSet = sets.find((candidate) => candidate.id === field.targetSet)
			for (const target of targetSet?.roster || []) {
				choices.push({
					id: JSON.stringify([set.id, fieldId, target.id]),
					label: `${label} / ${target.label || target.id}`,
				})
			}
		}
	}
	return choices.length ? choices : [{ id: '', label: withTarget ? '(no tracker items found)' : '(no trackers found)' }]
}

const setPrefix = (id) =>
	`set_${String(id)
		.toLowerCase()
		.replace(/[^a-z0-9_]/g, '_')}`

const setShape = (sets) => JSON.stringify((sets || []).map((set) => [set.id, set.name, set.slotsCount]))
const entryLabel = (set, id) => (id && (set.roster || []).find((entry) => entry.id === id)?.label) || ''

module.exports = { setChoices, setOption, setPrefix, setShape, entryLabel, trackerChoices }
