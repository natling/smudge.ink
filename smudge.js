class Cell {

	constructor(row, column, h, s, b) {
		this.row    = row;
		this.column = column;
		this.h      = h;
		this.s      = s;
		this.b      = b;
	}

	display() {
		fill(color(this.h, this.s, this.b));
		rect(this.column * settings.gridSize, this.row * settings.gridSize, settings.gridSize, settings.gridSize);
	}

	interpolateColor() {
		var previousRow    = constrain(this.row    - 1, 0, settings.rows    - 1);
		var nextRow        = constrain(this.row    + 1, 0, settings.rows    - 1);
		var previousColumn = constrain(this.column - 1, 0, settings.columns - 1);
		var nextColumn     = constrain(this.column + 1, 0, settings.columns - 1);

		var neighbors = [];

		if (settings.checkerboard) {
			neighbors.push(cells[previousRow][previousColumn]);
			neighbors.push(cells[previousRow][nextColumn]);
			neighbors.push(cells[nextRow][previousColumn]);
			neighbors.push(cells[nextRow][nextColumn]);
		} else {
			neighbors.push(cells[previousRow][this.column]);
			neighbors.push(cells[nextRow][this.column]);
			neighbors.push(cells[this.row][previousColumn]);
			neighbors.push(cells[this.row][nextColumn]);
		}

		shuffleArray(neighbors);

		var color0 = color(neighbors[0].h, neighbors[0].s, neighbors[0].b);
		var color1 = color(neighbors[1].h, neighbors[1].s, neighbors[1].b);
		var amount = randomFloat(0, 1);

		var interpolatedColor = lerpColor(color0, color1, amount);

		this.h = hue(interpolatedColor);
		this.s = saturation(interpolatedColor);
		this.b = brightness(interpolatedColor);
	}
}

var settings = {
	gridSize : 10,

	checkerboard : true,

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

var cells;

function setup() {
	createCanvas(windowWidth, windowHeight);
	colorMode(HSB);
	noStroke();

	settings.rows    = Math.round(height / settings.gridSize);
	settings.columns = Math.round(width  / settings.gridSize);

	cells = create2DArray(settings.rows, settings.columns);

	for (var i = 0; i < settings.rows; i++) {
		for (var j = 0; j < settings.columns; j++) {
			var row    = i;
			var column = j;
			var h      = randomIntegerInclusive(0, 360);
			var s      = randomIntegerInclusive(settings.minS.value, settings.maxS.value);
			var b      = 0;

			cells[i][j] = new Cell(row, column, h, s, b);
		}
	}
}

function draw() {
	for (var i = 0; i < settings.rows; i++) {
		for (var j = 0; j < settings.columns; j++) {
			cells[i][j].display();

			if (coin(settings.interpolationProbability.value)) {
				cells[i][j].interpolateColor();
			}
		}
	}

	var newSeeds = randomIntegerInclusive(settings.minSeedsPerFrame.value, settings.maxSeedsPerFrame.value);

	for (var i = 0; i < newSeeds; i++) {
		seed();
	}

	walk();
}

function seed() {
	var i1 = randomIntegerInclusive(0, settings.rows    - 1);
	var j1 = randomIntegerInclusive(0, settings.columns - 1);

	var iOffset = randomIntegerInclusive(-settings.maxSeedSize.value, settings.maxSeedSize.value);
	var jOffset = randomIntegerInclusive(-settings.maxSeedSize.value, settings.maxSeedSize.value);

	var i2 = constrain(i1 + iOffset, 0, settings.rows    - 1);
	var j2 = constrain(j1 + jOffset, 0, settings.columns - 1);

	var h = randomIntegerInclusive(0, 360);
	var s = randomIntegerInclusive(settings.minS.value, settings.maxS.value);
	var b = randomIntegerInclusive(settings.minB.value, settings.maxB.value);

	for (var i = i1; i < i2 - 1; i++) {
		for (var j = j1; j < j2 - 1; j++) {
			cells[i][j].h = h;
			cells[i][j].s = s;
			cells[i][j].b = b;
		}
	}
}

function walk() {
	for (parameter in settings) {
		if (settings.hasOwnProperty(parameter)) {
			if (typeof settings[parameter] == 'object') {
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

function randomIntegerInclusive(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function coin(p) {
	if (Math.random() < p) {
		return true;
	} else {
		return false;
	}
}

function shuffleArray(array) {
	for (var i = array.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var temp = array[i];
		array[i] = array[j];
		array[j] = temp;
	}
	return array;
}

function create2DArray(rows, columns) {
	var x = new Array(rows);

	for (var i = 0; i < rows; i++) {
		x[i] = new Array(columns);
	}

	return x;
}

function randomWalkInteger(start, low, high, step) {
	while (true) {
		var newStart = start + randomIntegerInclusive(-step, step);
		if (newStart >= low && newStart <= high) {
			return newStart;
		}
	}
}

function randomWalkFloat(start, low, high, step) {
	while (true) {
		var newStart = start + randomFloat(-step, step);
		if (newStart >= low && newStart <= high) {
			return newStart;
		}
	}
}