const alertActions = require('./actions/alerts')
const overlayActions = require('./actions/overlays')
const tierListActions = require('./actions/tier-list')
const pollActions = require('./actions/polls')
const matchupActions = require('./actions/matchup')
const tournamentActions = require('./actions/tournaments')
const randomizerActions = require('./actions/randomizer')
const chatActions = require('./actions/chat')
const variableActions = require('./actions/variables')
const timerGoalActions = require('./actions/timers-goals')
const productionActions = require('./actions/production')
const { speakerActions } = require('./speakers')

module.exports = function (self) {
	const run = (fn) => async () => {
		try {
			await fn()
			self.poll()
		} catch (err) {
			self.log('error', err.message)
		}
	}

	self.setActionDefinitions({
		...alertActions(self, run),
		...overlayActions(self, run),
		...tierListActions(self, run),
		...pollActions(self, run),
		...matchupActions(self, run),
		...tournamentActions(self, run),
		...randomizerActions(self, run),
		...chatActions(self, run),
		...variableActions(self, run),
		...timerGoalActions(self, run),
		...productionActions(self, run),
		...speakerActions(self),
	})
}
