const settings = {
	grid : {
		scale : 10,
	},

	checkerboard : true,

	loop      : true,
	highlight : false,
	readout   : false,

	selection : {},

	interpolationProbability : {
		value           :   1.0,
		min             :   0.0,
		max             :   1.0,
		walkProbability :   0.1,
		walkStep        :   0.2,
		walkType        : 'float',
	},

	minS : {
		value           :   0,
		min             :   0,
		max             : 100,
		walkProbability :   0.1,
		walkStep        :  10,
		walkType        : 'int',
	},

	maxS : {
		value           : 100,
		min             :   0,
		max             : 100,
		walkProbability :   0.1,
		walkStep        :  10,
		walkType        : 'int',
	},

	minB : {
		value           :   0,
		min             :   0,
		max             : 100,
		walkProbability :   0.1,
		walkStep        :  10,
		walkType        : 'int',
	},

	maxB : {
		value           : 100,
		min             :   0,
		max             : 100,
		walkProbability :   0.1,
		walkStep        :  10,
		walkType        : 'int',
	},
};

setup = () => {
	createCanvas(windowWidth, windowHeight);
	colorMode(HSB);
	cursor(CROSS);

	background(0);

	noStroke();

	textFont('Menlo', 12);
	textAlign(LEFT, TOP);

	createGrid();
}

draw = () => {
	if (settings.loop) {
		advanceFrame();
	}

	displayGrid();

	if (settings.readout) {
		readout();
	}

	if (settings.highlight) {
		highlight();
	}
}

const advanceFrame = () => {
	interpolateGrid();
	walk();
}

const createGrid = () => {
	settings.grid.rows    = Math.round(height / settings.grid.scale);
	settings.grid.columns = Math.round(width  / settings.grid.scale);

	settings.cells = create2DArray(settings.grid.rows, settings.grid.columns);

	for (let y = 0; y < settings.grid.rows; y++) {
		for (let x = 0; x < settings.grid.columns; x++) {
			const coordinates = {x, y};

			const color = {
				h : randomIntegerInclusive(0, 360),
				s : randomIntegerInclusive(settings.minS.value, settings.maxS.value),
				b : 0,
			};

			settings.cells[y][x] = new Cell(coordinates, color);
		}
	}
}

const displayGrid = () => {
	for (let y = 0; y < settings.grid.rows; y++) {
		for (let x = 0; x < settings.grid.columns; x++) {
			settings.cells[y][x].display();
		}
	}
}

const interpolateGrid = () => {
	for (let y = 0; y < settings.grid.rows; y++) {
		for (let x = 0; x < settings.grid.columns; x++) {
			if (! settings.cells[y][x].frozen) {
				if (coin(settings.interpolationProbability.value)) {
					settings.cells[y][x].interpolate();
				}
			}
		}
	}
}

const walk = () => {
	for (parameter in settings) {
		if (settings.hasOwnProperty(parameter)) {
			if (settings[parameter].hasOwnProperty('walkProbability')) {
				if (coin(settings[parameter].walkProbability)) {
					if (settings[parameter].walkType == 'int') {
						settings[parameter].value = randomWalkInteger(settings[parameter].value, settings[parameter].min, settings[parameter].max, settings[parameter].walkStep);
					} else if (settings[parameter].walkType == 'float') {
						settings[parameter].value = randomWalkFloat(settings[parameter].value, settings[parameter].min, settings[parameter].max, settings[parameter].walkStep);
					}
				}
			}
		}
	}
}

