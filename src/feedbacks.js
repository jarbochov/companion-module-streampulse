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

module.exports = async function (self) {
	self.setFeedbackDefinitions({
		timer_state: {
			name: 'Timer: state',
			type: 'boolean',
			description: 'True while the timer is in the chosen state',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [
				{ id: 'timer', type: 'dropdown', label: 'Timer', choices: timerChoices(self), default: timerChoices(self)[0].id },
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
			options: [{ id: 'goal', type: 'dropdown', label: 'Goal', choices: goalChoices(self), default: goalChoices(self)[0].id }],
			callback: ({ options }) => {
				const g = self.state.goals.find((x) => x.id === options.goal)
				return !!g && !!g.complete
			},
		},
		goal_enabled: {
			name: 'Goal: enabled',
			type: 'boolean',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [{ id: 'goal', type: 'dropdown', label: 'Goal', choices: goalChoices(self), default: goalChoices(self)[0].id }],
			callback: ({ options }) => {
				const g = self.state.goals.find((x) => x.id === options.goal)
				return !!g && g.enabled !== false
			},
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
