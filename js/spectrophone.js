const spectrophone = {
	palette : {
		black   : [   0,   0,   0 ],
		red     : [ 255,   0,   0 ],
		green   : [   0, 255,   0 ],
		blue    : [   0,   0, 255 ],
		cyan    : [   0, 255, 255 ],
		magenta : [ 255,   0, 255 ],
		yellow  : [ 255, 255,   0 ],
		white   : [ 255, 255, 255 ],
	},
};

spectrophone.sketch = sketch => {
	sketch.setup = () => {
		for (const color in spectrophone.palette) {
			spectrophone.palette[color] = sketch.color(spectrophone.palette[color]);
		}
	}
}

spectrophone.p5 = new p5(spectrophone.sketch);

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

	const clearGrid = () => {
		const data = Array.from({length: 10}, () => Array.from({length: 10}, () => [0, 0, 0]));
		settings.midi.output.sendSysex([0x00, 0x20, 0x29], f.flatten([0x02, 0x10, 0x0F, 0, data]));
	}

	const updateGrid = () => {
		setGrid(convertGrid());
		setTimeout(updateGrid, 10);
	}

	clearGrid();
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

	Object.values(spectrophone.palette).forEach((color, i) => {
		const button = (8 - i) * 10 + 9;

		setLED(button, ...[red, green, blue]
			.map(property => property(color))
			.map(x => f.linlin(x, 0, 255, 0, 63))
		);

		settings.midi.input.addListener('controlchange', 'all', e => {
			if (e.controller.number == button && e.value == 127) {
				spectrophone.selectedColor = color;
			}
		});
	});

	spectrophone.selectedColor = spectrophone.palette.black;

	settings.midi.input.addListener('noteon',  'all', e => note(e.note.number, true));
	settings.midi.input.addListener('noteoff', 'all', e => note(e.note.number, false));
}, true);

seed = frozen => {
	let {
		start : {
			column : x1,
			row    : y1,
		},
		end : {
			column : x2,
			row    : y2,
		},
	} = settings.selection;

	[x1, x2] = [x1, x2].sort(f.sortNumbers);
	[y1, y2] = [y1, y2].sort(f.sortNumbers);

	const [h, s, b] = [hue, saturation, brightness].map(property => property(spectrophone.selectedColor));

	for (let y = y1; y < y2 + 1; y++) {
		for (let x = x1; x < x2 + 1; x++) {
			Object.assign(settings.cells[y][x].color, {h, s, b});
			settings.cells[y][x].frozen = frozen;
		}
	}
}