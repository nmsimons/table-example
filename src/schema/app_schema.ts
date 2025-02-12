/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { TreeViewConfiguration, SchemaFactory, TreeArrayNode } from "fluid-framework";

// Schema is defined using a factory object that generates classes for objects as well
// as list and map nodes.

// Include a UUID to guarantee that this schema will be uniquely identifiable.
// As this schema uses a recursive type, the beta SchemaFactoryRecursive is used instead of just SchemaFactory.
const sf = new SchemaFactory("fc1db2e8-0a00-11ee-be56-0242ac120002");

export class Cell extends sf.object("Cell", {
	id: sf.identifier,
	value: sf.string,
}) {}

export class Row extends sf.object("Row", {
	id: sf.identifier,
	cells: sf.map(Cell),
}) {
	// Set the value of a cell. First test if it exists. If it doesn't exist, create it.
	setValue(columnId: string, value: string): Cell {
		let cell = this.cells.get(columnId);
		if (cell) {
			cell.value = value;
		} else {
			cell = new Cell({ value });
			this.cells.set(columnId, cell);
		}
		return cell;
	}

	// Get a cell by the column id
	getCell(columnId: string): Cell | undefined {
		return this.cells.get(columnId);
	}
}

export class Column extends sf.object("Column", {
	id: sf.identifier,
	name: sf.string,
}) {}

export class Table extends sf.object("Table", {
	rows: sf.array("Rows", Row),
	columns: sf.array("Columns", Column),
}) {
	/**
	 *  Add a row to the table
	 **/
	appendNewRow(): Row {
		const row = new Row({ cells: {} });
		this.rows.insertAtEnd(row);
		return row;
	}

	/**
	 * Insert a row at a specific location
	 **/
	insertNewRow(index: number): Row {
		const row = new Row({ cells: {} });
		this.rows.insertAt(index, row);
		return row;
	}

	/**
	 * Create a Row before inserting it into the table
	 **/
	createDetachedRow(): Row {
		return new Row({ cells: {} });
	}

	/**
	 * Insert a detached Row into the table
	 **/
	insertDetachedRow(index: number, row: Row): void {
		this.rows.insertAt(index, row);
	}

	/**
	 * Append a detached Row into the table
	 **/
	appendDetachedRow(row: Row): void {
		this.rows.insertAtEnd(row);
	}

	/**
	 * Insert multiple detached Rows into the table
	 **/
	insertMultipleDetachedRows(index: number, rows: Row[]): void {
		this.rows.insertAt(index, TreeArrayNode.spread(rows));
	}

	/**
	 * Append multiple detached Rows into the table
	 **/
	appendMultipleDetachedRows(rows: Row[]): void {
		this.rows.insertAtEnd(TreeArrayNode.spread(rows));
	}

	/**
	 * Add a column to the table
	 **/
	appendNewColumn(name: string): Column {
		const column = new Column({ name });
		this.columns.insertAtEnd(column);
		return column;
	}

	/**
	 * Insert a new column at a specific location
	 **/
	insertNewColumn(index: number, name: string): Column {
		const column = new Column({ name });
		this.columns.insertAt(index, column);
		return column;
	}
}

/**
 * Export the tree config appropriate for this schema.
 * This is passed into the SharedTree when it is initialized.
 * */
export const appTreeConfiguration = new TreeViewConfiguration(
	// Schema for the root
	{ schema: Table },
);
