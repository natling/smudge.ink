var settings = {
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

	if (settings.highlight) {
		highlight();
	}
}

function advanceFrame() {
	interpolateGrid();
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
			if (! cells[y][x].frozen) {
				if (coin(settings.interpolationProbability.value)) {
					cells[y][x].interpolate();
				}
			}
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

function highlight() {
	var {
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

	var w = x2 - x1 + 1;
	var h = y2 - y1 + 1;

	var [x, y, w, h] = [x1, y1, w, h].map(n => n * settings.grid.scale);

	fill(0, 0, 100, 0.1);
	rect(x, y, w, h);
}

function seed(frozen) {
	var {
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

	var color = {
		h : randomIntegerInclusive(0, 360),
		s : randomIntegerInclusive(settings.minS.value, settings.maxS.value),
		b : randomIntegerInclusive(settings.minB.value, settings.maxB.value),
	};

	for (var y = y1; y < y2 + 1; y++) {
		for (var x = x1; x < x2 + 1; x++) {
			Object.assign(cells[y][x].color, color);

			if (frozen) {
				cells[y][x].frozen = true;
			} else {
				cells[y][x].frozen = false;
			}
		}
	}
}

function freeze(direction) {
	var {
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

	for (var y = y1; y < y2 + 1; y++) {
		for (var x = x1; x < x2 + 1; x++) {
			if (direction) {
				cells[y][x].frozen = true;
			} else {
				cells[y][x].frozen = false;
			}
		}
	}
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

function mousePressed() {
	settings.selection.end = settings.selection.start = mouseCoordinates();
	settings.readout = false;
}

function mouseDragged() {
	settings.selection.end = mouseCoordinates();
	settings.highlight = true;
}

function mouseReleased() {
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

function sortNumbers(a, b) {
	return a - b;
}