const settings = {
	grid : {
		scale : 10,
	},

	checkerboard : true,

	loop    : true,
	readout : false,

	minSeedsPerFrame : {
		value           :   0,
		min             :   0,
		max             :  10,
		walkProbability :   0.1,
		walkStep        :   2,
		walkType        : 'int',
	},

	maxSeedsPerFrame : {
		value           :  10,
		min             :   0,
		max             :  10,
		walkProbability :   0.1,
		walkStep        :   2,
		walkType        : 'int',
	},

	maxSeedSize : {
		value           :  50,
		min             :  10,
		max             :  50,
		walkProbability :   0.1,
		walkStep        :  10,
		walkType        : 'int',
	},

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
}

const advanceFrame = () => {
	interpolateGrid();
	createSeeds();
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
			if (coin(settings.interpolationProbability.value)) {
				settings.cells[y][x].interpolate();
			}
		}
	}
}

const createSeeds = () => {
	const n = randomIntegerInclusive(settings.minSeedsPerFrame.value, settings.maxSeedsPerFrame.value);

	for (let i = 0; i < n; i++) {
		seed();
	}
}

const seed = () => {
	const y1 = randomIntegerInclusive(0, settings.grid.rows    - 1);
	const x1 = randomIntegerInclusive(0, settings.grid.columns - 1);

	const iOffset = randomIntegerInclusive(-settings.maxSeedSize.value, settings.maxSeedSize.value);
	const jOffset = randomIntegerInclusive(-settings.maxSeedSize.value, settings.maxSeedSize.value);

	const y2 = constrain(y1 + iOffset, 0, settings.grid.rows    - 1);
	const x2 = constrain(x1 + jOffset, 0, settings.grid.columns - 1);

	const color = {
		h : randomIntegerInclusive(0, 360),
		s : randomIntegerInclusive(settings.minS.value, settings.maxS.value),
		b : randomIntegerInclusive(settings.minB.value, settings.maxB.value),
	};

	for (let y = y1; y < y2 + 1; y++) {
		for (let x = x1; x < x2 + 1; x++) {
			Object.assign(settings.cells[y][x].color, color);
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