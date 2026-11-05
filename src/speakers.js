const PROFILE_FIELDS = [
	{ id: 'name', label: 'Name' },
	{ id: 'avatarSrc', label: 'Avatar URL or media-library path' },
	{ id: 'handle', label: 'Handle' },
	{ id: 'pronouns', label: 'Pronouns' },
	{ id: 'callIn.location', label: 'Call-in location' },
	{ id: 'callIn.statusText', label: 'Call-in status label' },
]

const VISIBILITY_FIELDS = [
	{ id: 'showAvatar', label: 'Avatar' },
	{ id: 'showHandle', label: 'Handle' },
	{ id: 'showPronouns', label: 'Pronouns' },
	{ id: 'callIn.enabled', label: 'Call-in mode' },
	{ id: 'callIn.showLocation', label: 'Call-in location' },
]

const speakerOperations = new WeakMap()
async function serializeSpeakerOperation(self, overlayId, operation) {
	let pending = speakerOperations.get(self)
	if (!pending) {
		pending = new Map()
		speakerOperations.set(self, pending)
	}
	const previous = pending.get(overlayId) || Promise.resolve()
	const current = previous.catch(() => {}).then(operation)
	pending.set(overlayId, current)
	try {
		return await current
	} finally {
		if (pending.get(overlayId) === current) pending.delete(overlayId)
		if (!pending.size) speakerOperations.delete(self)
	}
}

const speakerKey = (speaker) => `${speaker.overlayId}::${speaker.elementId}`
const speakerChoices = (self) => {
	const choices = (self.state.speakers || []).map((speaker) => ({
		id: speakerKey(speaker),
		label: `${speaker.overlayName || speaker.overlayId} / ${speaker.name || speaker.elementId}`,
	}))
	return choices.length ? choices : [{ id: '', label: '(no speaker badges found)' }]
}
const findSpeaker = (self, key) => (self.state.speakers || []).find((speaker) => speakerKey(speaker) === key)
const speakerFieldValue = (entry, field) => {
	const speaker = entry?.speakerBadge?.speaker || {}
	return field.startsWith('callIn.') ? speaker.callIn?.[field.slice(7)] : speaker[field]
}
const speakerFieldVisible = (entry, field) =>
	field === 'callIn.enabled' ? speakerFieldValue(entry, field) === true : speakerFieldValue(entry, field) !== false
const speakerVariablePrefix = (entry) =>
	`speaker_${`${entry.overlayId}_${entry.elementId}`
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '')}`

const fieldPatch = (field, value) =>
	field.startsWith('callIn.') ? { speaker: { callIn: { [field.slice(7)]: value } } } : { speaker: { [field]: value } }

const targetOption = (self) => ({
	id: 'speaker',
	type: 'dropdown',
	label: 'Speaker badge',
	choices: speakerChoices(self),
	default: speakerChoices(self)[0].id,
})

