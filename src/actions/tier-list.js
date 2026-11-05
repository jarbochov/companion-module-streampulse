const tierItemChoices = (self) => {
	const items = (self.state.tierList && self.state.tierList.items) || []
	const unranked = items.filter((it) => !it.tierId)
	const list = (unranked.length ? unranked : items).map((it) => ({
		id: it.id,
		label: `${it.name || it.id}${it.tierId ? ' (Ranked)' : ''}`,
	}))
	return [{ id: '', label: '(Next unranked item)' }, ...list]
}

const tierPresetChoices = (self) => {
	const list = (self.state.tierListPresets || (self.state.tierList && self.state.tierList.presets) || []).map((p) => ({
		id: p.id,
		label: p.name || p.title || p.id,
	}))
	return list.length ? list : [{ id: '', label: '(no presets found)' }]
}

module.exports = function (self, run) {
	return {
		tier_vote_start: {
			name: 'Tier Maker: Start voting on item',
			description: 'Start live chat voting on an item (auto-selects next unranked item if omitted)',
			options: [
				{
					id: 'item',
					type: 'dropdown',
					label: 'Item to rank',
					choices: tierItemChoices(self),
					default: '',
				},
				{
					id: 'duration',
					type: 'number',
					label: 'Duration in seconds (0 = open until stopped)',
					default: 60,
					min: 0,
					max: 3600,
				},
				{
					id: 'mode',
					type: 'dropdown',
					label: 'Consensus calculation mode',
					choices: [
						{ id: '', label: '(Inherit Tier List default)' },
						{ id: 'weighted_mean', label: 'Weighted Mean (Recommended)' },
						{ id: 'plurality', label: 'Simple Plurality (Most votes)' },
						{ id: 'supermajority', label: 'Supermajority (60%+)' },
					],
					default: '',
				},
			],
			callback: async ({ options }) =>
				run(() => {
					const params = {}
					if (options.item) params.itemId = options.item
					if (options.duration !== undefined) params.duration = Number(options.duration)
					if (options.mode) params.mode = options.mode
					return self.api.tierListStartVote(params)
				})(),
		},
		tier_vote_lock: {
			name: 'Tier Maker: Lock voting (freeze votes without placing)',
			description: 'Close voting and freeze chat votes while keeping consensus displayed for discussion',
			options: [],
			callback: async () => run(() => self.api.tierListLockVote())(),
		},
		tier_vote_end: {
			name: 'Tier Maker: End vote & place into consensus tier',
			description: 'Conclude vote and place the item into its audience consensus tier or discard',
			options: [
				{
					id: 'apply',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'true', label: 'Lock & Place into consensus tier' },
						{ id: 'false', label: 'End voting without placing' },
					],
					default: 'true',
				},
			],
			callback: async ({ options }) => run(() => self.api.tierListEndVote(options.apply !== 'false'))(),
		},
		tier_vote_cancel: {
			name: 'Tier Maker: Cancel active vote',
			description: 'Cancel the active item vote immediately without placing it',
			options: [],
			callback: async () => run(() => self.api.tierListCancelVote())(),
		},
		tier_reset_placements: {
			name: 'Tier Maker: Reset item placements',
			description: 'Move all placed items back to the unranked queue',
			options: [
				{
					id: 'confirm',
					type: 'checkbox',
					label: 'I confirm resetting all placed items back to unranked',
					default: false,
				},
			],
			callback: async ({ options }) => {
				if (!options.confirm) {
					self.log('warn', 'Tier Maker reset cancelled: confirmation box was not checked')
					return
				}
				return run(() => self.api.tierListReset())()
			},
		},
		tier_load_preset: {
			name: 'Tier Maker: Load template preset',
			description: 'Load a saved tier list template preset',
			options: [
				{
					id: 'preset',
					type: 'dropdown',
					label: 'Preset',
					choices: tierPresetChoices(self),
					default: (tierPresetChoices(self)[0] || {}).id,
				},
				{
					id: 'confirm',
					type: 'checkbox',
					label: 'I confirm loading this preset replaces current tiers and items',
					default: false,
				},
			],
			callback: async ({ options }) => {
				if (!options.confirm) {
					self.log('warn', 'Tier Maker load preset cancelled: confirmation box was not checked')
					return
				}
				if (!options.preset) return
				return run(() => self.api.tierListLoadPreset(options.preset))()
			},
		},
	}
}
