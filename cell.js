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
		const rowPrevious    = constrain(this.coordinates.y - 1, 0, settings.grid.rows    - 1);
		const rowNext        = constrain(this.coordinates.y + 1, 0, settings.grid.rows    - 1);
		const columnPrevious = constrain(this.coordinates.x - 1, 0, settings.grid.columns - 1);
		const columnNext     = constrain(this.coordinates.x + 1, 0, settings.grid.columns - 1);

		const neighbors = [];

		if (settings.checkerboard) {
			neighbors.push(settings.cells[rowPrevious][columnPrevious]);
			neighbors.push(settings.cells[rowPrevious][columnNext]);
			neighbors.push(settings.cells[rowNext][columnPrevious]);
			neighbors.push(settings.cells[rowNext][columnNext]);
		} else {
			neighbors.push(settings.cells[rowPrevious][this.coordinates.x]);
			neighbors.push(settings.cells[rowNext][this.coordinates.x]);
			neighbors.push(settings.cells[this.coordinates.y][columnPrevious]);
			neighbors.push(settings.cells[this.coordinates.y][columnNext]);
		}

		shuffleArray(neighbors);

		const colors = neighbors.slice(0, 2).map(x => colorFromHSB(x.color));
		const amount = randomFloat(0, 1);

		const interpolatedColor = lerpColor(...colors, amount);

		const [h, s, b] = [hue(interpolatedColor), saturation(interpolatedColor), brightness(interpolatedColor)].map(Math.round);

		this.color = {h, s, b};
	}
}