class StreamPulseApi {
	constructor(host, port) {
		this.base = `http://${host}:${port}`
	}

	async request(path, { method = 'GET', body } = {}) {
		const res = await fetch(this.base + path, {
			method,
			headers: body ? { 'Content-Type': 'application/json' } : undefined,
			body: body ? JSON.stringify(body) : undefined,
			signal: AbortSignal.timeout(4000),
		})
		const text = await res.text()
		let data = null
		try {
			data = text ? JSON.parse(text) : null
		} catch {
			data = null
		}
		if (!res.ok) throw new Error((data && data.error) || `HTTP ${res.status}`)
		return data
	}

	status() {
		return this.request('/api/status')
	}
	timers() {
		return this.request('/api/timers')
	}
	goals() {
		return this.request('/api/goals')
	}
	alerts() {
		return this.request('/api/alerts')
	}

	overlays() {
		return this.request('/api/custom-overlays')
	}
	overlayPage(id) {
		return this.request(`/api/custom-overlays/${encodeURIComponent(id)}/page`)
	}
	pageAction(id, action, extra = {}) {
		return this.request(`/api/custom-overlays/${encodeURIComponent(id)}/page`, {
			method: 'POST',
			body: { action, ...extra },
		})
	}

	slideshows() {
		return this.request('/api/slideshows')
	}
	slideshowControl(overlayId, element, action) {
		return this.request(`/api/custom-overlays/${encodeURIComponent(overlayId)}/slideshow`, {
			method: 'POST',
			body: { action, element },
		})
	}

	musicOverlay() {
		return this.request('/api/music/overlay')
	}
	musicOverlayAction(action) {
		return this.request('/api/music/overlay', { method: 'POST', body: { action } })
	}
	startSession() {
		return this.request('/api/start-session', { method: 'POST' })
	}
	pinLastHighlight() {
		return this.request('/api/highlights/pin-last', { method: 'POST' })
	}
	replayAlert(alertId) {
		return this.request('/api/alerts/replay', { method: 'POST', body: { alertId } })
	}
	markClip(reason) {
		return this.request('/api/clip-candidates', { method: 'POST', body: { reason } })
	}

	timerControl(id, action, params = {}) {
		return this.request(`/api/timers/${encodeURIComponent(id)}/control`, {
			method: 'POST',
			body: { action, ...params },
		})
	}
	goalAction(id, action) {
		return this.request(`/api/goals/${encodeURIComponent(id)}/${action}`, { method: 'POST' })
	}
	alertQueue(action) {
		return this.request('/api/alerts/queue', { method: 'POST', body: { action } })
	}
	alertTest(ruleId) {
		return this.request('/api/alerts/test', { method: 'POST', body: { ruleId } })
	}
	endSession() {
		return this.request('/api/end-session', { method: 'POST' })
	}
}

module.exports = { StreamPulseApi }
