module.exports = function (self, run) {
	return {
		mark_clip: {
			name: 'Production: Mark clip candidate',
			description: 'Record a timestamped clip candidate marker in the current broadcast session',
			options: [],
			callback: async () => run(() => self.api.markClip('companion-button'))(),
		},
		pin_last_highlight: {
			name: 'Production: Pin last chat message as highlight',
			description: 'Pin the most recent chat message to the stream highlights list and overlay',
			options: [],
			callback: async () => run(() => self.api.pinLastHighlight())(),
		},
		start_session: {
			name: 'Session: Start a new session',
			description: 'Start a new broadcast session for live tracking and credits',
			options: [],
			callback: async () => run(() => self.api.startSession())(),
		},
		end_session: {
			name: 'Session: End and archive session',
			description: 'End the active broadcast session and save it to session archives',
			options: [],
			callback: async () => run(() => self.api.endSession())(),
		},
		reset_session_data: {
			name: 'Session: Reset chat data without archiving',
			description: 'Clears active chat data without saving to session archives',
			options: [],
			callback: async () => run(() => self.api.resetSession())(),
		},
		restart_server: {
			name: 'Server: Restart StreamPulse',
			description: 'Restarts the StreamPulse process; the active session continues',
			options: [],
			callback: async () => {
				try {
					await self.api.restartServer()
				} catch (err) {
					self.log('error', err.message)
				}
			},
		},
		stop_server: {
			name: 'Server: Stop StreamPulse',
			description:
				'Shuts StreamPulse down and archives the current session. Companion cannot start it again; use a shell script for that.',
			options: [],
			callback: async () => {
				try {
					await self.api.stopServer()
				} catch (err) {
					self.log('error', err.message)
				}
			},
		},
	}
}
