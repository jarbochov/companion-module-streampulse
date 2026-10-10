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
	twitch_connected: 'Twitch connected (yes / no)',
	music_overlay: 'Music overlay (visible / hidden)',
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
	latest_bits_amount: 'Latest cheer amount',
	latest_donation_amount: 'Latest donation amount',
	latest_raid_viewers: 'Latest raid viewer count',
	hashtag_top: 'Top hashtag overall',
	hashtag_session_top: 'Top hashtag this session',
	game_developer: 'Game developer (IGDB)',
	game_rating: 'Game rating (IGDB)',
	clip_candidates: 'Clip candidates waiting',
	session_followers: 'New followers this session (Twitch)',
	session_subscribers: 'New subscribers this session (Twitch)',
	session_gift_subs: 'Gift subs this session',
	session_bits: 'Bits this session',
	session_donations: 'Donations this session',
	total_followers: 'Followers (current total)',
	total_subscribers: 'Subscribers (current total)',
	total_gift_subs: 'Gift subs (lifetime)',
	total_bits: 'Bits (lifetime)',
	total_donations: 'Donations (lifetime)',
	plan_now: 'Game Plan: playing now',
	plan_next: 'Game Plan: next scheduled game',
	plan_scheduled_count: 'Game Plan: scheduled games',
	plan_backlog_count: 'Game Plan: backlog games',
	weather_temp: 'Weather: temperature with unit',
	weather_condition: 'Weather: condition',
	weather_icon: 'Weather: icon (emoji)',
	weather_feels_like: 'Weather: feels like',
	weather_high_low: 'Weather: today high / low',
	weather_precip: 'Weather: chance of precipitation (percent)',
	weather_humidity: 'Weather: humidity (percent)',
	weather_wind: 'Weather: wind with unit and direction',
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
		values.twitch_connected = yn(st.twitch && st.twitch.hasToken)
		values.music_overlay = self.state.musicOverlayVisible === false ? 'hidden' : 'visible'
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
		const detail = (type) => (events.find((e) => e.type === type) || {}).detail || ''
		values.latest_bits_amount = detail('bits')
		values.latest_donation_amount = detail('donation')
		values.latest_raid_viewers = (detail('raid').match(/\d+/) || [''])[0]
		const pop = st.popularHashtags || {}
		values.hashtag_top = (pop.overall && pop.overall[0] && pop.overall[0].tag) || ''
		values.hashtag_session_top = (pop.session && pop.session[0] && pop.session[0].tag) || ''
		values.game_developer = (Array.isArray(game.developers) && game.developers[0]) || ''
		values.game_rating = game.rating || ''
		values.clip_candidates = (st.library && st.library.clipCandidates) || 0
		const gm = st.goalMetrics || {}
		const ses = gm.session || {}
		const per = gm.persistent || {}
		values.session_followers = ses.followers || 0
		values.session_subscribers = ses.subscribers || 0
		values.session_gift_subs = ses.gift_subs || 0
		values.session_bits = ses.bits || 0
		values.session_donations = ses.donations || 0
		values.total_followers = per.followers || 0
		values.total_subscribers = per.subscribers || 0
		values.total_gift_subs = per.gift_subs || 0
		values.total_bits = per.bits || 0
		values.total_donations = per.donations || 0
	}
	const plan = (self.state.gamePlan && self.state.gamePlan.items) || []
	values.plan_now = (plan.find((g) => g.playingNow) || {}).name || ''
	values.plan_next = (plan.find((g) => g.status === 'scheduled' && !g.playingNow) || {}).name || ''
	values.plan_scheduled_count = plan.filter((g) => g.status === 'scheduled').length
	values.plan_backlog_count = plan.filter((g) => g.status === 'backlog').length
	const w = self.state.weather
	const wx = w && w.enabled && w.ok ? w : null
	values.weather_temp = wx ? `${wx.temp}${wx.unit || ''}` : ''
	values.weather_condition = wx ? wx.condition || '' : ''
	values.weather_icon = wx ? wx.icon || '' : ''
	values.weather_feels_like = wx ? `${wx.feels_like}${wx.unit || ''}` : ''
	values.weather_high_low = wx ? `${wx.high}${wx.unit || ''} / ${wx.low}${wx.unit || ''}` : ''
	values.weather_precip = wx ? wx.precip_chance ?? '' : ''
	values.weather_humidity = wx ? wx.humidity ?? '' : ''
	values.weather_wind = wx ? `${wx.wind} ${wx.wind_unit || ''} ${wx.wind_dir || ''}`.trim() : ''
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
