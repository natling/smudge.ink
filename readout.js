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