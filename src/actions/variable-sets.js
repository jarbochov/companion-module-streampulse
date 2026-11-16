const { setOption, trackerChoices, entryFieldChoices } = require('../variable-sets')

module.exports = function (self, run) {
	const text = (id, label, defaultValue = '') => ({
		id,
		type: 'textinput',
		label,
		default: defaultValue,
		useVariables: true,
	})
	const slot = (label = 'Slot number or name') => text('slot', label, '1')
	const entry = (label = 'Entry ID or label') => text('entry', label)
	const control = (set, action, body) => {
		if (!set) throw new Error('Select a Variable Set')
		return self.api.variableSetControl(set, action, body)
	}
	const call =
		(action, fields = []) =>
		async ({ options }) =>
			run(async () => {
				const body = {}
				for (const field of fields) body[field] = await self.parseVariablesInString(String(options[field] ?? ''))
				await control(options.set, action, body)
			})()
	const simple = (name, action, options = [], fields = []) => ({
		name: `Variable Set: ${name}`,
		description: `${name} for the selected Variable Set`,
		options: [setOption(self), ...options],
		callback: call(action, fields),
	})
	const mode = {
		id: 'mode',
		type: 'dropdown',
		label: 'Queue mode',
		default: 'shift',
		choices: [
			{ id: 'shift', label: 'Shift' },
			{ id: 'page', label: 'Page' },
		],
	}
	const queueMove = (name, action) => ({
		name: `Variable Set: ${name}`,
		description: `${name} for the selected Variable Set`,
		options: [setOption(self), mode],
		callback: async ({ options }) => run(() => control(options.set, action, { mode: options.mode }))(),
	})
	const rotation = (name, action) => simple(`Rotation ${name}`, `rotation/${action}`)
	const parsed = (value) => self.parseVariablesInString(String(value ?? ''))
	const parseJson = (value, label) => {
		try {
			return JSON.parse(value)
		} catch {
			throw new Error(`${label} must be valid JSON`)
		}
	}
	const object = (value, label) => {
		if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error(`${label} must be an object`)
		return value
	}
	const fieldValue = (set, kind, key, value, label) => {
		if (kind === 'property' && ['enabled', 'inGroup'].includes(key)) {
			if ([true, 'true', 1, '1'].includes(value)) return true
			if ([false, 'false', 0, '0'].includes(value)) return false
			throw new Error(`${label} must be true or false`)
		}
		const field = (set.fields || []).find((field) => (field.id || field.key) === key)
		if (kind === 'field' && !field) throw new Error(`Unknown entry field: ${key}`)
		if (field?.type === 'ref_list') {
			const items = typeof value === 'string' ? parseJson(value, label) : value
			if (!Array.isArray(items) || items.some((item) => typeof item !== 'string'))
				throw new Error(`${label} must be an array of entry IDs`)
			return items
		}
		if (field?.type === 'checklist') return object(value, label)
		if (value === null || typeof value === 'object') throw new Error(`${label} must be text, a number or a boolean`)
		// Set fields are stored as strings; roster flags are stored as booleans.
		return String(value)
	}
	const expected = async (options, body, normalize = (value) => value) => {
		const value = await parsed(options.expected)
		if (value.trim()) body.expected = normalize(parseJson(value, 'Expected value'))
	}
	const entryId = async (options) => {
		const id = await parsed(options.entry)
		if (!id.trim()) throw new Error('Enter an entry ID')
		return id
	}
	const entryField = (action) => {
		const numericOnly = action === 'step'
		const choices = entryFieldChoices(self.state.variableSets, numericOnly)
		const options = [
			{ id: 'field', type: 'dropdown', label: 'Set / field', choices, default: choices[0].id },
			entry('Entry ID'),
		]
		if (numericOnly) options.push(text('delta', 'Change', '1'))
		else {
			options.push(
				{
					id: 'format',
					type: 'dropdown',
					label: 'Value format',
					default: 'text',
					choices: [
						{ id: 'text', label: 'Text' },
						{ id: 'json', label: 'JSON (numbers, booleans, arrays or objects)' },
					],
				},
				text('value', 'Value'),
			)
		}
		options.push(text('expected', 'Expected current value (optional JSON)'))
		return {
			name: `Variable Set: ${numericOnly ? 'Step entry number' : 'Set entry field'}`,
			description: numericOnly ? 'Atomically add to a numeric entry field' : 'Set one entry field or property',
			options,
			callback: async ({ options }) =>
				run(async () => {
					const choice = entryFieldChoices(self.state.variableSets, numericOnly).find(
						(candidate) => candidate.id === options.field,
					)
					if (!choice?.id) throw new Error('Select an available entry field')
					const [set, kind, field] = JSON.parse(choice.id)
					const setObj = self.state.variableSets.find((candidate) => candidate.id === set)
					const body = { entry: await entryId(options), [kind]: field }
					if (numericOnly) {
						const delta = await parsed(options.delta)
						if (!delta.trim() || !Number.isFinite(Number(delta))) throw new Error('Change must be a number')
						body.delta = Number(delta)
					} else {
						const value = await parsed(options.value)
						if (options.format === 'text') body.value = fieldValue(setObj, kind, field, value, 'Value')
						else if (options.format === 'json')
							body.value = fieldValue(setObj, kind, field, parseJson(value, 'Value'), 'Value')
						else throw new Error('Select a value format')
					}
					await expected(options, body, (value) => fieldValue(setObj, kind, field, value, 'Expected value'))
					await control(set, `entry/${action}`, body)
				})(),
		}
	}
	const entryUpdate = {
		name: 'Variable Set: Update entry',
		description: 'Atomically update one entry using a JSON patch and optional expected whole entry',
		options: [
			setOption(self),
			entry('Entry ID'),
			text('patch', 'Entry patch (JSON object)', '{"values":{}}'),
			text('expected', 'Expected whole entry (optional JSON object)'),
		],
		callback: async ({ options }) =>
			run(async () => {
				const set = (self.state.variableSets || []).find((candidate) => candidate.id === options.set)
				if (!set) throw new Error('Select an available Variable Set')
				const patch = object(parseJson(await parsed(options.patch), 'Entry patch'), 'Entry patch')
				for (const key of Object.keys(patch)) {
					if (!['label', 'enabled', 'inGroup', 'values', 'tiers'].includes(key))
						throw new Error(`Unsupported entry patch property: ${key}`)
				}
				if (Object.hasOwn(patch, 'values')) {
					object(patch.values, 'Entry values')
					for (const key of Object.keys(patch.values)) {
						patch.values[key] = fieldValue(set, 'field', key, patch.values[key], `Value for ${key}`)
					}
				}
				for (const key of ['label', 'enabled', 'inGroup']) {
					if (Object.hasOwn(patch, key)) patch[key] = fieldValue(set, 'property', key, patch[key], key)
				}
				if (Object.hasOwn(patch, 'tiers') && !Array.isArray(patch.tiers)) throw new Error('Tiers must be an array')
				const body = { entry: await entryId(options), patch }
				await expected(options, body, (value) => object(value, 'Expected whole entry'))
				await control(options.set, 'entry/update', body)
			})(),
	}
	const entryAdd = {
		name: 'Variable Set: Add entry',
		description: 'Add a roster entry with an optional JSON object for additional values and tiers',
		options: [
			setOption(self),
			entry('Entry ID'),
			text('label', 'Label'),
			text('details', 'Additional entry properties (optional JSON object)'),
		],
		callback: async ({ options }) =>
			run(async () => {
				const details = await parsed(options.details)
				const data = details.trim() ? parseJson(details, 'Additional entry properties') : {}
				if (!data || Array.isArray(data) || typeof data !== 'object')
					throw new Error('Additional entry properties must be an object')
				const body = { entry: { ...data, id: await entryId(options), label: await parsed(options.label) } }
				await control(options.set, 'entry/add', body)
			})(),
	}
	const entryRemove = {
		name: 'Variable Set: Remove entry',
		description: 'Remove a roster entry when it has no blocking dependencies',
		options: [
			setOption(self),
			entry('Entry ID'),
			text('expected', 'Expected whole entry (optional JSON object)'),
			{ id: 'confirm', type: 'checkbox', label: 'Confirm removal', default: false },
		],
		callback: async ({ options }) =>
			run(async () => {
				if (!options.confirm) throw new Error('Confirm entry removal')
				const body = { entry: await entryId(options) }
				await expected(options, body, (value) => object(value, 'Expected whole entry'))
				await control(options.set, 'entry/remove', body)
			})(),
	}
	const tracker = (name, action, withTarget = true) => {
		const choices = trackerChoices(self.state.variableSets, withTarget)
		const scopes = [
			{ id: 'entry', label: 'Entry ID' },
			{ id: 'slot', label: 'Current entry in slot' },
		]
		if (!withTarget) scopes.push({ id: 'all', label: 'All entries' })
		const owner = text('owner', 'Entry ID or slot number/name')
		owner.isVisible = (options) => options.scope !== 'all'
		const options = [
			{
				id: 'tracker',
				type: 'dropdown',
				label: withTarget ? 'Tracker item' : 'Tracker',
				choices,
				default: choices[0].id,
			},
			{ id: 'scope', type: 'dropdown', label: 'Owner', choices: scopes, default: 'entry' },
			owner,
		]
		if (action === 'set') options.push(text('value', 'Level', '1'))
		if (action === 'step') options.push(text('delta', 'Level change', '1'))
		return {
			name: `Variable Set: Tracker ${name}`,
			description: `${name} a tracker for an entry or the current entry in a slot`,
			options,
			callback: async ({ options }) =>
				run(async () => {
					const selected = trackerChoices(self.state.variableSets, withTarget).find(
						(choice) => choice.id === options.tracker,
					)
					if (!selected || !selected.id) throw new Error('Select an available tracker' + (withTarget ? ' item' : ''))
					const [set, field, target] = JSON.parse(selected.id)
					const body = { field }
					if (withTarget) body.target = target
					if (options.scope === 'all' && !withTarget) {
						body.all = true
					} else if (options.scope === 'entry' || options.scope === 'slot') {
						const owner = await self.parseVariablesInString(String(options.owner ?? ''))
						if (!owner.trim()) throw new Error('Enter an owner entry ID or slot')
						body[options.scope] = owner
					} else {
						throw new Error('Select an owner')
					}
					for (const key of action === 'set' ? ['value'] : action === 'step' ? ['delta'] : []) {
						const value = await self.parseVariablesInString(String(options[key] ?? ''))
						if (!value.trim() || !Number.isInteger(Number(value))) throw new Error(`${key} must be an integer`)
						body[key] = Number(value)
					}
					await control(set, `checklist/${action}`, body)
				})(),
		}
	}
	return {
		variable_set_assign: simple('Assign entry', 'assign', [slot(), entry()], ['slot', 'entry']),
		variable_set_clear: simple('Clear slot', 'clear', [slot('Slot number, name or all')], ['slot']),
		variable_set_next: simple('Next entry', 'next', [slot()], ['slot']),
		variable_set_prev: simple('Previous entry', 'prev', [slot()], ['slot']),
		variable_set_advance: queueMove('Advance queue', 'advance'),
		variable_set_rewind: queueMove('Rewind queue', 'rewind'),
		variable_set_swap: simple(
			'Swap slots',
			'swap',
			[text('from', 'From slot number or name', '1'), text('to', 'To slot number or name', '2')],
			['from', 'to'],
		),
		variable_set_entry_set: entryField('set'),
		variable_set_entry_update: entryUpdate,
		variable_set_entry_step: entryField('step'),
		variable_set_entry_add: entryAdd,
		variable_set_entry_remove: entryRemove,
		variable_set_entry_toggle: {
			name: 'Variable Set: Toggle or set entry enabled',
			description: 'Toggle, enable or disable a roster entry for cycling and rotation',
			options: [
				setOption(self),
				entry('Entry ID'),
				{
					id: 'enabled',
					type: 'dropdown',
					label: 'Enabled',
					default: 'toggle',
					choices: [
						{ id: 'toggle', label: 'Toggle' },
						{ id: 'true', label: 'Enable' },
						{ id: 'false', label: 'Disable' },
					],
				},
			],
			callback: async ({ options }) =>
				run(async () => {
					const body = { entry: await self.parseVariablesInString(options.entry || '') }
					if (options.enabled !== 'toggle') body.enabled = options.enabled === 'true'
					await control(options.set, 'entry/toggle', body)
				})(),
		},
		variable_set_queue_add: simple(
			'Add entry to slot queue',
			'queue/add',
			[slot(), entry('Entry ID')],
			['slot', 'entry'],
		),
		variable_set_queue_remove: simple(
			'Remove entry from slot queue',
			'queue/remove',
			[slot(), text('index', 'Queue index (zero-based)', '0')],
			['slot', 'index'],
		),
		variable_set_queue_clear: simple('Clear slot queue', 'queue/clear', [slot('Slot number, name or all')], ['slot']),
		variable_set_rotation_start: rotation('start', 'start'),
		variable_set_rotation_stop: rotation('stop', 'stop'),
		variable_set_rotation_toggle: rotation('toggle', 'toggle'),
		variable_set_rotation_next: rotation('next', 'next'),
		variable_set_rotation_prev: rotation('previous', 'prev'),
		variable_set_tracker_set: tracker('set level', 'set'),
		variable_set_tracker_toggle: tracker('toggle', 'toggle'),
		variable_set_tracker_step: tracker('step level', 'step'),
		variable_set_tracker_reset: tracker('reset', 'reset', false),
		variable_set_rotation_configure: {
			name: 'Variable Set: Configure rotation',
			description: 'Set the shared rotation interval and selection mode',
			options: [
				setOption(self),
				{ id: 'intervalSeconds', type: 'number', label: 'Interval (seconds)', default: 30, min: 1, max: 86400 },
				{
					id: 'mode',
					type: 'dropdown',
					label: 'Mode',
					default: 'sequential',
					choices: [
						{ id: 'sequential', label: 'Sequential' },
						{ id: 'random', label: 'Random' },
					],
				},
			],
			callback: async ({ options }) =>
				run(() => control(options.set, 'rotation', { intervalSeconds: options.intervalSeconds, mode: options.mode }))(),
		},
	}
}
