/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { TreeViewConfiguration, SchemaFactory, TreeArrayNode, Tree } from "fluid-framework";

// Schema is defined using a factory object that generates classes for objects as well
// as list and map nodes.

// Include a UUID to guarantee that this schema will be uniquely identifiable.
// As this schema uses a recursive type, the beta SchemaFactoryRecursive is used instead of just SchemaFactory.
const sf = new SchemaFactory("fc1db2e8-0a00-11ee-be56-0242ac120002");

/**
 * The Cell schema which should eventally support more types than just strings
 */
export class Cell extends sf.object("Cell", {
	id: sf.identifier,
	value: [sf.string, sf.number, sf.boolean],
}) {
	/**
	 * Property getter to get the row that the cell is in
	 */
	get parent(): Row {
		const parent = Tree.parent(this);
		if (parent !== undefined) {
			const grandparent = Tree.parent(parent);
			if (Tree.is(grandparent, Row)) {
				return grandparent;
			}
		}
		throw new Error("Cell is not in a row");
	}

	/**
	 * Get the column the cell is in
	 * */
	get column(): Column {
		const table = this.parent.parent;
		const column = table.columns.find((column) => column.id === this.columnId);
		if (Tree.is(column, Column)) return column;
		throw new Error("Column not found");
	}

	private get columnId(): string {
		for (const [key, value] of this.parent.cells.entries()) {
			if (value === this) {
				return key;
			}
		}
		throw new Error("ColumnId not found");
	}
}

/**
 * The Row schema - this is a map of Cells where the key is the column id
 */
export class Row extends sf.object("Row", {
	id: sf.identifier,
	cells: sf.map(Cell), // The keys of this map are the column ids
}) {
	/**
	 * Set the value of a cell. First test if it exists. If it doesn't exist, create it.
	 * @param columnId The id of the column
	 * @param value The value to set
	 * @returns The cell that was set
	 * */
	setValue(columnId: string, value: string | number | boolean): Cell {
		let cell = this.cells.get(columnId);
		if (cell) {
			cell.value = value;
		} else {
			cell = new Cell({ value });
			this.cells.set(columnId, cell);
		}
		return cell;
	}

	/** Get a cell by the column id
	 * @param columnId The id of the column
	 * @returns The cell if it exists, otherwise undefined
	 * */
	getCell(columnId: string): Cell | undefined {
		return this.cells.get(columnId);
	}

	/**
	 * Move a row to a new location
	 * @param index The index to move the row to
	 * */
	moveTo(index: number): void {
		const rows = this.parent?.rows;
		if (rows) {
			rows.insertAt(index, this);
		}
	}

	/**
	 * Get the parent Table
	 */
	get parent(): Table {
		const parent = Tree.parent(this);
		if (parent) {
			const grandparent = Tree.parent(parent);
			if (Tree.is(grandparent, Table)) {
				return grandparent;
			}
		}
		throw new Error("Row is not in a table");
	}
}

/**
 * The Column schema - this can include more properties as needed *
 */
export class Column extends sf.object("Column", {
	id: sf.identifier,
	name: sf.string,
	defaultValue: [sf.string, sf.number, sf.boolean],
	props: sf.map([sf.number, sf.string, sf.boolean]),
}) {
	get parent(): Table {
		const parent = Tree.parent(this);
		if (parent) {
			const grandparent = Tree.parent(parent);
			if (Tree.is(grandparent, Table)) {
				return grandparent;
			}
		}
		throw new Error("Column is not in a table");
	}
}

/**
 * The Table schema
 * */
export class Table extends sf.object("Table", {
	rows: sf.array(Row),
	columns: sf.array(Column),
}) {
	/**
	 *  Add a row to the table
	 * */
	appendNewRow(): Row {
		const row = this.createDetachedRow();
		this.appendDetachedRow(row);
		return row;
	}

	/**
	 * Insert a row at a specific location
	 * @param index The index to insert the row at
	 * */
	insertNewRow(index: number): Row {
		const row = this.createDetachedRow();
		this.insertDetachedRow(index, row);
		return row;
	}

	/**
	 * Delete a row from the table
	 * @param index The index of the row to delete
	 */
	deleteRow(index: number): void {
		this.rows.removeAt(index);
	}

	/**
	 * Delete all rows from the table
	 * */
	deleteAllRows(): void {
		this.rows.removeRange();
	}

	/**
	 * Create a Row before inserting it into the table
	 * */
	createDetachedRow(): Row {
		return new Row({ cells: {} });
	}

	/**
	 * Insert a detached Row into the table
	 * @param index The index to insert the row at
	 * */
	insertDetachedRow(index: number, row: Row): void {
		this.rows.insertAt(index, row);
	}

	/**
	 * Append a detached Row into the table
	 * @param row The row to append
	 * */
	appendDetachedRow(row: Row): void {
		this.rows.insertAtEnd(row);
	}

	/**
	 * Insert multiple detached Rows into the table
	 * @param index The index to insert the rows at
	 * @param rows The rows to insert
	 * */
	insertMultipleDetachedRows(index: number, rows: Row[]): void {
		this.rows.insertAt(index, TreeArrayNode.spread(rows));
	}

	/**
	 * Append multiple detached Rows into the table
	 * @param rows The rows to append
	 * */
	appendMultipleDetachedRows(rows: Row[]): void {
		this.rows.insertAtEnd(TreeArrayNode.spread(rows));
	}

	/**
	 * Add a column to the table
	 * @param name The name of the column
	 * */
	appendNewColumn(name: string, defaultValue: string | number | boolean): Column {
		const column = new Column({ name, props: {}, defaultValue });
		this.columns.insertAtEnd(column);
		return column;
	}

	/**
	 * Insert a new column at a specific location
	 * @param index The index to insert the column at
	 * @param name The name of the column
	 * */
	insertNewColumn(index: number, name: string, defaultValue: string | number | boolean): Column {
		const column = new Column({ name, props: {}, defaultValue });
		this.columns.insertAt(index, column);
		return column;
	}

	/**
	 * Get a column by the id
	 */
	getColumn(id: string): Column {
		const column = this.columns.find((column) => column.id === id);
		if (column) return column;
		throw new Error("Column not found");
	}

	/**
	 * Delete a column from the table
	 */
	deleteColumn(id: string): void {
		// Find the column by id
		const column = this.columns.find((column) => column.id === id);
		// Get the index of the column
		if (column) {
			const index = this.columns.indexOf(column);
			this.columns.removeAt(index);
		}
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
