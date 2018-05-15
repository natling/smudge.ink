settings = {
	... settings,

	... {
		mode    : false,
		drawing : false,

		controller : {
			grid : {
				rows    : 8,
				columns : 8,
			},

			selection : {},
		},
	},
};

WebMidi.enable(function (err) {
	if (err) {
		console.log('WebMidi could not be enabled.', err);
	}

	input  = WebMidi.getInputByName('Launchpad Pro Standalone Port');
	output = WebMidi.getOutputByName('Launchpad Pro Standalone Port');

	setLED(80, 0, 0, 0);
	updateGrid();

	input.addListener('controlchange', 'all', function(e) {
		if (e.controller.number == 80 && e.value == 127) {
			settings.mode = ! settings.mode;

			if (settings.mode) {
				setLED(80, 63, 0, 0);
			} else {
				setLED(80, 0, 0, 0);
			}
		}
	});

	input.addListener('noteon', 'all', function(e) {
		note(e.note.number, true);
	});

	input.addListener('noteoff', 'all', function(e) {
		note(e.note.number, false);
	});

	function setLED(led, r, g, b) {
		output.sendSysex([0x00, 0x20, 0x29], [0x02, 0x10, 0x0B, led, r, g, b]);
	}

	function setGrid(data) {
		output.sendSysex([0x00, 0x20, 0x29], flatten([0x02, 0x10, 0x0F, 1, data]));
	}

	function updateGrid() {
		setGrid(convertGrid());
		setTimeout(updateGrid, 10);
	}
}, true);

function note(number, direction) {
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

function controllerCoordinates(n) {
	return {
		row    : settings.controller.grid.rows - Math.floor(n / 10),
		column : n % 10 - 1,
	};
}

function convertSelection(selection) {
	var {
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

function convertGrid() {
	var data = create2DArray(settings.controller.grid.rows, settings.controller.grid.columns);

	for (var y = 0; y < settings.controller.grid.rows; y++) {
		for (var x = 0; x < settings.controller.grid.columns; x++) {
			var selection = {
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

			var average = averageColor(selection);

			var [r, g, b] = [red(average), green(average), blue(average)];

			[r, g, b] = [r, g, b].map(x => linlin(x, 0, 255, 0, 63));

			data[settings.controller.grid.rows - y - 1][x] = [r, g, b];
		}
	}

	return data;
}

function averageColor(selection) {
	var {
		start : {
			column : x1,
			row    : y1,
		},
		end : {
			column : x2,
			row    : y2,
		},
	} = selection;

	var hsb = {
		h : [],
		s : [],
		b : [],
	};

	for (var y = y1; y < y2 + 1; y++) {
		for (var x = x1; x < x2 + 1; x++) {
			hsb.h.push(cells[y][x].color.h);
			hsb.s.push(cells[y][x].color.s);
			hsb.b.push(cells[y][x].color.b);
		}
	}

	hsb.s = hsb.s.map(x => linlin(x, 0, 100, 50, 100));

	var [h, s, b] = [hsb.h, hsb.s, hsb.b].map(x => mean(x));

	return colorFromHSB({h, s, b});
}

function selectAll() {
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

function mean(array) {
	return array.reduce((a, b) => a + b) / array.length;
}