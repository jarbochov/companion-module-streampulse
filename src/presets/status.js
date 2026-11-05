const { GREEN, RED, WHITE, DARK_GRAY } = require('./colors')

module.exports = function () {
	const presets = {}

	presets['live_status'] = {
		type: 'button',
		category: 'Stream Status',
		name: 'Live Stream & Viewers',
		style: {
			text: 'STREAM\\nOFFLINE',
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
		feedbacks: [
			{
				feedbackId: 'session_live',
				options: {},
				style: {
					text: 'LIVE\\n$(streampulse:viewers) v\\n$(streampulse:stream_uptime)',
					bgcolor: RED,
					color: WHITE,
					size: '14',
				},
			},
		],
	}

	presets['server_status'] = {
		type: 'button',
		category: 'Stream Status',
		name: 'Server Status & Uptime',
		style: {
			text: 'SERVER\\nOFFLINE',
			size: '14',
			color: WHITE,
			bgcolor: RED,
		},
		steps: [
			{
				down: [
					{
						actionId: 'restart_server',
						options: {},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'server_online',
				options: {},
				style: {
					text: 'PULSE\\nONLINE\\n$(streampulse:streampulse_uptime)',
					bgcolor: GREEN,
					color: WHITE,
					size: '12',
				},
			},
		],
	}

	return presets
}
