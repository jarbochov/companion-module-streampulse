const slug = (id) =>
	String(id)
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '')

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
	viewers_average: 'Average viewers this session',
	stream_uptime: 'Time since the stream went live (H:MM:SS)',
	category_session_minutes: 'Minutes in this category this session',
	category_total_minutes: 'Total minutes in this category',
	game_name: 'Game name (IGDB)',
	game_year: 'Game release year (IGDB)',
	game_genres: 'Game genres (IGDB)',
	music_position: 'Music position (M:SS)',
	music_duration: 'Music length (M:SS)',
	music_remaining: 'Music time remaining (M:SS)',
	music_percent: 'Music progress (percent)',
	chat_messages: 'Chat messages this session',
	chat_chatters: 'Unique chatters this session',
	chat_emotes: 'Emotes used this session',
	chat_hashtags: 'Hashtags used this session',
	chat_raids: 'Raids this session',
	chat_followers: 'New followers this session',
	chat_subscribers: 'New subscribers this session',
	top_chatter: 'Top chatter this session',
	top_chatter_messages: 'Top chatter message count',
	latest_event: 'Latest event (user and type)',
	latest_follow: 'Latest follower',
	latest_sub: 'Latest subscriber',
	latest_gift: 'Latest gifter',
	latest_bits: 'Latest cheer (user)',
	latest_donation: 'Latest donation (user)',
	latest_raid: 'Latest raider',
	timers_running: 'Timers currently running',
	goals_total: 'Goals configured',
	goals_completed: 'Goals completed',
	session_started: 'Session start time',
	highlights_count: 'Saved highlights',
	sessions_count: 'Archived sessions',
}

const mss = (sec) => {
	const s = Math.max(0, Math.round(Number(sec) || 0))
	return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
const hms = (ms) => {
	const s = Math.max(0, Math.floor(ms / 1000))
	return `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
const clockTime = (iso) => (iso ? new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '')

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
	for (const o of Object.values(self.state.pages)) {
		const s = slug(o.id)
		defs[`overlay_${s}_page`] = { name: `Overlay ${o.overlayName}: current page` }
		defs[`overlay_${s}_page_number`] = { name: `Overlay ${o.overlayName}: current page number` }
	}
	for (const sh of self.state.slideshows) {
		const s = slug(`${sh.overlayId}_${sh.elementId}`)
		defs[`slideshow_${s}_position`] = { name: `Slideshow ${sh.name}: slide (position/count)` }
		defs[`slideshow_${s}_state`] = { name: `Slideshow ${sh.name}: state (playing / paused / offline)` }
	}
	self.setVariableDefinitions(Object.entries(defs).map(([variableId, def]) => ({ variableId, name: def.name })))
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
		const v = st.viewers || {}
		const cat = (st.stream && st.stream.category) || {}
		const game = (st.stream && st.stream.game) || {}
		const m = st.music || {}
		const ssn = st.ssn || {}
		values.viewers_average = Math.round(v.average || 0)
		values.stream_uptime = v.live && st.streamStartedAt ? hms(Date.now() - Date.parse(st.streamStartedAt)) : ''
		values.category_session_minutes = cat.sessionMinutes || 0
		values.category_total_minutes = cat.totalMinutes || 0
		values.game_name = game.igdbName || game.name || ''
		values.game_year = game.releaseYear || ''
		values.game_genres = Array.isArray(game.genres) ? game.genres.join(', ') : ''
		values.music_position = mss(m.position)
		values.music_duration = mss(m.duration)
		values.music_remaining = mss((m.duration || 0) - (m.position || 0))
		values.music_percent = m.duration ? Math.min(100, Math.round(((m.position || 0) / m.duration) * 100)) : 0
		values.chat_messages = ssn.messages || 0
		values.chat_chatters = ssn.chatters || 0
		values.chat_emotes = ssn.emotes || 0
		values.chat_hashtags = ssn.hashtags || 0
		values.chat_raids = ssn.raids || 0
		values.chat_followers = ssn.followers || 0
		values.chat_subscribers = ssn.subscribers || 0
		const top = (st.topChatters || [])[0]
		values.top_chatter = top ? top.chatname : ''
		values.top_chatter_messages = top ? top.messageCount : 0
		const events = st.recentEvents || []
		const latest = (type) => (events.find((e) => e.type === type) || {}).user || ''
		values.latest_event = events[0] ? `${events[0].user} (${events[0].type})` : ''
		values.latest_follow = latest('follow')
		values.latest_sub = latest('sub')
		values.latest_gift = latest('gift')
		values.latest_bits = latest('bits')
		values.latest_donation = latest('donation')
		values.latest_raid = latest('raid')
		values.timers_running = (st.timers && st.timers.running) || 0
		values.goals_total = (st.goals && st.goals.total) || 0
		values.goals_completed = (st.goals && st.goals.completed) || 0
		values.session_started = clockTime(st.startedAt)
		values.highlights_count = (st.library && st.library.highlights) || 0
		values.sessions_count = (st.library && st.library.sessions) || 0
	}
	for (const sh of self.state.slideshows) {
		const s = slug(`${sh.overlayId}_${sh.elementId}`)
		values[`slideshow_${s}_position`] = sh.live ? `${sh.position}/${sh.count}` : ''
		values[`slideshow_${s}_state`] = !sh.live ? 'offline' : sh.paused ? 'paused' : 'playing'
	}
	values.alerts_pending = alerts ? alerts.pending : 0
	values.alerts_paused = yn(alerts && alerts.paused)
	for (const t of Object.values(timers)) {
		const s = slug(t.id)
		values[`timer_${s}_remaining`] = t.formattedRemaining || ''
		values[`timer_${s}_state`] = t.state || ''
	}
	for (const o of Object.values(self.state.pages)) {
		const s = slug(o.id)
		values[`overlay_${s}_page`] = o.name || ''
		values[`overlay_${s}_page_number`] = `${o.index + 1}/${o.count}`
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
