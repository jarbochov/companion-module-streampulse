const { WHITE, DARK_GRAY } = require('./colors')

module.exports = function () {
	const presets = {}

	presets['milestone_stream_counter'] = {
		type: 'button',
		category: 'Milestones & Streaks',
		name: 'Stream Number & Lifetime Hours',
		style: {
			text: 'STREAM\\n#$(streampulse:milestone_stream_number)\\n$(streampulse:milestone_total_hours) hrs',
			size: '14',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['milestone_streaks'] = {
		type: 'button',
		category: 'Milestones & Streaks',
		name: 'Daily & Weekly Streaks',
		style: {
			text: 'STREAK\\n$(streampulse:milestone_daily_streak)d daily\\n$(streampulse:milestone_weekly_streak)w weekly',
			size: '14',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['milestone_community'] = {
		type: 'button',
		category: 'Milestones & Streaks',
		name: 'Community Lifetime Stats',
		style: {
			text: 'COMMUNITY\\n$(streampulse:milestone_lifetime_chatters) chatters\\n$(streampulse:milestone_lifetime_messages) msgs',
			size: '12',
			color: WHITE,
			bgcolor: DARK_GRAY,
		},
		steps: [
			{
				down: [],
				up: [],
			},
		],
		feedbacks: [],
	}

	return presets
}
