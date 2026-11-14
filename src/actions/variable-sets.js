const { setOption } = require('../variable-sets')

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
