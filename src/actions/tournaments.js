const entrantName = (e) => (e && typeof e === 'object' ? e.name || '' : String(e || ''))

const entrantScore = (m, idx) => {
	const e = idx === 0 ? m && m.entrant1 : m && m.entrant2
	if (e && typeof e === 'object' && e.score !== undefined) return Number(e.score) || 0
	if (m && Array.isArray(m.scores) && m.scores[idx] !== undefined) return Number(m.scores[idx]) || 0
	return Number(idx === 0 ? m && m.score1 : m && m.score2) || 0
}

const entrantRounds = (m, idx) => {
	const e = idx === 0 ? m && m.entrant1 : m && m.entrant2
	if (e && typeof e === 'object' && e.rounds !== undefined) return Number(e.rounds) || 0
	return Number(idx === 0 ? m && m.rounds1 : m && m.rounds2) || 0
}

const isReadyMatch = (m) => {
	if (!m || m.isBye) return false
	const n1 = entrantName(m.entrant1)
	const n2 = entrantName(m.entrant2)
	return !!n1 && n1 !== 'TBD' && n1 !== 'BYE' && !!n2 && n2 !== 'TBD' && n2 !== 'BYE'
}

const isCompletedMatch = (m) => m && (m.status === 'COMPLETED' || m.status === 'completed')

const tournamentMatchChoices = (self) => {
	const t = self.state.tournament
	const matches = (t && Array.isArray(t.matches) ? t.matches : []).filter(
		(m) => !m.isBye && (entrantName(m.entrant1) || entrantName(m.entrant2)),
	)
	const list = matches.map((m) => ({
		id: m.id,
		label: `${m.roundName || m.label || m.id}: ${entrantName(m.entrant1) || 'TBD'} vs ${entrantName(m.entrant2) || 'TBD'} (${entrantScore(m, 0)}-${entrantScore(m, 1)})`,
	}))
	return [{ id: '', label: '(Active / First Ready Match)' }, ...list]
}

const resolveActiveTournamentMatch = (self, explicitMatchId, isPoll = false) => {
	const t = isPoll ? self.state.pollTournament : self.state.tournament
	if (!t || !Array.isArray(t.matches)) return null
	if (explicitMatchId) {
		const found = t.matches.find((m) => m.id === explicitMatchId)
		if (found) return found
	}
	if (t.activeMatchId) {
		const active = t.matches.find((m) => m.id === t.activeMatchId)
		if (active) return active
	}
	return (
		t.matches.find((m) => isReadyMatch(m) && !isCompletedMatch(m)) ||
		t.matches.find((m) => !m.isBye && (entrantName(m.entrant1) || entrantName(m.entrant2))) ||
		null
	)
}

