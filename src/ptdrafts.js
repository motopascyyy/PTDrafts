// Drafts 
const lineRegEx = new RegExp('^\|.*\|$');
const draftContents = editor.getText();


const defaultAlignPattern = / *-+ */g;

const LEFT_ALIGN = -1;
const CENTRE_ALIGN = 0;
const RIGHT_ALIGN = 1

let leftAlignPattern = /^\s*:-+\s*$/;
let rightAlignPattern = /^\s*-+:\s*$/;
let centreAlignPattern = /^\s*:-+:\s*$/;
let noAlignPattern = /^\s*-+\s*$/;
const regex = /\|/g;
const tableRegex = /^(\|[^\n]+\|\n)((?:\|\s*:?[-]+:?\s*)+\|)(\n(?:\|[^\n]+\|\n?)*)?$/gm;


function betterTab () {
	let start = new Date().valueOf();
	let lineRange = editor.getSelectedLineRange();
	let lineText = editor.getTextInRange(lineRange[0], lineRange[1]);
	let currentCursor = editor.getSelectedRange();
	let solToCursorTrimmedText = editor.getTextInRange(lineRange[0], currentCursor[0]-lineRange[0]).trim();
	if (lineBelongsToTable(lineText)) {
		moveCursorToNextCell(currentCursor, lineRange);
		formatTable();
	} else if (currentCursor[1] > 0) {
		let indent = Action.find("Indent");
		app.queueAction(indent, editor.recentDrafts[0]);
	} else if (isBulletedList(solToCursorTrimmedText)) {
		let indent = Action.find("Indent");
		app.queueAction(indent, editor.recentDrafts[0]);
	} else {
		editor.setTextInRange(currentCursor[0], 0, editor.preferredTabString);
		editor.setSelectedRange(currentCursor[0] + editor.preferredTabString.length, 0);
	}
	let duration = (new Date().valueOf()) - start;
}

function betterShiftTab() {
	let start = new Date().valueOf();
	let lineRange = editor.getSelectedLineRange();
	let lineText = editor.getTextInRange(lineRange[0], lineRange[1]);
	let currentCursor = editor.getSelectedRange();
	let solToCursorTrimmedText = editor.getTextInRange(lineRange[0], currentCursor[0]-lineRange[0]).trim();
	if (lineBelongsToTable(lineText)) {
		moveCursorToPreviousCell(currentCursor, lineRange);
		formatTable();
	} else if (currentCursor[1] > 0 || isBulletedList(solToCursorTrimmedText)) {
		let outdent = Action.find("Outdent");
		app.queueAction(outdent, editor.recentDrafts[0]);
	}
	let duration = (new Date().valueOf()) - start;
}


function isBulletedList (preceedingTrimmedString) {
	let regex = /^:|\*|\-|\+|\d+\.$/g;
	return preceedingTrimmedString.match(regex);
}


function moveCursorToNextCell(currentCursor, lineRange){
	let offset = currentCursor[0] - lineRange [0];
	let cursorToEOLText = editor.getTextInRange(currentCursor[0], lineRange[1]-offset);
	let pipesRemaining = cursorToEOLText.match(/\|/g).length;
	if (pipesRemaining > 1) {
		let cellsRemaining = pipesRemaining - 1;
		if (cellsRemaining > 0) {
			// find location of next "pipe"
			let substringPipeIndex = cursorToEOLText.indexOf("|");
			editor.setSelectedRange(currentCursor[0] + substringPipeIndex + 2, 0);
		}
	}
}

function moveCursorToPreviousCell(currentCursor, lineRange) {
	let cursorToSOLText = editor.getTextInRange(lineRange[0], currentCursor[0] - lineRange[0]);
	let pipesRemaining = cursorToSOLText.match(/\|/g).length;
	if (pipesRemaining > 1) {
		let cellsRemaining = pipesRemaining - 1;
		if (cellsRemaining > 0) {
			let currentCellPipeIndex = cursorToSOLText.lastIndexOf("|");
			let solToCurrentCellText = cursorToSOLText.substring (0, currentCellPipeIndex);
			let substringPipeIndex = solToCurrentCellText.lastIndexOf("|");
			editor.setSelectedRange(lineRange[0] + substringPipeIndex + 2, 0);
		}
	}
}

function getRow () {
	let lineRange = editor.getSelectedLineRange();
	return editor.getTextInRange(lineRange[0], lineRange[1]);
}

function lineBelongsToTable (lineText) {
	let lineRegEx = /^\|.*\|$/gm;
	return lineRegEx.test(lineText);
}

function addRowToTable (columnNumber) {
	let lineRange = editor.getSelectedLineRange();
	let newRow = "| ";
	for (let i = 0; i < columnNumber; i++) {
		newRow += " | ";
	}
	newRow += " |\n";
	editor.setTextInRange(lineRange[0] + lineRange[1], 0, newRow);
}

