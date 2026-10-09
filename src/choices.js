const pageChoices = (self) => {
	const list = []
	for (const o of Object.values(self.state.pages)) {
		for (const p of o.pages) list.push({ id: `${o.id}::${p.id}`, label: `${o.overlayName} / ${p.name}` })
	}
	return list.length ? list : [{ id: '', label: '(no multi-page overlays found)' }]
}

const pagedOverlayChoices = (self) => {
	const list = Object.values(self.state.pages).map((o) => ({ id: o.id, label: o.overlayName }))
	return list.length ? list : [{ id: '', label: '(no multi-page overlays found)' }]
}

const splitPage = (value) => {
	const [overlay, ...rest] = String(value || '').split('::')
	return { overlay, page: rest.join('::') }
}

module.exports = { pageChoices, pagedOverlayChoices, splitPage }
