WebMidi.enable(err => {
	if (err) {
		console.log('WebMidi could not be enabled.', err);
	}

	settings.midi = {
		input  : WebMidi.getInputByName('Launchpad Pro Standalone Port'),
		output : WebMidi.getOutputByName('Launchpad Pro Standalone Port'),
	};

	const setLED = (led, r, g, b) => {
		settings.midi.output.sendSysex([0x00, 0x20, 0x29], [0x02, 0x10, 0x0B, led, r, g, b]);
	}

	const setGrid = data => {
		settings.midi.output.sendSysex([0x00, 0x20, 0x29], f.flatten([0x02, 0x10, 0x0F, 1, data]));
	}

	const updateGrid = () => {
		setGrid(convertGrid());
		setTimeout(updateGrid, 10);
	}

	setLED(80, 0, 0, 0);
	updateGrid();

	settings.midi.input.addListener('controlchange', 'all', e => {
		if (e.controller.number == 80 && e.value == 127) {
			settings.mode = ! settings.mode;

			if (settings.mode) {
				setLED(80, 63, 0, 0);
			} else {
				setLED(80, 0, 0, 0);
			}
		}
	});

	settings.midi.input.addListener('noteon',  'all', e => note(e.note.number, true));
	settings.midi.input.addListener('noteoff', 'all', e => note(e.note.number, false));
}, true);