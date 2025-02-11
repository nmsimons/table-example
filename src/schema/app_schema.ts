/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { TreeViewConfiguration, SchemaFactory } from "fluid-framework";

// Schema is defined using a factory object that generates classes for objects as well
// as list and map nodes.

// Include a UUID to guarantee that this schema will be uniquely identifiable.
// As this schema uses a recursive type, the beta SchemaFactoryRecursive is used instead of just SchemaFactory.
const sf = new SchemaFactory("fc1db2e8-0a00-11ee-be56-0242ac120002");

export class Cell extends sf.object("Cell", {
	value: sf.string,
}) {}

export class Row extends sf.object("Row", {
	id: sf.identifier,
	cells: sf.map(Cell),
}) {
	// Set the value of a cell. First test if it exists. If it doesn't exist, create it.
	setValue(column: Column, value: string): Cell {
		let cell = this.cells.get(column.id);
		if (cell) {
			cell.value = value;
		} else {
			cell = new Cell({ value });
			this.cells.set(column.id, cell);
		}
		return cell;
	}

	// Get a cell. If it doesn't exist, create it with a default value.
	getCell(column: Column): Cell {
		let cell = this.cells.get(column.id);
		if (!cell) {
			cell = new Cell({ value: "" });
			this.cells.set(column.id, cell);
		}
		return cell;
	}
}

export class Column extends sf.object("Column", {
	id: sf.identifier,
	name: sf.string,
}) {
	// Get all the cell values for this column
	getCells(table: Table): Cell[] {
		const values: Cell[] = [];
		for (const row of table.rows) {
			values.push(row.getCell(this));
		}
		return values;
	}
}

export class Table extends sf.object("Table", {
	rows: sf.array("Rows", Row),
	columns: sf.array("Columns", Column),
}) {
	// Add a row to the table
	appendRow(): Row {
		const row = new Row({ cells: {} });
		this.rows.insertAtEnd(row);
		return row;
	}

	// Insert a row at a specific location
	insertRow(index: number): Row {
		const row = new Row({ cells: {} });
		this.rows.insertAt(index, row);
		return row;
	}

	// Add a column to the table
	appendColumn(name: string): Column {
		const column = new Column({ name });
		this.columns.insertAtEnd(column);
		return column;
	}

	// Insert a column at a specific location
	insertColumn(index: number, name: string): Column {
		const column = new Column({ name });
		this.columns.insertAt(index, column);
		return column;
	}

	// Get a cell in a table
	getCell(row: Row, column: Column): Cell {
		return row.getCell(column);
	}

	// Set the value of a cell in the table
	setValue(row: Row, column: Column, value: string): Cell {
		return row.setValue(column, value);
	}
}

// Export the tree config appropriate for this schema.
// This is passed into the SharedTree when it is initialized.
export const appTreeConfiguration = new TreeViewConfiguration(
	// Schema for the root
	{ schema: Table },
);
