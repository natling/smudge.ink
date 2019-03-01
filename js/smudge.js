const settings = {
	grid : {
		scale : 10,
	},

	randomSeeds : true,

	checkerboard : true,

	loop      : true,
	highlight : false,
	readout   : false,

	selection : {},

	minSeedsPerFrame : {
		value           :   0,
		min             :   0,
		max             :  10,
		walkProbability :   0.1,
		walkStep        :   2,
		type            : 'int',
	},

	maxSeedsPerFrame : {
		value           :  10,
		min             :   0,
		max             :  10,
		walkProbability :   0.1,
		walkStep        :   2,
		type            : 'int',
	},

	maxSeedSize : {
		value           :  50,
		min             :  10,
		max             :  50,
		walkProbability :   0.1,
		walkStep        :  10,
		type            : 'int',
	},

	interpolationProbability : {
		value           :   1.0,
		min             :   0.0,
		max             :   1.0,
		walkProbability :   0.1,
		walkStep        :   0.2,
		type            : 'float',
	},

	minS : {
		value           :   0,
		min             :   0,
		max             : 100,
		walkProbability :   0.1,
		walkStep        :  10,
		type            : 'int',
	},

	maxS : {
		value           : 100,
		min             :   0,
		max             : 100,
		walkProbability :   0.1,
		walkStep        :  10,
		type            : 'int',
	},

	minB : {
		value           :   0,
		min             :   0,
		max             : 100,
		walkProbability :   0.1,
		walkStep        :  10,
		type            : 'int',
	},

	maxB : {
		value           : 100,
		min             :   0,
		max             : 100,
		walkProbability :   0.1,
		walkStep        :  10,
		type            : 'int',
	},
};

const f = {
	randomIntegerInclusive : (min, max) => {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min + 1)) + min;
	},

	randomFloat : (min, max) => Math.random() * (max - min) + min,

	randomWalkInteger : (start, low, high, step) => {
		while (true) {
			const newStart = start + f.randomIntegerInclusive(-step, step);
			if (newStart >= low && newStart <= high) {
				return newStart;
			}
		}
	},

	randomWalkFloat : (start, low, high, step) => {
		while (true) {
			const newStart = start + f.randomFloat(-step, step);
			if (newStart >= low && newStart <= high) {
				return newStart;
			}
		}
	},

	shuffleArray : array => {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
	},

	coin : p => Math.random() < p,

	sortNumbers : (a, b) => a - b,

	linlin : (value, inMin, inMax, outMin, outMax) => {
		return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
	},

	flatten : (array, ret) => {
		ret = ret === undefined ? [] : ret;

		for (let i = 0; i < array.length; i++) {
			if (Array.isArray(array[i])) {
				f.flatten(array[i], ret);
			} else {
				ret.push(array[i]);
			}
		}

		return ret;
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

	if (settings.randomSeeds) {
		createRandomSeeds();
	}

	walk();
}

const createGrid = () => {
	settings.grid.rows    = Math.round(height / settings.grid.scale);
	settings.grid.columns = Math.round(width  / settings.grid.scale);

	settings.cells = Array.from({length: settings.grid.rows}, () => Array.from({length: settings.grid.columns}, () => null));

	for (let y = 0; y < settings.grid.rows; y++) {
		for (let x = 0; x < settings.grid.columns; x++) {
			const coordinates = {x, y};

			const color = {
				h : f.randomIntegerInclusive(0, 360),
				s : f.randomIntegerInclusive(settings.minS.value, settings.maxS.value),
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
				if (f.coin(settings.interpolationProbability.value)) {
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
				if (f.coin(settings[parameter].walkProbability)) {
					const {type, value, min, max, walkStep} = settings[parameter];

					switch (type) {
						case 'int':
							settings[parameter].value = f.randomWalkInteger(value, min, max, walkStep);
							break;
						case 'float':
							settings[parameter].value = f.randomWalkFloat(value, min, max, walkStep);
							break;
					}
				}
			}
		}
	}
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

	[x1, x2] = [x1, x2].sort(f.sortNumbers);
	[y1, y2] = [y1, y2].sort(f.sortNumbers);

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

	[x1, x2] = [x1, x2].sort(f.sortNumbers);
	[y1, y2] = [y1, y2].sort(f.sortNumbers);

	const color = {
		h : f.randomIntegerInclusive(0, 360),
		s : f.randomIntegerInclusive(settings.minS.value, settings.maxS.value),
		b : f.randomIntegerInclusive(settings.minB.value, settings.maxB.value),
	};

	for (let y = y1; y < y2 + 1; y++) {
		for (let x = x1; x < x2 + 1; x++) {
			Object.assign(settings.cells[y][x].color, color);
			settings.cells[y][x].frozen = frozen;
		}
	}
}

const randomSeed = () => {
	const y1 = f.randomIntegerInclusive(0, settings.grid.rows    - 1);
	const x1 = f.randomIntegerInclusive(0, settings.grid.columns - 1);

	const iOffset = f.randomIntegerInclusive(-settings.maxSeedSize.value, settings.maxSeedSize.value);
	const jOffset = f.randomIntegerInclusive(-settings.maxSeedSize.value, settings.maxSeedSize.value);

	const y2 = constrain(y1 + iOffset, 0, settings.grid.rows    - 1);
	const x2 = constrain(x1 + jOffset, 0, settings.grid.columns - 1);

	const color = {
		h : f.randomIntegerInclusive(0, 360),
		s : f.randomIntegerInclusive(settings.minS.value, settings.maxS.value),
		b : f.randomIntegerInclusive(settings.minB.value, settings.maxB.value),
	};

	for (let y = y1; y < y2 + 1; y++) {
		for (let x = x1; x < x2 + 1; x++) {
			Object.assign(settings.cells[y][x].color, color);
			settings.cells[y][x].frozen = false;
		}
	}
}

const createRandomSeeds = () => {
	const n = f.randomIntegerInclusive(settings.minSeedsPerFrame.value, settings.maxSeedsPerFrame.value);

	for (let i = 0; i < n; i++) {
		randomSeed();
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

	[x1, x2] = [x1, x2].sort(f.sortNumbers);
	[y1, y2] = [y1, y2].sort(f.sortNumbers);

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