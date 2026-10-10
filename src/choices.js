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

const slideshowChoices = (self) => {
	const list = self.state.slideshows.map((s) => ({
		id: `${s.overlayId}::${s.elementId}`,
		label: `${s.overlayName} / ${s.name}`,
	}))
	return list.length ? list : [{ id: '', label: '(no slideshows found)' }]
}

const findSlideshow = (self, value) => {
	const { overlay, page } = splitPage(value)
	return self.state.slideshows.find((s) => s.overlayId === overlay && s.elementId === page)
}

const overlayChoices = (self) => {
	const list = (self.state.overlayVisibility || []).map((o) => ({ id: o.key, label: o.label }))
	return list.length ? list : [{ id: '', label: '(no overlays found)' }]
}

module.exports = { overlayChoices, pageChoices, pagedOverlayChoices, splitPage, slideshowChoices, findSlideshow }
