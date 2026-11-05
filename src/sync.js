async function collect(jobs) {
	const patch = {}
	let next = 0
	let failure
	await Promise.all(
		Array.from({ length: Math.min(4, jobs.length) }, async () => {
			while (next < jobs.length) {
				const job = jobs[next++]
				try {
					Object.assign(patch, await job.run())
				} catch (error) {
					if (job.required) failure = error
				}
			}
		}),
	)
	if (failure) throw failure
	return patch
}

function jobsFor(api, groups, wanted = []) {
	const jobs = []
	const add = (group, run, required = false) => {
		if (groups.includes(group)) jobs.push({ run, required })
	}
	add('core', async () => ({ status: await api.status(), online: true }), true)
	add('core', async () => ({ timers: (await api.timers()).timers || {} }))
	add('core', async () => ({ goals: (await api.goals()).items || [] }))
	add('alerts', async () => {
		const alerts = await api.alerts()
		return { alerts: alerts.queue || null, rules: alerts.rules || [] }
	})
	add('media', async () => ({ musicOverlayVisible: (await api.musicOverlay()).visible !== false }))
	add('media', async () => ({ overlayVisibility: (await api.overlayVisibility()).overlays || [] }))
	add('media', async () => ({ slideshows: (await api.slideshows()).slideshows || [] }))
	add('media', async () => ({ videos: (await api.videos()).videos || [] }))
	add('media', async () => ({ cutouts: (await api.cutouts()).cutouts || [] }))
	add('live', async () => ({ gamePlan: await api.gamePlan() }))
	add('live', async () => ({ weather: await api.weather() }))
	add('live', async () => ({ matchup: (await api.matchup()).matchup || null }))
	add('live', async () => ({ poll: (await api.pollActive()).poll || null }))
	add('live', async () => ({ tournament: (await api.tournament(false)).tournament || null }))
	add('live', async () => ({ pollTournament: (await api.tournament(true)).tournament || null }))
	add('live', async () => ({ chatActivity: await api.chatActivity() }))
	if (wanted.length) add('live', async () => ({ placeholders: await api.placeholders() }))
	add('discovery', async () => ({ overlayList: await api.overlays() }))
	add('discovery', async () => ({ matchupPresets: (await api.matchupPresets()).presets || [] }))
	add('discovery', async () => ({ pollPresets: (await api.pollPresets()).presets || [] }))
	add('discovery', async () => ({ tournamentPresets: (await api.tournamentPresets(false)).presets || [] }))
	add('discovery', async () => {
		const bot = await api.chatbot()
		const prefix = bot.settings?.prefix || '!'
		return {
			chatChoices: [
				...(bot.commands || []).map((c) => ({ id: c.name, label: `Command: ${prefix}${c.name}` })),
				...(bot.triggers || []).map((t) => ({ id: t.name || t.id, label: `Trigger: ${t.name || t.id}` })),
				...(bot.messages || []).map((m) => ({ id: m.name || m.id, label: `Timed: ${m.name || m.id}` })),
				...['quote', 'addquote', 'delquote'].map((n) => ({ id: n, label: `Command: ${prefix}${n}` })),
			],
		}
	})
	add('randomizer', async () => ({ randomizerPresets: (await api.randomizerPresets()).presets || [] }))
	add('discovery', async () => ({ randomizerButtonPresets: (await api.randomizerButtonPresets()).presets || [] }))
	add('tier', async () => {
		const tierList = await api.tierList()
		return { tierList, tierListPresets: tierList.presets || [] }
	})
	return jobs
}

async function overlayPatch(api, overlays, previousPages = {}, previousSpeakers = [], { speakers = false } = {}) {
	const pages = {}
	const badges = []
	const jobs = []
	for (const overlay of overlays) {
		if (overlay.pageCount > 0) {
			if (previousPages[overlay.id]) pages[overlay.id] = previousPages[overlay.id]
			jobs.push({
				run: async () => {
					pages[overlay.id] = { ...(await api.overlayPage(overlay.id)), overlayName: overlay.name }
					return {}
				},
			})
		}
		if (speakers && overlay.hasControls !== false) {
			jobs.push({
				run: async () => {
					try {
						const snapshot = await api.speakers(overlay.id)
						badges.push(
							...(snapshot.speakers || []).map((speaker) => ({
								...speaker,
								overlayId: overlay.id,
								overlayName: overlay.name,
								elementId: speaker.id,
							})),
						)
					} catch {
						badges.push(...previousSpeakers.filter((speaker) => speaker.overlayId === overlay.id))
					}
					return {}
				},
			})
		}
	}
	await collect(jobs)
	badges.sort((a, b) => `${a.overlayId}:${a.elementId}`.localeCompare(`${b.overlayId}:${b.elementId}`))
	return { pages, ...(speakers ? { speakers: badges } : {}) }
}

function choiceSignature(state) {
	return JSON.stringify([
		Object.values(state.timers).map((t) => [t.id, t.label]),
		state.goals.map((g) => [g.id, g.title]),
		state.rules.map((r) => [r.id, r.name]),
		...['slideshows', 'videos', 'cutouts'].map((key) =>
			(state[key] || []).map((item) => [item.overlayId, item.elementId, item.name]),
		),
		state.overlayVisibility.map((o) => [o.key, o.label]),
		(state.chatChoices || []).map((c) => [c.id, c.label]),
		Object.values(state.pages).map((p) => [p.id, p.overlayName, p.pages.map((x) => [x.id, x.name])]),
		...[
			'randomizerPresets',
			'randomizerButtonPresets',
			'pollPresets',
			'matchupPresets',
			'tournamentPresets',
			'tierListPresets',
		].map((key) => (state[key] || []).map((p) => [p.id, p.name || p.title])),
		(state.tierList?.items || []).map((item) => [item.id, item.name, item.tierId]),
		(state.tournament?.matches || []).map((m) => [
			m.id,
			typeof m.entrant1 === 'object' ? m.entrant1?.name : m.entrant1,
			typeof m.entrant2 === 'object' ? m.entrant2?.name : m.entrant2,
			m.status,
		]),
		(state.speakers || []).map((speaker) => [speaker.overlayId, speaker.overlayName, speaker.elementId, speaker.name]),
	])
}

module.exports = { collect, jobsFor, overlayPatch, choiceSignature }
