const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const UpdateActions = require('./actions')
const UpdateFeedbacks = require('./feedbacks')
const UpdatePresets = require('./presets')
const { defineVariables, updateVariables } = require('./variables')
const { StreamPulseApi } = require('./api')

class ModuleInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
		this.state = {
			online: false,
			status: null,
			timers: {},
			goals: [],
			rules: [],
			alerts: null,
			pages: {},
			slideshows: [],
			videos: [],
			cutouts: [],
			musicOverlayVisible: true,
			overlayVisibility: [],
		}
		this.tick = 0
		this.ws = null
		this.wsConnected = false
		this.wsReconnectTimer = null
	}

	async init(config) {
		this.config = config
		this.updateActions()
		this.updateFeedbacks()
		this.updatePresets()
		defineVariables(this)
		this.startPolling()
		this.startWebSocket()
	}

	async destroy() {
		this.destroyed = true
		this.stopWebSocket()
		this.stopPolling()
	}

	async configUpdated(config) {
		this.config = config
		this.startPolling()
		this.startWebSocket()
	}

	getConfigFields() {
		return [
			{
				type: 'textinput',
				id: 'host',
				label: 'StreamPulse host',
				width: 8,
				default: 'localhost',
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'Port',
				width: 4,
				default: '3000',
				regex: Regex.PORT,
			},
			{
				type: 'number',
				id: 'pollMs',
				label: 'Poll interval when offline (ms)',
				width: 4,
				default: 1500,
				min: 500,
				max: 30000,
			},
			{
				type: 'textinput',
				id: 'placeholders',
				label: 'Placeholders to expose (comma separated, e.g. chatter.top, latest.follower, game.name)',
				width: 12,
				default: '',
			},
		]
	}

	startWebSocket() {
		this.stopWebSocket()
		if (this.destroyed) return
		const host = (this.config.host || 'localhost').trim()
		const port = this.config.port || '3000'
		const url = `ws://${host}:${port}/`

		try {
			if (typeof WebSocket === 'undefined') return
			this.ws = new WebSocket(url)
			this.ws.onopen = () => {
				this.wsConnected = true
				this.log('debug', `Connected to StreamPulse WebSocket (${url})`)
				// Refresh immediately on connection to sync state
				this.poll()
			}
			this.ws.onmessage = (event) => {
				try {
					const msg = JSON.parse(event.data)
					this.handleWebSocketMessage(msg)
				} catch {
					/* ignore parse error */
				}
			}
			this.ws.onerror = () => {
				/* handled by onclose */
			}
			this.ws.onclose = () => {
				this.wsConnected = false
				this.ws = null
				if (!this.destroyed) {
					this.wsReconnectTimer = setTimeout(() => this.startWebSocket(), 5000)
				}
			}
		} catch {
			this.wsConnected = false
			this.ws = null
			if (!this.destroyed) {
				this.wsReconnectTimer = setTimeout(() => this.startWebSocket(), 5000)
			}
		}
	}

	stopWebSocket() {
		if (this.wsReconnectTimer) clearTimeout(this.wsReconnectTimer)
		this.wsReconnectTimer = null
		if (this.ws) {
			try {
				this.ws.close()
			} catch {}
			this.ws = null
		}
		this.wsConnected = false
	}

	handleWebSocketMessage(msg) {
		if (!msg || typeof msg !== 'object') return
		if (msg.type === 'timer-update' && msg.timer) {
			const t = msg.timer
			this.state.timers[t.id] = t
			updateVariables(this)
			this.checkFeedbacks('timer_state')
		} else if (msg.type === 'alert') {
			if (this.state.alerts) this.state.alerts.pending = (this.state.alerts.pending || 0) + 1
			updateVariables(this)
			this.checkFeedbacks('alert_queue_paused')
		} else if (msg.type === 'alert-skip' || msg.type === 'alert-clear') {
			if (this.state.alerts) this.state.alerts.pending = Math.max(0, (this.state.alerts.pending || 1) - 1)
			updateVariables(this)
			this.checkFeedbacks('alert_queue_paused')
		} else if (
			msg.type === 'custom-overlay-page' ||
			msg.type === 'custom-overlay-update' ||
			msg.type === 'custom-overlay-video' ||
			msg.type === 'custom-overlay-cutout'
		) {
			this.poll()
		} else if (msg.type === 'poll-update') {
			if (this.state.status) this.state.status.poll = msg.data
			updateVariables(this)
		} else if (msg.type === 'randomizer-spin') {
			const d = msg.data || msg.payload || msg
			this.state.randomizerLast = d
			this.state.randomizerSpinning = true
			this.checkFeedbacks('randomizer_spinning')
			updateVariables(this)
			const dur = Math.max(3, Number(d.duration) || 6)
			if (this.randomizerSpinTimer) clearTimeout(this.randomizerSpinTimer)
			this.randomizerSpinTimer = setTimeout(() => {
				this.state.randomizerSpinning = false
				this.checkFeedbacks('randomizer_spinning')
				updateVariables(this)
				this.refreshRandomizerPresets()
			}, dur * 1000)
		} else if (msg.type === 'randomizer-state') {
			// Resets, restores and manual removals from the Studio
			this.refreshRandomizerPresets()
		}
	}

	async refreshRandomizerPresets() {
		try {
			const rand = await this.api.randomizerPresets()
			this.state.randomizerPresets = (rand && rand.presets) || []
			updateVariables(this)
		} catch {
			/* next poll will retry */
		}
	}

	startPolling() {
		this.stopPolling()
		const host = (this.config.host || 'localhost').trim()
		const port = this.config.port || '3000'
		this.api = new StreamPulseApi(host, port)
		this.updateStatus(InstanceStatus.Connecting)
		this.tick = 0
		this.poll()
		// If WS is connected, poll less frequently as a background heartbeat; otherwise poll normally
		const interval = Math.max(500, Number(this.config.pollMs) || 1500)
		this.pollTimer = setInterval(() => {
			// When WebSocket is active, we only need a slow background sync
			if (this.wsConnected && this.tick % 5 !== 0) {
				this.tick++
				return
			}
			this.poll()
		}, interval)
	}

	stopPolling() {
		if (this.pollTimer) clearInterval(this.pollTimer)
		this.pollTimer = null
		if (this.randomizerSpinTimer) clearTimeout(this.randomizerSpinTimer)
		this.randomizerSpinTimer = null
	}

	async poll() {
		if (this.polling) return
		this.polling = true
		try {
			// Alerts and overlays payloads are larger, so refresh them less often
			const withAlerts = this.tick++ % 3 === 0
			const [status, timers, goals, alerts] = await Promise.all([
				this.api.status(),
				this.api.timers(),
				this.api.goals(),
				withAlerts ? this.api.alerts() : Promise.resolve(null),
			])
			if (withAlerts) this.overlayList = await this.api.overlays()
			const paged = (this.overlayList || []).filter((o) => o.pageCount > 1)
			const snaps = await Promise.all(paged.map((o) => this.api.overlayPage(o.id).catch(() => null)))
			const pages = {}
			paged.forEach((o, i) => {
				if (snaps[i]) pages[o.id] = { ...snaps[i], overlayName: o.name }
			})
			this.state.pages = pages
			const overlay = await this.api.musicOverlay().catch(() => null)
			if (overlay) this.state.musicOverlayVisible = overlay.visible !== false
			const vis = await this.api.overlayVisibility().catch(() => null)
			if (vis && vis.overlays) this.state.overlayVisibility = vis.overlays
			const shows = await this.api.slideshows().catch(() => null)
			this.state.slideshows = (shows && shows.slideshows) || []
			const vids = await this.api.videos().catch(() => null)
			this.state.videos = (vids && vids.videos) || []
			const cuts = await this.api.cutouts().catch(() => null)
			this.state.cutouts = (cuts && cuts.cutouts) || []
			// Optional extras: a failure here shouldn't mark the whole module as disconnected
			this.state.gamePlan = await this.api.gamePlan().catch(() => null)
			this.state.weather = await this.api.weather().catch(() => null)
			const mu = await this.api.matchup().catch(() => null)
			this.state.matchup = (mu && mu.matchup) || null
			const rand = await this.api.randomizerPresets().catch(() => null)
			this.state.randomizerPresets = (rand && rand.presets) || []
			const randomizerButtons = await this.api.randomizerButtonPresets().catch(() => null)
			this.state.randomizerButtonPresets = (randomizerButtons && randomizerButtons.presets) || []
			const wanted = String(this.config.placeholders || '')
				.split(',')
				.map((k) => k.trim())
				.filter(Boolean)
			this.state.placeholders = wanted.length ? await this.api.placeholders().catch(() => ({})) : {}
			this.state.wantedPlaceholders = wanted
			const bot = await this.api.chatbot().catch(() => null)
			if (bot) {
				const opts = [
					...(bot.commands || []).map((c) => ({ id: c.name, label: `Command: ${bot.settings.prefix}${c.name}` })),
					...(bot.triggers || []).map((t) => ({ id: t.name || t.id, label: `Trigger: ${t.name || t.id}` })),
					...(bot.messages || []).map((m) => ({ id: m.name || m.id, label: `Timed: ${m.name || m.id}` })),
					...['quote', 'addquote', 'delquote'].map((n) => ({ id: n, label: `Command: ${bot.settings.prefix}${n}` })),
				]
				this.state.chatChoices = opts
			}
			const chat = await this.api.chatActivity().catch(() => null)
			if (chat) {
				const s = this.state
				s.chatEnabled = chat.enabled
				s.chatHits = s.chatHits || {}
				const fresh = chat.activity.filter((a) => a.seq > (s.chatSeq === undefined ? chat.seq : s.chatSeq))
				s.chatSeq = chat.seq
				for (const a of fresh) {
					s.chatHits[a.name.toLowerCase()] = Date.now()
					s.chatLast = a
				}
				if (fresh.length) {
					this.checkFeedbacks('chat_command_used')
					setTimeout(() => this.checkFeedbacks('chat_command_used'), 10100)
				}
				this.checkFeedbacks('chat_bot_on')
			}
			this.state.status = status
			this.state.timers = (timers && timers.timers) || {}
			this.state.goals = (goals && goals.items) || []
			if (alerts) {
				this.state.alerts = alerts.queue || null
				this.state.rules = alerts.rules || []
			}
			this.state.online = true
			this.updateStatus(InstanceStatus.Ok)

			// Dropdown choices depend on live data, so rebuild them when ids or names change
			const sig = JSON.stringify([
				Object.values(this.state.timers).map((t) => [t.id, t.label]),
				this.state.goals.map((g) => [g.id, g.title]),
				this.state.rules.map((r) => [r.id, r.name]),
				this.state.slideshows.map((s) => [s.overlayId, s.elementId, s.name]),
				(this.state.videos || []).map((v) => [v.overlayId, v.elementId, v.name]),
				(this.state.cutouts || []).map((c) => [c.overlayId, c.elementId, c.name]),
				this.state.overlayVisibility.map((o) => [o.key, o.label]),
				(this.state.chatChoices || []).map((c) => c.id),
				Object.values(this.state.pages).map((p) => [p.id, p.overlayName, p.pages.map((x) => [x.id, x.name])]),
				(this.state.randomizerPresets || []).map((p) => [p.id, p.name]),
				(this.state.randomizerButtonPresets || []).map((p) => [p.id, p.name]),
			])
			if (sig !== this.choiceSig) {
				this.choiceSig = sig
				this.updateActions()
				this.updateFeedbacks()
				this.updatePresets()
			}
			updateVariables(this)
			this.checkFeedbacks(
				'server_online',
				'session_live',
				'session_phase',
				'timer_state',
				'goal_complete',
				'goal_enabled',
				'alert_queue_paused',
				'music_playing',
				'music_overlay_visible',
				'overlay_shown',
				'randomizer_spinning',
			)
		} catch (err) {
			this.state.online = false
			this.state.status = null
			this.setVariableValues({ streampulse_online: 'no', streampulse_uptime: '' })
			this.checkFeedbacks('server_online')
			this.updateStatus(InstanceStatus.ConnectionFailure, err.message)
		} finally {
			this.polling = false
		}
	}

	updateActions() {
		UpdateActions(this)
	}

	updateFeedbacks() {
		UpdateFeedbacks(this)
	}

	updatePresets() {
		UpdatePresets(this)
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
