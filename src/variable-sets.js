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

const setPrefix = (id) =>
	`set_${String(id)
		.toLowerCase()
		.replace(/[^a-z0-9_]/g, '_')}`

const setShape = (sets) => JSON.stringify((sets || []).map((set) => [set.id, set.name, set.slotsCount]))
const entryLabel = (set, id) => (id && (set.roster || []).find((entry) => entry.id === id)?.label) || ''

module.exports = { setChoices, setOption, setPrefix, setShape, entryLabel }
