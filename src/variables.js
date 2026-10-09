const slug = (id) => String(id).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')

const STATIC_VARS = {
	session_phase: 'Session phase (waiting / active / ended)',
	live: 'Twitch live (yes / no)',
	viewers: 'Current viewers',
	viewers_peak: 'Peak viewers',
	stream_title: 'Stream title',
	stream_category: 'Stream category',
	track: 'Music track',
	artist: 'Music artist',
	album: 'Music album',
	music_state: 'Music state',
	alerts_pending: 'Alerts waiting in queue',
	alerts_paused: 'Alert queue paused (yes / no)',
	ssn_connected: 'SocialStream connected (yes / no)',
}

function defineVariables(self) {
	const defs = {}
	for (const [id, name] of Object.entries(STATIC_VARS)) defs[id] = { name }
	for (const t of Object.values(self.state.timers)) {
		const s = slug(t.id)
		defs[`timer_${s}_remaining`] = { name: `Timer ${t.label || t.id}: time` }
		defs[`timer_${s}_state`] = { name: `Timer ${t.label || t.id}: state` }
	}
	for (const g of self.state.goals) {
		const s = slug(g.id)
		defs[`goal_${s}_percent`] = { name: `Goal ${g.title || g.id}: percent` }
		defs[`goal_${s}_progress`] = { name: `Goal ${g.title || g.id}: progress / target` }
	}
	self.setVariableDefinitions(defs)
	self.variableKeys = Object.keys(defs).join(',')
}

function updateVariables(self) {
	const { status: st, timers, goals, alerts } = self.state
	const values = {}
	const yn = (v) => (v ? 'yes' : 'no')
	if (st) {
		values.session_phase = st.sessionPhase || ''
		values.live = yn(st.viewers && st.viewers.live)
		values.viewers = (st.viewers && st.viewers.current) || 0
		values.viewers_peak = (st.viewers && st.viewers.peak) || 0
		values.stream_title = (st.stream && st.stream.title) || ''
		values.stream_category = (st.stream && st.stream.category && st.stream.category.name) || ''
		values.track = (st.music && st.music.track) || ''
		values.artist = (st.music && st.music.artist) || ''
		values.album = (st.music && st.music.album) || ''
		values.music_state = (st.music && st.music.state) || ''
		values.ssn_connected = yn(st.ssn && st.ssn.connected)
	}
	values.alerts_pending = alerts ? alerts.pending : 0
	values.alerts_paused = yn(alerts && alerts.paused)
	for (const t of Object.values(timers)) {
		const s = slug(t.id)
		values[`timer_${s}_remaining`] = t.formattedRemaining || ''
		values[`timer_${s}_state`] = t.state || ''
	}
	for (const g of goals) {
		const s = slug(g.id)
		values[`goal_${s}_percent`] = `${g.percent || 0}%`
		values[`goal_${s}_progress`] = `${g.progress || 0}/${g.target || 0}`
	}

	// Timers and goals can be added or removed at runtime
	const keys = Object.keys(values).sort().join(',')
	if (keys !== self.valueKeys) {
		self.valueKeys = keys
		defineVariables(self)
	}
	self.setVariableValues(values)
}

module.exports = { defineVariables, updateVariables, slug }
