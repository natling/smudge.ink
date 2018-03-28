class Cell {

	constructor(coordinates, color) {
		this.coordinates = coordinates;
		this.color       = color;
	}

	display() {
		fill(colorFromHSB(this.color));
		rect(this.coordinates.x * settings.grid.scale, this.coordinates.y * settings.grid.scale, settings.grid.scale, settings.grid.scale);
	}

	interpolate() {
		var rowPrevious    = constrain(this.coordinates.y - 1, 0, settings.grid.rows    - 1);
		var rowNext        = constrain(this.coordinates.y + 1, 0, settings.grid.rows    - 1);
		var columnPrevious = constrain(this.coordinates.x - 1, 0, settings.grid.columns - 1);
		var columnNext     = constrain(this.coordinates.x + 1, 0, settings.grid.columns - 1);

		var neighbors = [];

		if (settings.checkerboard) {
			neighbors.push(cells[rowPrevious][columnPrevious]);
			neighbors.push(cells[rowPrevious][columnNext]);
			neighbors.push(cells[rowNext][columnPrevious]);
			neighbors.push(cells[rowNext][columnNext]);
		} else {
			neighbors.push(cells[rowPrevious][this.coordinates.x]);
			neighbors.push(cells[rowNext][this.coordinates.x]);
			neighbors.push(cells[this.coordinates.y][columnPrevious]);
			neighbors.push(cells[this.coordinates.y][columnNext]);
		}

		shuffleArray(neighbors);

		var color1 = colorFromHSB(neighbors[0].color);
		var color2 = colorFromHSB(neighbors[1].color);
		var amount = randomFloat(0, 1);

		var interpolatedColor = lerpColor(color1, color2, amount);

		this.color = {
			h : Math.round(hue(interpolatedColor)),
			s : Math.round(saturation(interpolatedColor)),
			b : Math.round(brightness(interpolatedColor)),
		};
	}
}

var settings = {
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

var cells;

function setup() {
	createCanvas(windowWidth, windowHeight);
	colorMode(HSB);
	cursor(CROSS);

	background(0);

	noStroke();

	textFont('Menlo', 12);
	textAlign(LEFT, TOP);

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
	settings.grid.rows    = Math.round(height / settings.grid.scale);
	settings.grid.columns = Math.round(width  / settings.grid.scale);

	cells = create2DArray(settings.grid.rows, settings.grid.columns);

	for (var y = 0; y < settings.grid.rows; y++) {
		for (var x = 0; x < settings.grid.columns; x++) {
			var coordinates = {
				x : x,
				y : y,
			};

			var color = {
				h : randomIntegerInclusive(0, 360),
				s : randomIntegerInclusive(settings.minS.value, settings.maxS.value),
				b : 0,
			};

			cells[y][x] = new Cell(coordinates, color);
		}
	}
}

function displayGrid() {
	for (var y = 0; y < settings.grid.rows; y++) {
		for (var x = 0; x < settings.grid.columns; x++) {
			cells[y][x].display();
		}
	}
}

function interpolateGrid() {
	for (var y = 0; y < settings.grid.rows; y++) {
		for (var x = 0; x < settings.grid.columns; x++) {
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
	var y1 = randomIntegerInclusive(0, settings.grid.rows    - 1);
	var x1 = randomIntegerInclusive(0, settings.grid.columns - 1);

	var iOffset = randomIntegerInclusive(-settings.maxSeedSize.value, settings.maxSeedSize.value);
	var jOffset = randomIntegerInclusive(-settings.maxSeedSize.value, settings.maxSeedSize.value);

	var y2 = constrain(y1 + iOffset, 0, settings.grid.rows    - 1);
	var x2 = constrain(x1 + jOffset, 0, settings.grid.columns - 1);

	var color = {
		h : randomIntegerInclusive(0, 360),
		s : randomIntegerInclusive(settings.minS.value, settings.maxS.value),
		b : randomIntegerInclusive(settings.minB.value, settings.maxB.value),
	};

	for (var y = y1; y < y2 + 1; y++) {
		for (var x = x1; x < x2 + 1; x++) {
			Object.assign(cells[y][x].color, color);
		}
	}
}

function walk() {
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

function readout() {
	var {row, column} = mouseCoordinates();

	var cell = cells[row][column];

	var cellColor = colorFromHSB(cell.color);

	var hsb = [cell.color.h, cell.color.s, cell.color.b].map(String);
	var rgb = [red(cellColor), green(cellColor), blue(cellColor)].map(x => String(Math.round(x)));

	[hsb, rgb] = [hsb, rgb].map(function (array) {
		var pad = Math.max(...array.map(x => x.length));
		return array.map(x => x.padStart(pad));
	});

	var readoutText = [
		'H ' + hsb[0] + ' R ' + rgb[0],
		'S ' + hsb[1] + ' G ' + rgb[1],
		'B ' + hsb[2] + ' B ' + rgb[2],
	].join('\n');

	var textW = Math.ceil(textWidth(readoutText.split('\n')[0]));
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
		row    : Math.floor(mouseY / settings.grid.scale),
		column : Math.floor(mouseX / settings.grid.scale),
	}
}

function colorFromHSB(hsb) {
	var {h, s, b} = hsb;
	return color(h, s, b);
}