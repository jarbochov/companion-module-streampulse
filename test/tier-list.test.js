const assert = require('node:assert/strict')
const { test } = require('node:test')
const defineActions = require('../src/actions')
const defineFeedbacks = require('../src/feedbacks')
const definePresets = require('../src/presets')
const { updateVariables, defineVariables } = require('../src/variables')

function createModuleMock() {
	const self = {
		state: {
			timers: {},
			goals: [],
			rules: [],
			chatChoices: [],
			randomizerPresets: [],
			overlayVisibility: [],
			pages: {},
			slideshows: [],
			videos: [],
			cutouts: [],
			status: null,
			alerts: null,
			tierList: {
				title: 'Retro Games Tier List',
				items: [
					{ id: 'item-1', name: 'Chrono Trigger', tierId: null },
					{ id: 'item-2', name: 'Super Metroid', tierId: 's' },
				],
				tiers: [
					{ id: 's', label: 'S', color: '#ff7f7f' },
					{ id: 'a', label: 'A', color: '#ffbf7f' },
				],
				presets: [
					{ id: 'preset-standard', name: 'Standard S-F' },
					{ id: 'preset-retro', name: 'Retro Essentials' },
				],
				activeVote: {
					itemId: 'item-1',
					itemName: 'Chrono Trigger',
					status: 'ACTIVE',
					endsAt: Date.now() + 45000,
					consensus: {
						totalVotes: 15,
						consensusTier: { label: 'S' },
						agreementPercent: 80,
					},
				},
			},
			tierListPresets: [
				{ id: 'preset-standard', name: 'Standard S-F' },
				{ id: 'preset-retro', name: 'Retro Essentials' },
			],
		},
		api: {
			tierListStartVote: async (params) => {
				self.startVoteParams = params
			},
			tierListLockVote: async () => {
				self.lockVoteCalled = true
			},
			tierListEndVote: async (apply) => {
				self.endVoteApply = apply
			},
			tierListCancelVote: async () => {
				self.cancelVoteCalled = true
			},
			tierListReset: async () => {
				self.resetCalled = true
			},
			tierListLoadPreset: async (id) => {
				self.loadedPresetId = id
			},
			alertTestWebhook: async (url, method) => {
				self.webhookCalled = { url, method }
			},
		},
		async parseVariablesInString(value) {
			return value
		},
		setActionDefinitions(definitions) {
			self.actions = definitions
		},
		setFeedbackDefinitions(definitions) {
			self.feedbacks = definitions
		},
		setPresetDefinitions(definitions) {
			self.presets = definitions
		},
		setVariableDefinitions(definitions) {
			self.variableDefinitions = definitions
		},
		setVariableValues(values) {
			self.variableValues = values
		},
		checkFeedbacks() {},
		async poll() {},
		logs: [],
		log(level, message) {
			self.logs.push({ level, message })
		},
	}
	return self
}

test('Tier Maker: Companion actions invoke StreamPulse API endpoints', async () => {
	const self = createModuleMock()
	defineActions(self)

	// tier_vote_start
	const startAction = self.actions.tier_vote_start
	assert.ok(startAction, 'tier_vote_start action must exist')
	await startAction.callback({ options: { item: 'item-1', duration: 45, mode: 'weighted_mean' } })
	assert.deepEqual(self.startVoteParams, { itemId: 'item-1', duration: 45, mode: 'weighted_mean' })

	// tier_vote_lock
	const lockAction = self.actions.tier_vote_lock
	assert.ok(lockAction, 'tier_vote_lock action must exist')
	await lockAction.callback({ options: {} })
	assert.equal(self.lockVoteCalled, true)

	// tier_vote_end (apply)
	const endAction = self.actions.tier_vote_end
	assert.ok(endAction, 'tier_vote_end action must exist')
	await endAction.callback({ options: { apply: 'true' } })
	assert.equal(self.endVoteApply, true)

	// tier_vote_end (discard)
	await endAction.callback({ options: { apply: 'false' } })
	assert.equal(self.endVoteApply, false)

	// tier_vote_cancel
	const cancelAction = self.actions.tier_vote_cancel
	assert.ok(cancelAction, 'tier_vote_cancel action must exist')
	await cancelAction.callback({ options: {} })
	assert.equal(self.cancelVoteCalled, true)

	// tier_reset_placements (without confirm)
	const resetAction = self.actions.tier_reset_placements
	await resetAction.callback({ options: { confirm: false } })
	assert.equal(self.resetCalled, undefined)
	assert.ok(self.logs.some((l) => l.level === 'warn'))

	// tier_reset_placements (confirmed)
	await resetAction.callback({ options: { confirm: true } })
	assert.equal(self.resetCalled, true)

	// tier_load_preset (confirmed)
	const loadAction = self.actions.tier_load_preset
	await loadAction.callback({ options: { preset: 'preset-retro', confirm: true } })
	assert.equal(self.loadedPresetId, 'preset-retro')

	// alert_test_webhook
	const webhookAction = self.actions.alert_test_webhook
	assert.ok(webhookAction, 'alert_test_webhook action must exist')
	await webhookAction.callback({ options: { url: 'http://127.0.0.1:8000/api/location/1/0/0/press/', method: 'POST' } })
	assert.deepEqual(self.webhookCalled, { url: 'http://127.0.0.1:8000/api/location/1/0/0/press/', method: 'POST' })
})

