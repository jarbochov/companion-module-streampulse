const statusPresets = require('./presets/status')
const timerPresets = require('./presets/timers')
const alertPresets = require('./presets/alerts')
const highlightPresets = require('./presets/highlights')
const musicPresets = require('./presets/music')
const chatPresets = require('./presets/chat')
const milestonePresets = require('./presets/milestones')
const randomizerPresets = require('./presets/randomizer')
const mediaPresets = require('./presets/media')
const pollPresets = require('./presets/polls')
const matchupPresets = require('./presets/matchup')
const tournamentPresets = require('./presets/tournaments')
const tierListPresets = require('./presets/tier-list')
const triviaPresets = require('./presets/trivia')
const { speakerPresets } = require('./speakers')

module.exports = function (self) {
	self.setPresetDefinitions({
		...statusPresets(),
		...timerPresets(),
		...alertPresets(),
		...highlightPresets(),
		...musicPresets(),
		...chatPresets(),
		...milestonePresets(),
		...randomizerPresets(),
		...mediaPresets(),
		...pollPresets(),
		...matchupPresets(),
		...tournamentPresets(),
		...tierListPresets(),
		...speakerPresets(self),
		...triviaPresets(),
	})
}
