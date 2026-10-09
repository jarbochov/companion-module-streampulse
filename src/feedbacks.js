const timerChoices = (self) => {
	const list = Object.values(self.state.timers).map((t) => ({ id: t.id, label: t.label || t.id }))
	return list.length ? list : [{ id: '', label: '(no timers found)' }]
}
const goalChoices = (self) => {
	const list = self.state.goals.map((g) => ({ id: g.id, label: g.title || g.id }))
	return list.length ? list : [{ id: '', label: '(no goals found)' }]
}

const GREEN = 0x00aa00
const RED = 0xcc0000
const AMBER = 0xcc8800
const WHITE = 0xffffff

const { pageChoices, pagedOverlayChoices, splitPage, slideshowChoices, findSlideshow } = require('./choices')

module.exports = async function (self) {
	self.setFeedbackDefinitions({
		timer_state: {
			name: 'Timer: state',
			type: 'boolean',
			description: 'True while the timer is in the chosen state',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [
				{
					id: 'timer',
					type: 'dropdown',
					label: 'Timer',
					choices: timerChoices(self),
					default: timerChoices(self)[0].id,
				},
				{
					id: 'state',
					type: 'dropdown',
					label: 'State',
					choices: [
						{ id: 'running', label: 'Running' },
						{ id: 'paused', label: 'Paused' },
						{ id: 'idle', label: 'Idle' },
						{ id: 'completed', label: 'Completed' },
					],
					default: 'running',
				},
			],
			callback: ({ options }) => {
				const t = self.state.timers[options.timer]
				return !!t && t.state === options.state
			},
		},
		session_live: {
			name: 'Stream: live on Twitch',
			type: 'boolean',
			defaultStyle: { bgcolor: RED, color: WHITE },
			options: [],
			callback: () => !!(self.state.status && self.state.status.viewers && self.state.status.viewers.live),
		},
		session_phase: {
			name: 'Session: phase',
			type: 'boolean',
			defaultStyle: { bgcolor: AMBER, color: WHITE },
			options: [
				{
					id: 'phase',
					type: 'dropdown',
					label: 'Phase',
					choices: [
						{ id: 'waiting', label: 'Waiting for stream' },
						{ id: 'active', label: 'Active' },
						{ id: 'ended', label: 'Ended' },
					],
					default: 'active',
				},
			],
			callback: ({ options }) => !!self.state.status && self.state.status.sessionPhase === options.phase,
		},
		goal_complete: {
			name: 'Goal: complete',
			type: 'boolean',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [
				{ id: 'goal', type: 'dropdown', label: 'Goal', choices: goalChoices(self), default: goalChoices(self)[0].id },
			],
			callback: ({ options }) => {
				const g = self.state.goals.find((x) => x.id === options.goal)
				return !!g && !!g.complete
			},
		},
		goal_enabled: {
			name: 'Goal: enabled',
			type: 'boolean',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [
				{ id: 'goal', type: 'dropdown', label: 'Goal', choices: goalChoices(self), default: goalChoices(self)[0].id },
			],
			callback: ({ options }) => {
				const g = self.state.goals.find((x) => x.id === options.goal)
				return !!g && g.enabled !== false
			},
		},
		page_enabled: {
			name: 'Overlay page: enabled',
			type: 'boolean',
			description: 'True while the page is enabled in the rotation',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [
				{ id: 'page', type: 'dropdown', label: 'Page', choices: pageChoices(self), default: pageChoices(self)[0].id },
			],
			callback: ({ options }) => {
				const { overlay, page } = splitPage(options.page)
				const p = self.state.pages[overlay]?.pages.find((x) => x.id === page)
				return !!p && p.enabled !== false
			},
		},
		page_current: {
			name: 'Overlay page: currently showing',
			type: 'boolean',
			defaultStyle: { bgcolor: RED, color: WHITE },
			options: [
				{ id: 'page', type: 'dropdown', label: 'Page', choices: pageChoices(self), default: pageChoices(self)[0].id },
			],
			callback: ({ options }) => {
				const { overlay, page } = splitPage(options.page)
				return self.state.pages[overlay]?.page === page
			},
		},
		page_auto: {
			name: 'Overlay page: auto-advance on',
			type: 'boolean',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [
				{
					id: 'overlay',
					type: 'dropdown',
					label: 'Overlay',
					choices: pagedOverlayChoices(self),
					default: pagedOverlayChoices(self)[0].id,
				},
			],
			callback: ({ options }) => !!self.state.pages[options.overlay]?.auto,
		},
		slideshow_playing: {
			name: 'Slideshow: playing',
			type: 'boolean',
			description: 'True while the slideshow is auto-advancing. Needs the overlay open in OBS or a browser.',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [
				{
					id: 'show',
					type: 'dropdown',
					label: 'Slideshow',
					choices: slideshowChoices(self),
					default: slideshowChoices(self)[0].id,
				},
			],
			callback: ({ options }) => {
				const s = findSlideshow(self, options.show)
				return !!s && s.live && !s.paused
			},
		},
		slideshow_paused: {
			name: 'Slideshow: paused',
			type: 'boolean',
			defaultStyle: { bgcolor: AMBER, color: WHITE },
			options: [
				{
					id: 'show',
					type: 'dropdown',
					label: 'Slideshow',
					choices: slideshowChoices(self),
					default: slideshowChoices(self)[0].id,
				},
			],
			callback: ({ options }) => {
				const s = findSlideshow(self, options.show)
				return !!s && s.live && !!s.paused
			},
		},
		slideshow_live: {
			name: 'Slideshow: overlay is open',
			type: 'boolean',
			description: 'True when an overlay page showing this slideshow is connected',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [
				{
					id: 'show',
					type: 'dropdown',
					label: 'Slideshow',
					choices: slideshowChoices(self),
					default: slideshowChoices(self)[0].id,
				},
			],
			callback: ({ options }) => !!findSlideshow(self, options.show)?.live,
		},
		alerts_paused: {
			name: 'Alerts: queue paused',
			type: 'boolean',
			defaultStyle: { bgcolor: AMBER, color: WHITE },
			options: [],
			callback: () => !!(self.state.alerts && self.state.alerts.paused),
		},
		music_playing: {
			name: 'Music: playing',
			type: 'boolean',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [],
			callback: () => !!(self.state.status && self.state.status.music && self.state.status.music.state === 'playing'),
		},
	})
}