test('Tier Maker: Feedbacks and Variables expose live voting state', async () => {
	const self = createModuleMock()
	await defineFeedbacks(self)
	defineVariables(self)
	updateVariables(self)

	// Variables check
	assert.equal(self.variableValues.tier_voting, 'yes')
	assert.equal(self.variableValues.tier_vote_status, 'active')
	assert.equal(self.variableValues.tier_item, 'Chrono Trigger')
	assert.equal(self.variableValues.tier_votes, '15')
	assert.equal(self.variableValues.tier_consensus, 'S')
	assert.equal(self.variableValues.tier_agreement, '80%')
	assert.equal(self.variableValues.tier_title, 'Retro Games Tier List')

	// Feedbacks check
	assert.equal(self.feedbacks.tier_voting_active.callback(), true)
	assert.equal(self.feedbacks.tier_vote_locked.callback(), false)
	assert.equal(self.feedbacks.tier_consensus_tier.callback({ options: { tier: 'S' } }), true)
	assert.equal(self.feedbacks.tier_consensus_tier.callback({ options: { tier: 'A' } }), false)

	// Simulate locked state
	self.state.tierList.activeVote.status = 'LOCKED'
	assert.equal(self.feedbacks.tier_voting_active.callback(), false)
	assert.equal(self.feedbacks.tier_vote_locked.callback(), true)
})

test('Tier Maker: Companion presets are defined in the Tier Maker category', () => {
	const self = createModuleMock()
	definePresets(self)

	assert.ok(self.presets.tier_vote_start, 'tier_vote_start preset must exist')
	assert.equal(self.presets.tier_vote_start.category, 'Tier Maker')
	assert.ok(self.presets.tier_vote_lock, 'tier_vote_lock preset must exist')
	assert.equal(self.presets.tier_vote_lock.category, 'Tier Maker')
	assert.ok(self.presets.tier_vote_place, 'tier_vote_place preset must exist')
	assert.equal(self.presets.tier_vote_place.category, 'Tier Maker')
	assert.ok(self.presets.tier_vote_cancel, 'tier_vote_cancel preset must exist')
	assert.equal(self.presets.tier_vote_cancel.category, 'Tier Maker')
})

test('Action Search Organization: All actions have clear category prefixes and are logically grouped', () => {
	const self = createModuleMock()
	defineActions(self)

	const actionEntries = Object.entries(self.actions)
	assert.equal(actionEntries.length >= 50, true, 'Must have at least 50 organized actions')

	// Verify all actions have a prefix followed by colon
	for (const [id, def] of actionEntries) {
		assert.ok(
			def.name && def.name.includes(':'),
			`Action "${id}" name "${def.name}" must contain a category prefix followed by colon`,
		)
	}

	// Verify contiguous grouping: actions with the same prefix must not be interrupted by different prefixes
	const prefixSequence = []
	for (const [, def] of actionEntries) {
		const prefix = def.name.split(':')[0].trim()
		if (prefixSequence.length === 0 || prefixSequence[prefixSequence.length - 1] !== prefix) {
			prefixSequence.push(prefix)
		}
	}

	// Every category must appear only once in the sequence (contiguous grouping)
	const uniquePrefixes = new Set(prefixSequence)
	assert.equal(
		prefixSequence.length,
		uniquePrefixes.size,
		`Categories in action definitions must be contiguous! Observed sequence: ${prefixSequence.join(' -> ')}`,
	)
})
