settings.mode    = false;
settings.drawing = false;

settings.controller = {
	grid : {
		rows    : 8,
		columns : 8,
	},

	selection : {},
};

WebMidi.enable(err => {
	if (err) {
		console.log('WebMidi could not be enabled.', err);
	}

	input  = WebMidi.getInputByName('Launchpad Pro Standalone Port');
	output = WebMidi.getOutputByName('Launchpad Pro Standalone Port');

	const setLED = (led, r, g, b) => {
		output.sendSysex([0x00, 0x20, 0x29], [0x02, 0x10, 0x0B, led, r, g, b]);
	}

	const setGrid = data => {
		output.sendSysex([0x00, 0x20, 0x29], flatten([0x02, 0x10, 0x0F, 1, data]));
	}

	const updateGrid = () => {
		setGrid(convertGrid());
		setTimeout(updateGrid, 10);
	}

	setLED(80, 0, 0, 0);
	updateGrid();

	input.addListener('controlchange', 'all', e => {
		if (e.controller.number == 80 && e.value == 127) {
			settings.mode = ! settings.mode;

			if (settings.mode) {
				setLED(80, 63, 0, 0);
			} else {
				setLED(80, 0, 0, 0);
			}
		}
	});

	input.addListener('noteon',  'all', e => note(e.note.number, true));
	input.addListener('noteoff', 'all', e => note(e.note.number, false));

}, true);

const note = (number, direction) => {
	if (settings.mode) {
		if (! settings.drawing) {
			if (direction) {
				settings.drawing = true;
				settings.controller.selection.start = controllerCoordinates(number);
			} else {
				selectAll();
				freeze(false);
			}
		} else {
			settings.drawing = false;
			settings.controller.selection.end = controllerCoordinates(number);
			settings.selection = convertSelection(settings.controller.selection);

			if (direction) {
				seed(true);
			} else {
				freeze(false);
			}
		}
	} else {
		settings.controller.selection.end = settings.controller.selection.start = controllerCoordinates(number);
		settings.selection = convertSelection(settings.controller.selection);

		if (direction) {
			seed(true);
		} else {
			freeze(false);
		}
	}
}

const controllerCoordinates = n => {
	return {
		row    : settings.controller.grid.rows - Math.floor(n / 10),
		column : n % 10 - 1,
	};
}

const convertSelection = selection => {
	let {
		start : {
			column : x1,
			row    : y1,
		},
		end : {
			column : x2,
			row    : y2,
		},
	} = selection;

	[x1, x2] = [x1, x2].sort(sortNumbers);
	[y1, y2] = [y1, y2].sort(sortNumbers);

	return {
		start : {
			column : constrain(Math.round(settings.grid.columns / settings.controller.grid.columns * x1), 0, settings.grid.columns - 1),
			row    : constrain(Math.round(settings.grid.rows    / settings.controller.grid.rows    * y1), 0, settings.grid.rows    - 1),
		},
		end : {
			column : constrain(Math.round(settings.grid.columns / settings.controller.grid.columns * (x2 + 1)), 0, settings.grid.columns - 1),
			row    : constrain(Math.round(settings.grid.rows    / settings.controller.grid.rows    * (y2 + 1)), 0, settings.grid.rows    - 1),
		},
	};
}

const convertGrid = () => {
	const data = create2DArray(settings.controller.grid.rows, settings.controller.grid.columns);

	for (let y = 0; y < settings.controller.grid.rows; y++) {
		for (let x = 0; x < settings.controller.grid.columns; x++) {
			let selection = {
				start : {
					column : x,
					row    : y,
				},
				end : {
					column : x,
					row    : y,
				},
			};

			selection = convertSelection(selection);

			const average = averageColor(selection);

			let [r, g, b] = [red(average), green(average), blue(average)];

			[r, g, b] = [r, g, b].map(x => linlin(x, 0, 255, 0, 63));

			data[settings.controller.grid.rows - y - 1][x] = [r, g, b];
		}
	}

	return data;
}

const averageColor = selection => {
	const {
		start : {
			column : x1,
			row    : y1,
		},
		end : {
			column : x2,
			row    : y2,
		},
	} = selection;

	const hsb = {
		h : [],
		s : [],
		b : [],
	};

	for (let y = y1; y < y2 + 1; y++) {
		for (let x = x1; x < x2 + 1; x++) {
			hsb.h.push(settings.cells[y][x].color.h);
			hsb.s.push(settings.cells[y][x].color.s);
			hsb.b.push(settings.cells[y][x].color.b);
		}
	}

	hsb.s = hsb.s.map(x => linlin(x, 0, 100, 50, 100));

	const [h, s, b] = [hsb.h, hsb.s, hsb.b].map(x => mean(x));

	return colorFromHSB({h, s, b});
}

const selectAll = () => {
	settings.selection = {
		start : {
			column : 0,
			row    : 0,
		},
		end : {
			column : settings.grid.columns - 1,
			row    : settings.grid.rows    - 1,
		},
	};
}

const mean = array => array.reduce((a, b) => a + b) / array.length