function speakerActions(self) {
	const run =
		(fn) =>
		async ({ options }) => {
			const api = self.api
			const ensureCurrentConnection = () => {
				if (self.api !== api) throw new Error('StreamPulse connection changed; speaker action cancelled')
			}
			try {
				const entry = findSpeaker(self, options.speaker)
				if (!entry) throw new Error('Speaker badge not found; refresh the connection and select a badge')
				await serializeSpeakerOperation(self, entry.overlayId, async () => {
					ensureCurrentConnection()
					const current = findSpeaker(self, options.speaker)
					if (!current) throw new Error('Speaker badge no longer exists')
					const patch = await fn(current, options, api)
					ensureCurrentConnection()
					const snapshot = await api.updateSpeaker(current.overlayId, current.elementId, patch)
					ensureCurrentConnection()
					if (Array.isArray(snapshot?.speakers)) {
						const speakers = [
							...(self.state.speakers || []).filter((speaker) => speaker.overlayId !== current.overlayId),
							...snapshot.speakers.map((speaker) => ({
								...speaker,
								overlayId: current.overlayId,
								overlayName: snapshot.name || current.overlayName,
								elementId: speaker.id,
							})),
						]
						if (typeof self.applyPatch === 'function') self.applyPatch({ speakers })
						else self.state.speakers = speakers
					}
					self.checkFeedbacks?.('speaker_visibility', 'speaker_identity')
					await self.poll()
				})
			} catch (err) {
				self.log('error', err.message)
			}
		}

	return {
		speaker_profile: {
			name: 'Speaker Badge: update profile field',
			description: 'Updates only the chosen field. Avatar accepts a URL or StreamPulse media-library path.',
			options: [
				targetOption(self),
				{ id: 'field', type: 'dropdown', label: 'Profile field', choices: PROFILE_FIELDS, default: 'name' },
				{ id: 'value', type: 'textinput', label: 'Value', default: '', useVariables: true },
			],
			callback: run(async (_entry, options) => {
				if (!PROFILE_FIELDS.some((field) => field.id === options.field))
					throw new Error('Invalid speaker profile field')
				return fieldPatch(options.field, await self.parseVariablesInString(String(options.value ?? '')))
			}),
		},
		speaker_audio_source: {
			name: 'Speaker Badge: select OBS audio source',
			description: 'Uses the exact OBS input name. Does not change the badge threshold, hold time or styling.',
			options: [
				targetOption(self),
				{
					id: 'inputName',
					type: 'textinput',
					label: 'OBS audio input name',
					default: 'Mic/Aux',
					useVariables: true,
				},
			],
			callback: run(async (_entry, options) => ({
				audio: { inputName: await self.parseVariablesInString(String(options.inputName ?? '')) },
			})),
		},
		speaker_visibility: {
			name: 'Speaker Badge: set or toggle visibility',
			description: 'Controls badge details and call-in mode, not the visibility of the entire overlay.',
			options: [
				targetOption(self),
				{ id: 'field', type: 'dropdown', label: 'Detail', choices: VISIBILITY_FIELDS, default: 'showAvatar' },
				{
					id: 'state',
					type: 'dropdown',
					label: 'State',
					choices: [
						{ id: 'toggle', label: 'Toggle' },
						{ id: 'show', label: 'Show / enable' },
						{ id: 'hide', label: 'Hide / disable' },
					],
					default: 'toggle',
				},
			],
			callback: run(async (entry, options, api) => {
				if (!VISIBILITY_FIELDS.some((field) => field.id === options.field))
					throw new Error('Invalid speaker visibility field')
				if (!['toggle', 'show', 'hide'].includes(options.state)) throw new Error('Invalid speaker visibility state')
				if (options.state === 'toggle') {
					const snapshot = await api.speakers(entry.overlayId)
					const current = snapshot?.speakers?.find((speaker) => speaker.id === entry.elementId)
					if (!current) throw new Error('Speaker badge no longer exists')
					return fieldPatch(options.field, !speakerFieldVisible(current, options.field))
				}
				return fieldPatch(options.field, options.state === 'show')
			}),
		},
	}
}

function speakerPresets(self) {
	const presets = {
		obs_health_status: {
			type: 'button',
			category: 'OBS',
			name: 'OBS connection health',
			style: { text: 'OBS\\n$(streampulse:obs_status)', size: '12', color: 0xffffff, bgcolor: 0xcc0000 },
			steps: [{ down: [], up: [] }],
			feedbacks: [
				{ feedbackId: 'obs_connecting', options: {}, style: { bgcolor: 0xcc8800 } },
				{ feedbackId: 'obs_connected', options: {}, style: { bgcolor: 0x00aa00 } },
			],
		},
		obs_scene_sync_status: {
			type: 'button',
			category: 'OBS',
			name: 'OBS Scene Sync enabled',
			style: { text: 'SCENE SYNC\\n$(streampulse:obs_scene_sync)', size: '12', color: 0xffffff, bgcolor: 0x1a1b1e },
			steps: [{ down: [], up: [] }],
			feedbacks: [{ feedbackId: 'obs_scene_sync', options: { enabled: true }, style: { bgcolor: 0x1a73e8 } }],
		},
	}
	for (const entry of self.state.speakers || []) {
		const key = speakerKey(entry)
		const prefix = speakerVariablePrefix(entry)
		for (const field of VISIBILITY_FIELDS) {
			presets[`speaker_visibility_${encodeURIComponent(key)}_${field.id}`] = {
				type: 'button',
				category: 'Speaker Badges',
				name: `${entry.overlayName || entry.overlayId} / ${entry.name || entry.elementId}: toggle ${field.label}`,
				style: {
					text: `$(streampulse:${prefix}_name)\\n${field.label.toUpperCase()}`,
					size: '12',
					color: 0xffffff,
					bgcolor: 0x1a1b1e,
				},
				steps: [
					{
						down: [{ actionId: 'speaker_visibility', options: { speaker: key, field: field.id, state: 'toggle' } }],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'speaker_visibility',
						options: { speaker: key, field: field.id },
						style: { bgcolor: 0x00aa00, color: 0xffffff },
					},
				],
			}
		}
	}
	return presets
}

module.exports = {
	PROFILE_FIELDS,
	VISIBILITY_FIELDS,
	speakerChoices,
	findSpeaker,
	speakerFieldValue,
	speakerFieldVisible,
	speakerVariablePrefix,
	speakerActions,
	speakerPresets,
}
