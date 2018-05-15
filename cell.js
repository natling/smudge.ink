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

		var colors = neighbors.slice(0, 2).map(x => colorFromHSB(x.color));
		var amount = randomFloat(0, 1);

		var interpolatedColor = lerpColor(...colors, amount);

		var [h, s, b] = [hue(interpolatedColor), saturation(interpolatedColor), brightness(interpolatedColor)].map(Math.round);

		this.color = {h, s, b};
	}
}