module.exports = function (self, run) {
	return {
		tournament_control: {
			name: 'Tournament: Match selection, highlight & bracket control',
			description:
				'Select or pin matches, toggle live bracket highlight, reset or rollback matches, or start a poll match vote',
			options: [
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'next_match', label: 'Select Next Ready Match' },
						{ id: 'prev_match', label: 'Select Previous Ready Match' },
						{ id: 'select_match', label: 'Pin Specific Match as Live' },
						{ id: 'unpin_match', label: 'Unpin Live Match (Concurrent Play)' },
						{ id: 'toggle_highlight', label: 'Toggle Live Match Highlight on Bracket' },
						{ id: 'reset_match', label: 'Reset Match Scores (0-0)' },
						{ id: 'rollback_match', label: 'Rollback / Reopen Completed Match' },
						{ id: 'start_poll_match', label: 'Poll Tournament: Launch Audience Vote for Active Match' },
					],
					default: 'next_match',
				},
				{
					id: 'matchId',
					type: 'dropdown',
					label: 'Target Match (optional)',
					choices: tournamentMatchChoices(self),
					default: '',
					isVisibleExpression: `$(options:action) == 'select_match' || $(options:action) == 'reset_match' || $(options:action) == 'rollback_match'`,
				},
			],
			callback: async ({ options }) =>
				run(() => {
					const t = self.state.tournament
					if (options.action === 'start_poll_match') {
						const pm = resolveActiveTournamentMatch(self, options.matchId, true)
						if (!pm) return
						return self.api.tournamentPost('/start-match', { matchId: pm.id }, true)
					}
					if (!t) return
					const ready = (t.matches || []).filter((m) => isReadyMatch(m) && !isCompletedMatch(m))
					if (options.action === 'next_match' || options.action === 'prev_match') {
						if (!ready.length) return
						const idx = ready.findIndex((m) => m.id === t.activeMatchId)
						const step = options.action === 'next_match' ? 1 : -1
						const nextIdx = idx === -1 ? 0 : (idx + step + ready.length) % ready.length
						return self.api.tournamentPost('/select-match', { matchId: ready[nextIdx].id }, false)
					}
					if (options.action === 'select_match') {
						const m = resolveActiveTournamentMatch(self, options.matchId, false)
						return self.api.tournamentPost('/select-match', { matchId: m ? m.id : null }, false)
					}
					if (options.action === 'unpin_match') {
						return self.api.tournamentPost('/select-match', { matchId: null }, false)
					}
					if (options.action === 'toggle_highlight') {
						const cur = t.highlightLive !== false
						return self.api.tournamentPost('/settings', { highlightLive: !cur }, false)
					}
					if (options.action === 'reset_match') {
						const m = resolveActiveTournamentMatch(self, options.matchId, false)
						if (!m) return
						return self.api.tournamentPost('/reset-match', { matchId: m.id }, false)
					}
					if (options.action === 'rollback_match') {
						const m = resolveActiveTournamentMatch(self, options.matchId, false)
						if (!m) return
						return self.api.tournamentPost('/rollback', { matchId: m.id }, false)
					}
				})(),
		},
		tournament_score: {
			name: 'Tournament: Change match game or round score',
			description: 'Score an entrant in the active (or selected) tournament bracket match',
			options: [
				{
					id: 'matchId',
					type: 'dropdown',
					label: 'Match',
					choices: tournamentMatchChoices(self),
					default: '',
				},
				{
					id: 'entrant',
					type: 'dropdown',
					label: 'Entrant',
					choices: [
						{ id: 0, label: 'Entrant 1 (Left / Top)' },
						{ id: 1, label: 'Entrant 2 (Right / Bottom)' },
					],
					default: 0,
				},
				{
					id: 'target',
					type: 'dropdown',
					label: 'Score Type',
					choices: [
						{ id: 'game', label: 'Game Score (Series Wins)' },
						{ id: 'round', label: 'Round in Game (Round Pips)' },
					],
					default: 'game',
				},
				{ id: 'delta', type: 'number', label: 'Change (+/-)', default: 1, min: -50, max: 50 },
			],
			callback: async ({ options }) =>
				run(() => {
					const m = resolveActiveTournamentMatch(self, options.matchId, false)
					if (!m) return
					const idx = Number(options.entrant) || 0
					const name = entrantName(idx === 0 ? m.entrant1 : m.entrant2)
					const d = Number(options.delta) || 0
					if (options.target === 'round') {
						return self.api.tournamentPost(
							'/score',
							{ matchId: m.id, entrant: name, entrantIndex: idx, roundDelta: d },
							false,
						)
					}
					const nextScore = Math.max(0, entrantScore(m, idx) + d)
					return self.api.tournamentPost(
						'/score',
						{
							matchId: m.id,
							entrant: name,
							entrantIndex: idx,
							delta: d,
							...(idx === 0 ? { entrant1Score: nextScore } : { entrant2Score: nextScore }),
						},
						false,
					)
				})(),
		},
		tournament_advance: {
			name: 'Tournament: Confirm & advance match winner',
			description: 'Advance the winner of the active (or selected) match to the next bracket round',
			options: [
				{
					id: 'matchId',
					type: 'dropdown',
					label: 'Match',
					choices: tournamentMatchChoices(self),
					default: '',
				},
				{
					id: 'winner',
					type: 'dropdown',
					label: 'Winner to Advance',
					choices: [
						{ id: 'auto', label: 'Auto (Leading Entrant / Target Met)' },
						{ id: 'e1', label: 'Entrant 1 (Left / Top)' },
						{ id: 'e2', label: 'Entrant 2 (Right / Bottom)' },
						{ id: 'draw', label: 'Draw / Tie (Round Robin / Swiss)' },
					],
					default: 'auto',
				},
			],
			callback: async ({ options }) =>
				run(() => {
					const m = resolveActiveTournamentMatch(self, options.matchId, false)
					if (!m) return
					if (options.winner === 'draw') {
						return self.api.tournamentPost('/advance', { matchId: m.id, winner: 'DRAW', isDraw: true }, false)
					}
					const n1 = entrantName(m.entrant1)
					const n2 = entrantName(m.entrant2)
					const s1 = entrantScore(m, 0)
					const s2 = entrantScore(m, 1)
					const r1 = entrantRounds(m, 0)
					const r2 = entrantRounds(m, 1)
					let winnerName = null
					if (options.winner === 'e1') winnerName = n1
					else if (options.winner === 'e2') winnerName = n2
					else if (m.pendingWinner) winnerName = m.pendingWinner
					else if (s1 > s2) winnerName = n1
					else if (s2 > s1) winnerName = n2
					else if (r1 > r2) winnerName = n1
					else if (r2 > r1) winnerName = n2
					else winnerName = n1
					if (!winnerName) return
					return self.api.tournamentPost('/advance', { matchId: m.id, winner: winnerName }, false)
				})(),
		},
		tournament_view: {
			name: 'Tournament: Bracket camera focus, round pan & section view',
			description: 'Control live camera framing, pan across rounds, or switch bracket sections on active OBS overlays',
			options: [
				{
					id: 'target',
					type: 'dropdown',
					label: 'Target Overlay',
					choices: [
						{ id: 'versus', label: 'Versus Bracket (/overlays/tournament.html)' },
						{ id: 'poll', label: 'Audience Poll Bracket (/overlays/poll-tournament.html)' },
					],
					default: 'versus',
				},
				{
					id: 'focus',
					type: 'dropdown',
					label: 'Camera Focus / Zoom Mode',
					choices: [
						{ id: 'no_change', label: 'No Change' },
						{ id: 'toggle', label: 'Toggle Focus Mode (Zoom In / Full Overview)' },
						{ id: '1', label: 'Enable Camera Focus (Zoomed In on Match)' },
						{ id: '0', label: 'Disable Camera Focus (Full Bracket Overview)' },
					],
					default: 'toggle',
				},
				{
					id: 'round',
					type: 'dropdown',
					label: 'Round Camera Pan',
					choices: [
						{ id: 'no_change', label: 'No Change' },
						{ id: 'next', label: 'Next Round' },
						{ id: 'prev', label: 'Previous Round' },
						{ id: 'reset', label: 'Reset (Follow Active Match)' },
						{ id: 'custom', label: 'Specific Round (Enter Number or Name Below)' },
					],
					default: 'no_change',
				},
				{
					id: 'roundValue',
					type: 'textinput',
					label: 'Custom Round Number or Name (e.g. 2, Semifinals)',
					default: '',
					isVisibleExpression: `$(options:round) == 'custom'`,
				},
				{
					id: 'bracket',
					type: 'dropdown',
					label: 'Bracket Section (Double Elimination)',
					choices: [
						{ id: 'no_change', label: 'No Change' },
						{ id: 'cycle', label: 'Cycle Next Section' },
						{ id: 'all', label: 'All Sections' },
						{ id: 'winners', label: 'Winners Bracket' },
						{ id: 'losers', label: 'Losers Bracket' },
						{ id: 'finals', label: 'Grand Finals' },
					],
					default: 'no_change',
				},
				{
					id: 'glide',
					type: 'dropdown',
					label: 'Transitions',
					choices: [
						{ id: 'no_change', label: 'No Change' },
						{ id: '1', label: 'Smooth Glide (0.85s)' },
						{ id: '0', label: 'Instant Snap (No Transition)' },
					],
					default: 'no_change',
				},
				{
					id: 'matchId',
					type: 'dropdown',
					label: 'Target Specific Match (optional)',
					choices: tournamentMatchChoices(self),
					default: '',
				},
			],
			callback: async ({ options }) =>
				run(() => {
					const isPoll = options.target === 'poll'
					const body = {}
					if (options.focus && options.focus !== 'no_change') {
						body.focus = options.focus
					}
					if (options.round && options.round !== 'no_change') {
						body.round = options.round === 'custom' ? options.roundValue : options.round
					}
					if (options.bracket && options.bracket !== 'no_change') {
						body.bracket = options.bracket
					}
					if (options.glide && options.glide !== 'no_change') {
						body.glide = options.glide
					}
					if (options.matchId) {
						body.matchId = options.matchId
					}
					return self.api.tournamentPost('/view', body, isPoll)
				})(),
		},
	}
}
