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

const mediaChoices = (items, emptyLabel, name = (item) => item.name) => {
	const list = items.map((item) => ({
		id: `${item.overlayId}::${item.elementId}`,
		label: `${item.overlayName} / ${name(item)}`,
	}))
	return list.length ? list : [{ id: '', label: emptyLabel }]
}

const slideshowChoices = (self) => mediaChoices(self.state.slideshows, '(no slideshows found)')

const findSlideshow = (self, value) => {
	const { overlay, page } = splitPage(value)
	return self.state.slideshows.find((s) => s.overlayId === overlay && s.elementId === page)
}

const videoChoices = (self) => mediaChoices(self.state.videos || [], '(no videos found)')

const findVideo = (self, value) => {
	const { overlay, page } = splitPage(value)
	return (self.state.videos || []).find((v) => v.overlayId === overlay && v.elementId === page)
}

const cutoutChoices = (self) =>
	mediaChoices(self.state.cutouts || [], '(no cutouts found)', (cutout) => `${cutout.name} (${cutout.shape})`)

const findCutout = (self, value) => {
	const { overlay, page } = splitPage(value)
	return (self.state.cutouts || []).find((c) => c.overlayId === overlay && c.elementId === page)
}

const overlayChoices = (self) => {
	const list = (self.state.overlayVisibility || []).map((o) => ({ id: o.key, label: o.label }))
	return list.length ? list : [{ id: '', label: '(no overlays found)' }]
}

module.exports = {
	overlayChoices,
	pageChoices,
	pagedOverlayChoices,
	splitPage,
	slideshowChoices,
	findSlideshow,
	videoChoices,
	findVideo,
	cutoutChoices,
	findCutout,
}
