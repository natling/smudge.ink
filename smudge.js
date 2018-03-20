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

	interpolate() {
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

		this.h = Math.round(hue(interpolatedColor));
		this.s = Math.round(saturation(interpolatedColor));
		this.b = Math.round(brightness(interpolatedColor));
	}
}

var settings = {
	checkerboard : true,

	loop    : true,
	readout : false,

	gridSize : 10,

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
	cursor(CROSS);
	colorMode(HSB);
	background(0);
	noStroke();
	textFont('Menlo', 12);
	createGrid();
}

function draw() {
	if (settings.loop) {
		advanceFrame();
	}

	displayGrid();

	if (settings.readout) {
		readout();
	}
}

function advanceFrame() {
	interpolateGrid();
	createSeeds();
	walk();
}

function createGrid() {
	settings.rows    = Math.round(height / settings.gridSize);
	settings.columns = Math.round(width  / settings.gridSize);

	cells = create2DArray(settings.rows, settings.columns);

	for (var y = 0; y < settings.rows; y++) {
		for (var x = 0; x < settings.columns; x++) {
			var row    = y;
			var column = x;
			var h      = randomIntegerInclusive(0, 360);
			var s      = randomIntegerInclusive(settings.minS.value, settings.maxS.value);
			var b      = 0;

			cells[y][x] = new Cell(row, column, h, s, b);
		}
	}
}

function displayGrid() {
	for (var y = 0; y < settings.rows; y++) {
		for (var x = 0; x < settings.columns; x++) {
			cells[y][x].display();
		}
	}
}

function interpolateGrid() {
	for (var y = 0; y < settings.rows; y++) {
		for (var x = 0; x < settings.columns; x++) {
			if (coin(settings.interpolationProbability.value)) {
				cells[y][x].interpolate();
			}
		}
	}
}

function createSeeds() {
	var n = randomIntegerInclusive(settings.minSeedsPerFrame.value, settings.maxSeedsPerFrame.value);

	for (var i = 0; i < n; i++) {
		seed();
	}
}

function seed() {
	var y1 = randomIntegerInclusive(0, settings.rows    - 1);
	var x1 = randomIntegerInclusive(0, settings.columns - 1);

	var iOffset = randomIntegerInclusive(-settings.maxSeedSize.value, settings.maxSeedSize.value);
	var jOffset = randomIntegerInclusive(-settings.maxSeedSize.value, settings.maxSeedSize.value);

	var y2 = constrain(y1 + iOffset, 0, settings.rows    - 1);
	var x2 = constrain(x1 + jOffset, 0, settings.columns - 1);

	var h = randomIntegerInclusive(0, 360);
	var s = randomIntegerInclusive(settings.minS.value, settings.maxS.value);
	var b = randomIntegerInclusive(settings.minB.value, settings.maxB.value);

	for (var y = y1; y < y2 + 1; y++) {
		for (var x = x1; x < x2 + 1; x++) {
			cells[y][x].h = h;
			cells[y][x].s = s;
			cells[y][x].b = b;
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

function readout() {
	var {row, column} = mouseCoordinates();

	var cell = cells[row][column];

	var cellColor = color(cell.h, cell.s, cell.b);

	var hsb = [cell.h, cell.s, cell.b].map(x => String(x));
	var hsbLength = Math.max(...hsb.map(x => x.length));
	hsb = hsb.map(x => x.padStart(hsbLength));

	var rgb = [red(cellColor), green(cellColor), blue(cellColor)].map(x => String(Math.round(x)));
	var rgbLength = Math.max(...rgb.map(x => x.length));
	rgb = rgb.map(x => x.padStart(rgbLength));

	var readoutLine1 = 'H ' + hsb[0] + ' R ' + rgb[0];
	var readoutLine2 = 'S ' + hsb[1] + ' G ' + rgb[1];
	var readoutLine3 = 'B ' + hsb[2] + ' B ' + rgb[2];

	var readoutText = [readoutLine1, readoutLine2, readoutLine3].join('\n');

	var textW = Math.ceil(textWidth(readoutLine1));
	var textH = textLeading() * 3 - 2;

	var textMargin  = 5;
	var boxDistance = 5;

	var boxW = textW + textMargin * 2;
	var boxH = textH + textMargin * 2;

	var boxX, boxY, textX, textY;

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
	textAlign(LEFT, TOP);
	text(readoutText, textX, textY);
}

function keyPressed() {
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

function mouseMoved() {
	if (! settings.loop) {
		settings.readout = true;
	}
}

function mouseCoordinates() {
	return {
		row    : Math.floor(mouseY / settings.gridSize),
		column : Math.floor(mouseX / settings.gridSize),
	}
}