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
	gamePlan() {
		return this.request('/api/game-plan')
	}
	weather() {
		return this.request('/api/weather')
	}

	overlays() {
		return this.request('/api/custom-overlays')
	}
	speakers(overlayId) {
		return this.request(`/api/custom-overlays/${encodeURIComponent(overlayId)}/speakers`)
	}
	updateSpeaker(overlayId, elementId, patch = {}) {
		return this.request(`/api/custom-overlays/${encodeURIComponent(overlayId)}/speakers`, {
			method: 'PATCH',
			body: { ...patch, element: elementId },
		})
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

	videos() {
		return this.request('/api/videos')
	}
	videoControl(overlayId, element, action) {
		return this.request(`/api/custom-overlays/${encodeURIComponent(overlayId)}/video`, {
			method: 'POST',
			body: { action, element },
		})
	}

	cutouts() {
		return this.request('/api/cutouts')
	}
	cutoutControl(overlayId, element, action) {
		return this.request(`/api/custom-overlays/${encodeURIComponent(overlayId)}/cutout`, {
			method: 'POST',
			body: { action, element },
		})
	}

	overlayVisibility() {
		return this.request('/api/overlay-visibility')
	}
	overlayVisibilityAction(key, action) {
		return this.request(`/api/overlay-visibility/${encodeURIComponent(key)}`, { method: 'POST', body: { action } })
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
	alertMute(muted) {
		return this.request('/api/alerts/mute', { method: 'POST', body: { muted } })
	}

	alertTrigger(rule, message) {
		return this.request('/api/alerts/trigger', { method: 'POST', body: { rule, message: message || undefined } })
	}
	alertTest(ruleId) {
		return this.request('/api/alerts/test', { method: 'POST', body: { ruleId } })
	}
	chatbot() {
		return this.request('/api/chatbot')
	}
	chatActivity() {
		return this.request('/api/chatbot/activity')
	}
	chatEnabled(body) {
		return this.request('/api/chatbot/enabled', { method: 'POST', body })
	}
	chatSend(text) {
		return this.request('/api/chatbot/send', { method: 'POST', body: { text } })
	}
	chatRun(command, arg = '', user = 'StreamDeck') {
		return this.request('/api/chatbot/run', { method: 'POST', body: { command, arg, user } })
	}
	chatQuote(id = '') {
		return this.request('/api/chatbot/run', {
			method: 'POST',
			body: { command: 'quote', arg: id ? String(id) : '', user: 'StreamDeck' },
		})
	}
	placeholders() {
		return this.request('/api/chatbot/placeholders')
	}
	variable(name, action, body = {}) {
		const base = `/api/variables/${encodeURIComponent(name)}`
		return this.request(action === 'set' ? base : `${base}/${action}`, {
			method: action === 'set' ? 'PUT' : 'POST',
			body,
		})
	}
	resetSession() {
		return this.request('/api/reset')
	}
	alertTestEvent(trigger, params = {}) {
		return this.request('/api/alerts/test-event', { method: 'POST', body: { trigger, ...params } })
	}
	variableRoll(name) {
		return this.request(`/api/variables/${encodeURIComponent(name)}/roll`, { method: 'POST' })
	}
	restartServer() {
		return this.request('/api/restart', { method: 'POST' })
	}
	stopServer() {
		return this.request('/api/shutdown', { method: 'POST' })
	}
	endSession() {
		return this.request('/api/end-session', { method: 'POST' })
	}
	randomizerSpin(options = {}) {
		return this.request('/api/randomizer/spin', { method: 'POST', body: options })
	}
	randomizerPresets() {
		return this.request('/api/randomizer/presets')
	}
	randomizerRestore(presetId) {
		return this.request(`/api/randomizer/presets/${encodeURIComponent(presetId)}/reset-eliminated`, { method: 'POST' })
	}
	matchup() {
		return this.request('/api/matchup')
	}
	matchupPresets() {
		return this.request('/api/matchup/presets')
	}
	matchupPost(path, body = {}) {
		return this.request(`/api/matchup${path}`, { method: 'POST', body })
	}
	pollActive() {
		return this.request('/api/polls/active')
	}
	pollPresets() {
		return this.request('/api/polls/presets')
	}
	pollCreate(body = {}) {
		return this.request('/api/polls/create', { method: 'POST', body })
	}
	pollEnd() {
		return this.request('/api/polls/end', { method: 'POST' })
	}
	pollCancel() {
		return this.request('/api/polls/cancel', { method: 'POST' })
	}
	pollExtend(seconds = 30) {
		return this.request('/api/polls/extend', { method: 'POST', body: { seconds } })
	}
	tournament(isPoll = false) {
		return this.request(isPoll ? '/api/polls/tournament' : '/api/tournament')
	}
	tournamentPresets(isPoll = false) {
		return this.request(isPoll ? '/api/polls/tournament/presets' : '/api/tournament/presets')
	}
	tournamentPost(path, body = {}, isPoll = false) {
		return this.request(`${isPoll ? '/api/polls/tournament' : '/api/tournament'}${path}`, { method: 'POST', body })
	}
	randomizerButtonPresets() {
		return this.request('/api/randomizer/button-presets')
	}
	alertTestWebhook(url, method = 'POST') {
		return this.request('/api/alerts/test-webhook', { method: 'POST', body: { url, method } })
	}
	tierList() {
		return this.request('/api/tier-list')
	}
	tierListPresets() {
		return this.request('/api/tier-list/presets')
	}
	tierListStartVote(params = {}) {
		return this.request('/api/tier-list/vote/start', { method: 'POST', body: params })
	}
	tierListLockVote() {
		return this.request('/api/tier-list/vote/lock', { method: 'POST' })
	}
	tierListEndVote(applyConsensus = true) {
		return this.request('/api/tier-list/vote/end', { method: 'POST', body: { applyConsensus } })
	}
	tierListCancelVote() {
		return this.request('/api/tier-list/vote/cancel', { method: 'POST' })
	}
	tierListReset() {
		return this.request('/api/tier-list/reset', { method: 'POST' })
	}
	tierListLoadPreset(presetId) {
		return this.request(`/api/tier-list/presets/${encodeURIComponent(presetId)}/load`, { method: 'POST' })
	}
	trivia() {
		return this.request('/api/trivia')
	}
	triviaPresets() {
		return this.request('/api/trivia/presets')
	}
	triviaStart(body = {}) {
		return this.request('/api/trivia/start', { method: 'POST', body })
	}
	triviaReveal() {
		return this.request('/api/trivia/reveal', { method: 'POST' })
	}
	triviaNext() {
		return this.request('/api/trivia/next', { method: 'POST' })
	}
	triviaPrev() {
		return this.request('/api/trivia/prev', { method: 'POST' })
	}
	triviaReset() {
		return this.request('/api/trivia/reset', { method: 'POST' })
	}
	triviaResetDone() {
		return this.request('/api/trivia/questions/reset-done', { method: 'POST' })
	}
	triviaShuffle() {
		return this.request('/api/trivia/questions/shuffle', { method: 'POST' })
	}
	triviaLoadPreset(presetId) {
		return this.request(`/api/trivia/presets/${encodeURIComponent(presetId)}/load`, { method: 'POST' })
	}
	triviaVote(choice, user = 'StreamDeck') {
		return this.request('/api/trivia/vote', { method: 'POST', body: { choice, user } })
	}
}

const obsConnectionStatus = (obs) => {
	if (!obs) return 'unavailable'
	if (obs.enabled === false) return 'disabled'
	if (obs.connected) return 'connected'
	if (obs.connecting) return 'connecting'
	return obs.lastError ? 'error' : 'disconnected'
}

module.exports = { StreamPulseApi, obsConnectionStatus }
