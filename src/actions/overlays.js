const {
	overlayChoices,
	pageChoices,
	pagedOverlayChoices,
	splitPage,
	slideshowChoices,
	videoChoices,
	cutoutChoices,
} = require('../choices')

module.exports = function (self, run) {
	return {
		page_navigate: {
			name: 'Overlay: Navigate page (next, prev, first, last, auto)',
			options: [
				{
					id: 'overlay',
					type: 'dropdown',
					label: 'Overlay',
					choices: pagedOverlayChoices(self),
					default: pagedOverlayChoices(self)[0].id,
				},
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'next', label: 'Next page' },
						{ id: 'prev', label: 'Previous page' },
						{ id: 'first', label: 'First page' },
						{ id: 'last', label: 'Last page' },
						{ id: 'auto', label: 'Toggle auto-advance' },
					],
					default: 'next',
				},
			],
			callback: async ({ options }) => run(() => self.api.pageAction(options.overlay, options.action))(),
		},
		page_goto: {
			name: 'Overlay: Show page by name',
			options: [
				{ id: 'page', type: 'dropdown', label: 'Page', choices: pageChoices(self), default: pageChoices(self)[0].id },
			],
			callback: async ({ options }) => {
				const { overlay, page } = splitPage(options.page)
				return run(() => self.api.pageAction(overlay, 'goto', { page }))()
			},
		},
		page_set_enabled: {
			name: 'Overlay: Enable / disable page',
			options: [
				{ id: 'page', type: 'dropdown', label: 'Page', choices: pageChoices(self), default: pageChoices(self)[0].id },
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'enable', label: 'Enable' },
						{ id: 'disable', label: 'Disable' },
						{ id: 'toggle', label: 'Toggle' },
					],
					default: 'toggle',
				},
			],
			callback: async ({ options }) => {
				const { overlay, page } = splitPage(options.page)
				return run(() => self.api.pageAction(overlay, options.action, { page }))()
			},
		},
		overlay_visibility: {
			name: 'Overlay: Show / hide entire overlay',
			options: [
				{
					id: 'overlay',
					type: 'dropdown',
					label: 'Overlay',
					choices: overlayChoices(self),
					default: overlayChoices(self)[0].id,
				},
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'toggle', label: 'Toggle' },
						{ id: 'on', label: 'Show' },
						{ id: 'off', label: 'Hide' },
					],
					default: 'toggle',
				},
			],
			callback: async ({ options }) => run(() => self.api.overlayVisibilityAction(options.overlay, options.action))(),
		},
		video_control: {
			name: 'Overlay: Video playback (play, pause, toggle, restart, mute)',
			options: [
				{
					id: 'video',
					type: 'dropdown',
					label: 'Video element',
					choices: videoChoices(self),
					default: videoChoices(self)[0].id,
				},
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'toggle', label: 'Play / Pause' },
						{ id: 'play', label: 'Play' },
						{ id: 'pause', label: 'Pause' },
						{ id: 'restart', label: 'Restart' },
						{ id: 'stop', label: 'Stop' },
						{ id: 'toggle-mute', label: 'Toggle mute' },
						{ id: 'mute', label: 'Mute' },
						{ id: 'unmute', label: 'Unmute' },
					],
					default: 'toggle',
				},
			],
			callback: async ({ options }) => {
				const { overlay, page } = splitPage(options.video)
				return run(() => self.api.videoControl(overlay, page, options.action))()
			},
		},
		cutout_control: {
			name: 'Overlay: Cutout punchthrough (toggle, punch, fill)',
			options: [
				{
					id: 'cutout',
					type: 'dropdown',
					label: 'Cutout element',
					choices: cutoutChoices(self),
					default: cutoutChoices(self)[0].id,
				},
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'toggle', label: 'Toggle punchthrough hole' },
						{ id: 'show', label: 'Punch hole (show cutout)' },
						{ id: 'hide', label: 'Fill / cover hole (hide cutout)' },
					],
					default: 'toggle',
				},
			],
			callback: async ({ options }) => {
				const { overlay, page } = splitPage(options.cutout)
				return run(() => self.api.cutoutControl(overlay, page, options.action))()
			},
		},
		slideshow_control: {
			name: 'Overlay: Slideshow control (play, pause, next, prev)',
			options: [
				{
					id: 'show',
					type: 'dropdown',
					label: 'Slideshow',
					choices: slideshowChoices(self),
					default: slideshowChoices(self)[0].id,
				},
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'next', label: 'Next slide' },
						{ id: 'prev', label: 'Previous slide' },
						{ id: 'pause', label: 'Pause' },
						{ id: 'play', label: 'Play' },
						{ id: 'toggle', label: 'Play / pause' },
					],
					default: 'next',
				},
			],
			callback: async ({ options }) => {
				const { overlay, page } = splitPage(options.show)
				return run(() => self.api.slideshowControl(overlay, page, options.action))()
			},
		},
		music_overlay: {
			name: 'Overlay: Music overlay (show / hide / toggle)',
			options: [
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'toggle', label: 'Toggle' },
						{ id: 'on', label: 'Show' },
						{ id: 'off', label: 'Hide' },
					],
					default: 'toggle',
				},
			],
			callback: async ({ options }) => run(() => self.api.musicOverlayAction(options.action))(),
		},
	}
}
