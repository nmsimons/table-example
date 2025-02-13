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
}) {}

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
		const rows = this.getRows();
		if (rows) {
			rows.insertAt(index, this);
		}
	}

	/**
	 * Get the parent Rows node
	 */
	getRows(): Rows | undefined {
		const parent = Tree.parent(this);
		if (Tree.is(parent, Rows)) {
			return parent;
		}
	}

	/**
	 * Get the parent Table node
	 * */
	getTable(): Table | undefined {
		const rows = this.getRows();
		if (rows) {
			const table = Tree.parent(rows);
			if (Tree.is(table, Table)) {
				return table;
			}
		}
	}
}

/**
 * The Column schema - this can include more properties as needed *
 */
export class Column extends sf.object("Column", {
	id: sf.identifier,
	name: sf.string,
	type: sf.optional(sf.string), // must be "string", "number", or "boolean"
}) {
	// Sets the value of type to string, boolean, or number
	setType(type: "string" | "boolean" | "number"): void {
		if (type === "string" || type === "number" || type === "boolean") {
			this.type = type;
		}
	}

	// Gets the value of type
	getType(): string {
		if (!this.type) {
			return "string";
		}
		return this.type;
	}
}

/**
 * The Rows schema - an array of Row objects
 */
export class Rows extends sf.array("Rows", Row) {}

/**
 * The Columns schema - an array of Column objects
 */
export class Columns extends sf.array("Columns", Column) {}

/**
 * The Table schema
 * */
export class Table extends sf.object("Table", {
	rows: Rows,
	columns: Columns,
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
	appendNewColumn(name: string): Column {
		const column = new Column({ name });
		this.columns.insertAtEnd(column);
		return column;
	}

	/**
	 * Insert a new column at a specific location
	 * @param index The index to insert the column at
	 * @param name The name of the column
	 * */
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