const readout = () => {
	const {row, column} = mouseCoordinates();

	const cell = settings.cells[row][column];

	const cellColor = colorFromHSB(cell.color);

	let hsb = [cell.color.h, cell.color.s, cell.color.b].map(String);
	let rgb = [red(cellColor), green(cellColor), blue(cellColor)].map(x => String(Math.round(x)));

	[hsb, rgb] = [hsb, rgb].map(array => {
		const pad = Math.max(...array.map(x => x.length));
		return array.map(x => x.padStart(pad));
	});

	const readoutText = [
		'H ' + hsb[0] + ' R ' + rgb[0],
		'S ' + hsb[1] + ' G ' + rgb[1],
		'B ' + hsb[2] + ' B ' + rgb[2],
	].join('\n');

	const textW = Math.ceil(textWidth(readoutText.split('\n')[0]));
	const textH = textLeading() * 3 - 2;

	const textMargin  = 5;
	const boxDistance = 5;

	const boxW = textW + textMargin * 2;
	const boxH = textH + textMargin * 2;

	let boxX, boxY, textX, textY;

	if (mouseX + boxDistance + boxW < width) {
		boxX  = mouseX + boxDistance;
		textX = mouseX + boxDistance + textMargin;
	} else {
		boxX  = mouseX - boxDistance - boxW;
		textX = mouseX - boxDistance - boxW + textMargin;
	}

	if (mouseY + boxDistance + boxH < height) {
		boxY  = mouseY + boxDistance;
		textY = mouseY + boxDistance + textMargin;
	} else {
		boxY  = mouseY - boxDistance - boxH;
		textY = mouseY - boxDistance - boxH + textMargin;
	}

	fill(0, 0, 0, 0.5);
	rect(boxX, boxY, boxW, boxH);

	fill(0, 0, 100);
	text(readoutText, textX, textY);
}

const highlight = () => {
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

	[x1, x2] = [x1, x2].sort(sortNumbers);
	[y1, y2] = [y1, y2].sort(sortNumbers);

	let x, y;
	let w = x2 - x1 + 1;
	let h = y2 - y1 + 1;

	[x, y, w, h] = [x1, y1, w, h].map(n => n * settings.grid.scale);

	fill(0, 0, 100, 0.1);
	rect(x, y, w, h);
}

const seed = frozen => {
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

	[x1, x2] = [x1, x2].sort(sortNumbers);
	[y1, y2] = [y1, y2].sort(sortNumbers);

	const color = {
		h : randomIntegerInclusive(0, 360),
		s : randomIntegerInclusive(settings.minS.value, settings.maxS.value),
		b : randomIntegerInclusive(settings.minB.value, settings.maxB.value),
	};

	for (let y = y1; y < y2 + 1; y++) {
		for (let x = x1; x < x2 + 1; x++) {
			Object.assign(settings.cells[y][x].color, color);
			settings.cells[y][x].frozen = frozen;
		}
	}
}

const freeze = direction => {
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

	[x1, x2] = [x1, x2].sort(sortNumbers);
	[y1, y2] = [y1, y2].sort(sortNumbers);

	for (let y = y1; y < y2 + 1; y++) {
		for (let x = x1; x < x2 + 1; x++) {
			settings.cells[y][x].frozen = direction;
		}
	}
}

keyPressed = () => {
	switch (keyCode) {
		case 32:
			settings.loop = ! settings.loop;
			settings.readout = false;
			break;

		case RIGHT_ARROW:
			if (! settings.loop) {
				advanceFrame();
			}
			break;

		case DOWN_ARROW:
			displayGrid();
			save();
			break;
	}
}

mouseMoved = () => {
	if (! settings.loop) {
		settings.readout = true;
	}
}

mousePressed = () => {
	settings.selection.end = settings.selection.start = mouseCoordinates();
	settings.readout = false;
}

mouseDragged = () => {
	settings.selection.end = mouseCoordinates();
	settings.highlight = true;
}

mouseReleased = () => {
	if (keyIsDown(70)) {
		freeze(true);
	} else if (keyIsDown(85)) {
		freeze(false);
	} else if (keyIsDown(SHIFT)) {
		seed(true);
	} else {
		seed(false);
	}

	settings.highlight = false;
}

const mouseCoordinates = () => {
	return {
		row    : Math.floor(mouseY / settings.grid.scale),
		column : Math.floor(mouseX / settings.grid.scale),
	}
}

const colorFromHSB = hsb => {
	const {h, s, b} = hsb;
	return color(h, s, b);
}

const sortNumbers = (a, b) => {
	return a - b;
}