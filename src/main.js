const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const UpdateActions = require('./actions')
const UpdateFeedbacks = require('./feedbacks')
const { defineVariables, updateVariables } = require('./variables')
const { StreamPulseApi } = require('./api')

class ModuleInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
		this.state = {
			status: null,
			timers: {},
			goals: [],
			rules: [],
			alerts: null,
			pages: {},
			slideshows: [],
			musicOverlayVisible: true,
			overlayVisibility: [],
		}
		this.tick = 0
	}

	async init(config) {
		this.config = config
		this.updateActions()
		this.updateFeedbacks()
		defineVariables(this)
		this.startPolling()
	}

	async destroy() {
		this.stopPolling()
	}

	async configUpdated(config) {
		this.config = config
		this.startPolling()
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
				label: 'Poll interval (ms)',
				width: 4,
				default: 1000,
				min: 500,
				max: 30000,
			},
		]
	}

	startPolling() {
		this.stopPolling()
		const host = (this.config.host || 'localhost').trim()
		const port = this.config.port || '3000'
		this.api = new StreamPulseApi(host, port)
		this.updateStatus(InstanceStatus.Connecting)
		this.tick = 0
		this.poll()
		this.pollTimer = setInterval(() => this.poll(), Math.max(500, Number(this.config.pollMs) || 1000))
	}

	stopPolling() {
		if (this.pollTimer) clearInterval(this.pollTimer)
		this.pollTimer = null
	}

	async poll() {
		if (this.polling) return
		this.polling = true
		try {
			// Alerts payload is large, so refresh it less often
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
			this.state.status = status
			this.state.timers = (timers && timers.timers) || {}
			this.state.goals = (goals && goals.items) || []
			if (alerts) {
				this.state.alerts = alerts.queue || null
				this.state.rules = alerts.rules || []
			}
			this.updateStatus(InstanceStatus.Ok)

			// Dropdown choices depend on live data, so rebuild them when ids or names change
			const sig = JSON.stringify([
				Object.values(this.state.timers).map((t) => [t.id, t.label]),
				this.state.goals.map((g) => [g.id, g.title]),
				this.state.rules.map((r) => [r.id, r.name]),
				this.state.slideshows.map((s) => [s.overlayId, s.elementId, s.name]),
				this.state.overlayVisibility.map((o) => [o.key, o.label]),
				Object.values(this.state.pages).map((p) => [p.id, p.overlayName, p.pages.map((x) => [x.id, x.name])]),
			])
			if (sig !== this.choiceSig) {
				this.choiceSig = sig
				this.updateActions()
				this.updateFeedbacks()
			}
			updateVariables(this)
			this.checkFeedbacks()
		} catch (err) {
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
}

runEntrypoint(ModuleInstance, UpgradeScripts)