function countColumns (line) {
	let results = ((line || '').match(regex) || []).length;
	if (results > 1){
		return results - 2;
	} else {
		return 1;
	}
}

/**
 * @param {string} regexString
 */
function escapeRegex(regexString) {
    return regexString.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

/**
 * @param {any[]} fullTableRange
 */
function findLongestCellValue(fullTableRange) {
	let endPos = fullTableRange[0] + fullTableRange[1];
	let cells = tableRangeRowToArray(fullTableRange);
	let maxLengths = [];
	for (let i of cells) {
		maxLengths.push(0);
	}
	for (let i = fullTableRange[0]; i < endPos; i++) {
		let lineRange = editor.getLineRange(i, 1);
		let cellValues = tableRangeRowToArray(lineRange);
		for (let valIndex = 0; valIndex < cellValues.length; valIndex++) {
			let val = cellValues[valIndex].trim();
			let maxLength = maxLengths[valIndex];
			if (val.length > maxLength) {
				maxLengths[valIndex] = val.length;
			}
		}
		i = lineRange[0] + lineRange[1] + 1;
	}
	return maxLengths;

}

function tableRangeRowToArray(range) {
	let lineRange = editor.getLineRange(range[0], 1);
	let line = editor.getTextInRange (lineRange[0], lineRange[1]);
    return stringRowToArray(line);
}

function stringRowToArray(row) {
	let trimmedLine = row.trim();
	let cells = trimmedLine.substring(1, trimmedLine.length-1).split ("|");
	for (let cellIndex = 0; cellIndex < cells.length; cellIndex++) {
		cells[cellIndex] = cells[cellIndex].trim();
	}
	return cells
}


/**
 * @param {number} maxLength
 * @param {string} origString
 * @param {number} alignment
 */
function getTailPadding (maxLength, origString, alignment) {
	let padding = "";
	let spacesToAdd = 0;
	if (alignment == CENTRE_ALIGN) {
		let lengthDiff = maxLength - origString.length;
		let diffDiv2 = lengthDiff/2;
		spacesToAdd = Math.ceil(diffDiv2) + 1;
		// console.log(`Tail Spaces:\n\tlengthDiff = ${lengthDiff}\n\tdivided by 2: ${diffDiv2}\n\tfloored: ${Math.floor(diffDiv2)}`);
	} else if (alignment == LEFT_ALIGN) {
		spacesToAdd = maxLength - origString.length + 1;
	} else {
		// RIGHT_ALIGN so only return 1 space
		spacesToAdd = 1;
	}
	for (let i = 0; i < spacesToAdd; i++) {
		if (isDelimiterValue(origString) && i < spacesToAdd - 1) {
			padding += "-";
		} else {
			padding += " ";
		}
	}
	return padding;
}

function getHeadPadding (maxLength, origString, alignment) {
	let padding = "";
	let spacesToAdd = 0;
	console.log(`origString: '${origString}' - maxLength: ${maxLength} - alignment: ${alignment}`);
	if (alignment == CENTRE_ALIGN) {
		let lengthDiff = maxLength - origString.length;
		let diffDiv2 = lengthDiff/2;
		// console.log(`Head Spaces:\n\tlengthDiff = ${lengthDiff}\n\tdivided by 2: ${diffDiv2}\n\tfloored: ${Math.floor(diffDiv2)}`);
		spacesToAdd = Math.floor(diffDiv2) + 1;
	} else if (alignment == LEFT_ALIGN) {
		// LEFT_ALIGN so only return 1 space
		spacesToAdd = 1;
	} else {
		spacesToAdd = maxLength - origString.length + 1;
	}
	// console.log(`spacesToAdd: ${spacesToAdd}`);
	for (let i = 0; i < spacesToAdd; i++) {
		if (isDelimiterValue(origString) && i != 0) {
			padding += "-";
		} else {
			padding += " ";
		}
	}
	// console.log(`padding: '${padding}'`);
	return padding;

}

function isDelimiterValue (value) {

	return leftAlignPattern.test(value) ||
		rightAlignPattern.test(value) ||
		centreAlignPattern.test(value) ||
		noAlignPattern.test(value);
}

function getJustificationSettings (secondTableRowString) {
    let cells = stringRowToArray(secondTableRowString);
    let justificationArray = [];
    for (let cell of cells) {
		if (leftAlignPattern.test(cell)) {
			justificationArray.push([LEFT_ALIGN]);
		} else if (rightAlignPattern.test(cell)) {
			justificationArray.push(RIGHT_ALIGN);
		} else if (centreAlignPattern.test(cell)) {
			justificationArray.push(CENTRE_ALIGN);
		} else {
			justificationArray.push(LEFT_ALIGN);
		}
	}
    // console.log(justificationArray);
    return justificationArray;
}

function formatTable() {
	let line = getRow();
	if (lineBelongsToTable(line)){
		let tableRange = findTable(editor.getSelectedLineRange()[0]);
		let tableText = editor.getTextInRange(tableRange[0], tableRange[1]);
		console.log("***FULL TABLE***");
		console.log(tableText);
		console.log("***END OF TABLE***");
		let table = tableText.split("\n");
		let maxLengths = findLongestCellValue(tableRange);
		let alignments = getJustificationSettings(table[1]);
		let newTable = "";

		for (let i = 0; i < table.length; i++) {
			let textRow = table[i];
			let cellValues = stringRowToArray(textRow);
			let formattedLine = "|";
			for (let j = 0; j < cellValues.length; j++) {
				let val = cellValues[j];
				let maxLength = maxLengths[j];
				let align = alignments[j];
				if (isDelimiterValue(val) && align == CENTRE_ALIGN) {
					val = ":";
					for (let counter = 0; counter < maxLength - 2; counter++) {
						val+= "-";
					}
					val += ":";
					formattedLine += " " + val + " ";
				} else if (val.length < maxLength) {
					formattedLine += getHeadPadding(maxLength, val, align) + val + getTailPadding(maxLength, val, align);
				} else {
					formattedLine += " " + val + " ";
				}
				formattedLine += "|";
			}
			if (i !== table.length - 1){
				newTable += formattedLine + "\n";
			} else {
				newTable += formattedLine
			}
		}

		editor.setTextInRange(tableRange[0], tableRange[1], newTable);
	}
}

/**
 * @param {number} position
 */
function lineStartOfDraft(position) {
	let lineRange = editor.getLineRange(position, 0);
	return lineRange[0] === 0;
}

/**
 * @param {number} position
 */
function lineEndOfDraft(position) {
	let lineRange = editor.getLineRange(position, 0);
	let lastIndexOfLine = lineRange[0] + lineRange[1] - 1;
	let lastIndexInDraft = draftContents.length - 1;
	return lastIndexInDraft === lastIndexOfLine;
}


/**
 * @param {number} cursorPosition
 */
function getCurrentColumnIndex (cursorPosition) {
	let line = getRow();
	if (lineBelongsToTable(line)) {
		let [startOfLinePos, lineLength] = editor.getSelectedLineRange();
		let lineToCursorText = editor.getTextInRange(editor.getSelectedLineRange()[0], cursorPosition - startOfLinePos);
		let results = ((lineToCursorText || '').match(regex) || []).length;
		if (results < 1) {
			return 0;
		} else {
			return results - 1;
		}
	} else {
		return null;
	}
}

function insertColumn () {
	let cursor = editor.getSelectedRange()[0];
	let currentColumnIndex = getCurrentColumnIndex(cursor);
	console.log(`Current Column Index: ${currentColumnIndex}`);
	let line = getRow();
	if (lineBelongsToTable(line)) {
		let tableRange = findTable(cursor);
		let table = editor.getTextInRange(tableRange[0], tableRange[1]).split("\n");
		let counter = 0;
		for (let row of table) {
			let cells = row.split("|");
			console.log(`Split Row: [${cells}]`);
			console.log(`testing '${cells[1].trim()}' is a header separator - ${isDelimiterValue(cells[1].trim())}`);
			if (isDelimiterValue(cells[1].trim())) {
				cells.splice(currentColumnIndex + 1, 0, " :---- ");
			} else {
				cells.splice(currentColumnIndex + 1, 0, "       ");
			}
			table[counter] = cells.join("|");
			counter++;
		}
		editor.setTextInRange(tableRange[0], tableRange[1], table.join("\n"));
	}
}

/**
 *
 * @param {number} currentCursor
 * @returns {number[]}
 */
function findTable(currentCursor) {

	let draftContent = editor.getText();
	let tables = draftContent.matchAll(tableRegex);
	let prevTable;
	let result = [];
	let rowCounter = 0;
	for (let table of tables) {
		if (table.index > currentCursor && rowCounter == 0) {
			result.push(table.index);
			result.push(table[0].length);
			break;
		}
		else if (table.index > currentCursor) {
			let tableString = prevTable[0];
			let converted = tableString.replaceAll("\n", "\\n");
			console.log(`Found:\n${tableString}`);
			console.log(`Converted:\n${converted}`);
			result.push(prevTable.index);
			result.push(prevTable[0].trim().length);
			break;
		} else {
			prevTable = table;
		}
		rowCounter++;
	}
	if (result.length === 0 && prevTable != undefined) {
		//this handles the situation where the table is the last structure in the draft.
		result.push(prevTable.index);
		result.push(prevTable[0].trim().length);
	}
	return result;
}