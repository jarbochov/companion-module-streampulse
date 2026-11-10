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
const BLUE = 0x1a73e8
const WHITE = 0xffffff
const { obsConnectionStatus } = require('./api')
const {
	PROFILE_FIELDS,
	VISIBILITY_FIELDS,
	speakerChoices,
	findSpeaker,
	speakerFieldValue,
	speakerFieldVisible,
} = require('./speakers')

const {
	overlayChoices,
	pageChoices,
	pagedOverlayChoices,
	splitPage,
	slideshowChoices,
	findSlideshow,
} = require('./choices')

module.exports = async function (self) {
	self.setFeedbackDefinitions({
		obs_connected: {
			name: 'OBS: connected',
			type: 'boolean',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [],
			callback: () => self.state.online !== false && !!self.state.status?.obs?.connected,
		},
		obs_connecting: {
			name: 'OBS: connecting',
			type: 'boolean',
			defaultStyle: { bgcolor: AMBER, color: WHITE },
			options: [],
			callback: () => self.state.online !== false && !!self.state.status?.obs?.connecting,
		},
		obs_status: {
			name: 'OBS: connection status',
			type: 'boolean',
			defaultStyle: { bgcolor: AMBER, color: WHITE },
			options: [
				{
					id: 'status',
					type: 'dropdown',
					label: 'Status',
					choices: ['connected', 'connecting', 'disconnected', 'disabled', 'error', 'unavailable'].map((status) => ({
						id: status,
						label: status[0].toUpperCase() + status.slice(1),
					})),
					default: 'connected',
				},
			],
			callback: ({ options }) =>
				obsConnectionStatus(self.state.online === false ? null : self.state.status?.obs) === options.status,
		},
		obs_scene_sync: {
			name: 'OBS: Scene Sync enabled',
			type: 'boolean',
			description: 'Scene Sync is optional; speaker badges can use OBS audio without it.',
			defaultStyle: { bgcolor: BLUE, color: WHITE },
			options: [{ id: 'enabled', type: 'checkbox', label: 'Enabled', default: true }],
			callback: ({ options }) => {
				const obs = self.state.status?.obs
				return self.state.online !== false && !!obs && obs.sceneSyncEnabled === options.enabled
			},
		},
		speaker_visibility: {
			name: 'Speaker Badge: detail visible / enabled',
			type: 'boolean',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [
				{
					id: 'speaker',
					type: 'dropdown',
					label: 'Speaker badge',
					choices: speakerChoices(self),
					default: speakerChoices(self)[0].id,
				},
				{ id: 'field', type: 'dropdown', label: 'Detail', choices: VISIBILITY_FIELDS, default: 'showAvatar' },
			],
			callback: ({ options }) => {
				const entry = findSpeaker(self, options.speaker)
				return (
					!!entry &&
					VISIBILITY_FIELDS.some((field) => field.id === options.field) &&
					speakerFieldVisible(entry, options.field)
				)
			},
		},
		speaker_identity: {
			name: 'Speaker Badge: profile field matches',
			type: 'boolean',
			defaultStyle: { bgcolor: BLUE, color: WHITE },
			options: [
				{
					id: 'speaker',
					type: 'dropdown',
					label: 'Speaker badge',
					choices: speakerChoices(self),
					default: speakerChoices(self)[0].id,
				},
				{ id: 'field', type: 'dropdown', label: 'Profile field', choices: PROFILE_FIELDS, default: 'name' },
				{ id: 'value', type: 'textinput', label: 'Exact value', default: '' },
			],
			callback: ({ options }) => {
				const entry = findSpeaker(self, options.speaker)
				return (
					!!entry &&
					PROFILE_FIELDS.some((field) => field.id === options.field) &&
					String(speakerFieldValue(entry, options.field) ?? '') === String(options.value ?? '')
				)
			},
		},
		chat_command_used: {
			name: 'Chat bot: command or trigger just used',
			type: 'boolean',
			description:
				'True for a few seconds after the command (name without the prefix, e.g. lurk) or trigger is used in chat',
			defaultStyle: { bgcolor: AMBER, color: WHITE },
			options: [
				{
					id: 'name',
					type: 'dropdown',
					label: 'Command, trigger or timed message',
					default: '',
					allowCustom: true,
					choices:
						self.state.chatChoices && self.state.chatChoices.length
							? self.state.chatChoices
							: [{ id: '', label: '(none found)' }],
				},
				{ id: 'seconds', type: 'number', label: 'Stay lit (seconds)', default: 5, min: 1, max: 10 },
			],
			callback: (f) => {
				const at = (self.state.chatHits || {})[String(f.options.name).trim().replace(/^!/, '').toLowerCase()]
				return !!at && Date.now() - at < f.options.seconds * 1000
			},
		},
		chat_bot_on: {
			name: 'Chat bot: enabled',
			type: 'boolean',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [],
			callback: () => !!self.state.chatEnabled,
		},
		server_online: {
			name: 'StreamPulse: server running',
			type: 'boolean',
			description:
				'True while StreamPulse answers on the configured host and port (use Invert to show when it is down)',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [],
			callback: () => !!self.state.online,
		},
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
		overlay_shown: {
			name: 'Overlay: shown',
			type: 'boolean',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [
				{
					id: 'overlay',
					type: 'dropdown',
					label: 'Overlay',
					choices: overlayChoices(self),
					default: overlayChoices(self)[0].id,
				},
			],
			callback: ({ options }) => {
				const o = (self.state.overlayVisibility || []).find((x) => x.key === options.overlay)
				return !!o && o.visible
			},
		},
		music_overlay_visible: {
			name: 'Music overlay: visible',
			type: 'boolean',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [],
			callback: () => self.state.musicOverlayVisible !== false,
		},
		alerts_paused: {
			name: 'Alerts: queue paused',
			type: 'boolean',
			defaultStyle: { bgcolor: AMBER, color: WHITE },
			options: [],
			callback: () => !!(self.state.alerts && self.state.alerts.paused),
		},
		alerts_muted: {
			name: 'Alerts: display muted',
			type: 'boolean',
			defaultStyle: { bgcolor: AMBER, color: WHITE },
			options: [],
			callback: () => !!(self.state.alerts && self.state.alerts.muted),
		},
		music_playing: {
			name: 'Music: playing',
			type: 'boolean',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [],
			callback: () => !!(self.state.status && self.state.status.music && self.state.status.music.state === 'playing'),
		},
		matchup_clock_running: {
			name: 'Versus: clock running',
			type: 'boolean',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [],
			callback: () => !!(self.state.matchup && self.state.matchup.clock && self.state.matchup.clock.isRunning),
		},
		matchup_runner_finished: {
			name: 'Versus: runner finished',
			type: 'boolean',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [
				{
					id: 'runner',
					type: 'dropdown',
					label: 'Runner',
					choices: [
						{ id: 0, label: 'Runner 1' },
						{ id: 1, label: 'Runner 2' },
						{ id: 2, label: 'Runner 3' },
						{ id: 3, label: 'Runner 4' },
					],
					default: 0,
				},
			],
			callback: ({ options }) => {
				const c = self.state.matchup && self.state.matchup.competitors && self.state.matchup.competitors[options.runner]
				return !!(c && c.timer && c.timer.finished)
			},
		},
		matchup_win_ready: {
			name: 'Versus: win requirement met',
			type: 'boolean',
			description: 'True when any competitor has reached the match target score',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [],
			callback: () => {
				const mu = self.state.matchup
				if (!mu || mu.format === 'points') return false
				const target = Number(mu.targetScore) || 0
				if (target <= 0) return false
				return (mu.competitors || []).some((c) => (Number(c.score) || 0) >= target)
			},
		},
		poll_active: {
			name: 'Polls: poll actively running',
			type: 'boolean',
			description: 'True while an audience poll is open for voting',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [],
			callback: () => {
				const p = self.state.poll || (self.state.status && self.state.status.poll)
				return !!(p && (p.status === 'ACTIVE' || p.status === 'active' || p.active))
			},
		},
		tournament_active: {
			name: 'Tournament: bracket in progress',
			type: 'boolean',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [],
			callback: () => {
				const tr = self.state.tournament || self.state.pollTournament
				const st = tr && String(tr.status || '').toUpperCase()
				return st === 'ACTIVE' || st === 'IN_PROGRESS' || st === 'READY'
			},
		},
		tournament_win_ready: {
			name: 'Tournament: active match win requirement met (ready to advance)',
			type: 'boolean',
			description: 'True when an entrant in the active match has reached targetScore and is ready to advance',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [],
			callback: () => {
				const tr = self.state.tournament
				if (!tr || tr.scoringType === 'points' || tr.scoreFormat === 'points') return false
				const matches = Array.isArray(tr.matches) ? tr.matches : []
				const eName = (e) => (e && typeof e === 'object' ? e.name || '' : String(e || ''))
				const eScore = (m, idx) => {
					const e = idx === 0 ? m && m.entrant1 : m && m.entrant2
					if (e && typeof e === 'object' && e.score !== undefined) return Number(e.score) || 0
					if (m && Array.isArray(m.scores) && m.scores[idx] !== undefined) return Number(m.scores[idx]) || 0
					return Number(idx === 0 ? m && m.score1 : m && m.score2) || 0
				}
				const active =
					(tr.activeMatchId && matches.find((m) => m.id === tr.activeMatchId)) ||
					matches.find(
						(m) =>
							!m.isBye &&
							m.status !== 'COMPLETED' &&
							m.status !== 'completed' &&
							eName(m.entrant1) &&
							eName(m.entrant1) !== 'TBD' &&
							eName(m.entrant2) &&
							eName(m.entrant2) !== 'TBD',
					)
				if (!active || active.status === 'COMPLETED' || active.status === 'completed') return false
				if (active.pendingWinner) return true
				const target = Number(active.targetScore || tr.targetScore) || 0
				if (target <= 0) return false
				return eScore(active, 0) >= target || eScore(active, 1) >= target
			},
		},
		randomizer_spinning: {
			name: 'Randomizer: actively spinning',
			type: 'boolean',
			description: 'True while the randomizer wheel or roller is actively spinning on stream',
			defaultStyle: { bgcolor: AMBER, color: WHITE },
			options: [],
			callback: () => !!self.state.randomizerSpinning,
		},
		tournament_focus_active: {
			name: 'Tournament: live camera focus mode active',
			type: 'boolean',
			description: 'True when the overlay camera focus mode is enabled',
			defaultStyle: { bgcolor: BLUE, color: WHITE },
			options: [
				{
					id: 'target',
					type: 'dropdown',
					label: 'Target Overlay',
					choices: [
						{ id: 'either', label: 'Either (Versus or Poll)' },
						{ id: 'versus', label: 'Versus Tournament' },
						{ id: 'poll', label: 'Audience Poll Tournament' },
					],
					default: 'either',
				},
			],
			callback: ({ options }) => {
				const vt = self.state.tournament
				const pt = self.state.pollTournament
				const vFocus = Boolean(vt?.viewSettings?.focus)
				const pFocus = Boolean(pt?.viewSettings?.focus)
				if (options.target === 'versus') return vFocus
				if (options.target === 'poll') return pFocus
				return vFocus || pFocus
			},
		},
		tournament_bracket_section: {
			name: 'Tournament: bracket section active',
			type: 'boolean',
			description: 'True when the overlay is displaying the specified bracket section',
			defaultStyle: { bgcolor: BLUE, color: WHITE },
			options: [
				{
					id: 'target',
					type: 'dropdown',
					label: 'Target Overlay',
					choices: [
						{ id: 'versus', label: 'Versus Tournament' },
						{ id: 'poll', label: 'Audience Poll Tournament' },
					],
					default: 'versus',
				},
				{
					id: 'section',
					type: 'dropdown',
					label: 'Section',
					choices: [
						{ id: 'all', label: 'All Sections' },
						{ id: 'winners', label: 'Winners Bracket' },
						{ id: 'losers', label: 'Losers Bracket' },
						{ id: 'finals', label: 'Grand Finals' },
					],
					default: 'winners',
				},
			],
			callback: ({ options }) => {
				const t = options.target === 'poll' ? self.state.pollTournament : self.state.tournament
				const curSection = (t?.viewSettings?.bracket || 'all').toLowerCase()
				return curSection === options.section
			},
		},
		tier_voting_active: {
			name: 'Tier Maker: voting actively running',
			type: 'boolean',
			description: 'True while a tier list item vote is currently open for chat votes',
			defaultStyle: { bgcolor: BLUE, color: WHITE },
			options: [],
			callback: () => {
				const vote = self.state.tierList?.activeVote || self.state.status?.tierList?.activeVote
				return Boolean(vote && (vote.status === 'ACTIVE' || !vote.status))
			},
		},
		tier_vote_locked: {
			name: 'Tier Maker: voting locked (ready to place)',
			type: 'boolean',
			description: 'True when voting is closed and locked awaiting Lock & Place',
			defaultStyle: { bgcolor: AMBER, color: WHITE },
			options: [],
			callback: () => {
				const vote = self.state.tierList?.activeVote || self.state.status?.tierList?.activeVote
				return Boolean(vote && vote.status === 'LOCKED')
			},
		},
		tier_consensus_tier: {
			name: 'Tier Maker: consensus matches tier',
			type: 'boolean',
			description: 'True when the leading audience consensus matches a specific tier label (e.g. S)',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [
				{
					id: 'tier',
					type: 'textinput',
					label: 'Tier label (e.g. S, A, B, C)',
					default: 'S',
				},
			],
			callback: ({ options }) => {
				const vote = self.state.tierList?.activeVote || self.state.status?.tierList?.activeVote
				const current = (vote?.consensus?.consensusTier?.label || '').trim().toLowerCase()
				const target = String(options.tier || '')
					.trim()
					.toLowerCase()
				return Boolean(current && target && current === target)
			},
		},
		trivia_phase: {
			name: 'Trivia: phase status matches',
			type: 'boolean',
			description: 'True when trivia is in the specified phase (idle / question / reveal)',
			defaultStyle: { bgcolor: BLUE, color: WHITE },
			options: [
				{
					id: 'phase',
					type: 'dropdown',
					label: 'Phase',
					choices: [
						{ id: 'idle', label: 'Idle' },
						{ id: 'question', label: 'Question active / voting open' },
						{ id: 'reveal', label: 'Answer revealed / voting closed' },
					],
					default: 'question',
				},
			],
			callback: ({ options }) => {
				const tr = self.state.trivia || self.state.status?.trivia
				const curPhase = tr?.status || 'idle'
				return curPhase === options.phase
			},
		},
		trivia_unplayed_remaining: {
			name: 'Trivia: unplayed questions remaining in bank',
			type: 'boolean',
			description: 'True when at least one question in the bank has not yet been marked (Done)',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [],
			callback: () => {
				const tr = self.state.trivia || self.state.status?.trivia
				const unplayed = tr?.unplayedCount ?? (tr?.questions ? tr.questions.filter((q) => !q.done).length : 0)
				return unplayed > 0
			},
		},
	})
}
