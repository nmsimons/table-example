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
 * A SharedTree object date-time
 */
export class DateTime extends sf.object("DateTime", {
	raw: sf.number,
}) {
	/**
	 * Get the date-time
	 */
	get value(): Date {
		return new Date(this.raw);
	}

	/**
	 * Set the raw date-time string
	 */
	set value(value: Date) {
		// Test if the value is a valid date
		if (isNaN(value.getTime())) {
			return;
		}
		this.raw = value.getTime();
	}
}

/**
 * A SharedTree object that allows users to vote
 */
export class Vote extends sf.object("Vote", {
	votes: sf.map(sf.string), // Map of votes
}) {
	/**
	 * Add a vote to the map of votes
	 * The key is the user id and the value is irrelevant
	 * @param vote The vote to add
	 */
	addVote(vote: string): void {
		if (this.votes.has(vote)) {
			return;
		}
		this.votes.set(vote, "");
	}

	/**
	 * Remove a vote from the map of votes
	 * @param vote The vote to remove
	 */
	removeVote(vote: string): void {
		if (!this.votes.has(vote)) {
			return;
		}
		this.votes.delete(vote);
	}

	/**
	 * Toggle a vote in the map of votes
	 */
	toggleVote(vote: string): void {
		if (this.votes.has(vote)) {
			this.removeVote(vote);
		} else {
			this.addVote(vote);
		}
	}

	/**
	 * Get the number of votes
	 * @returns The number of votes
	 */
	get numberOfVotes(): number {
		return this.votes.size;
	}

	/**
	 * Return whether the user has voted
	 * @param userId The user id
	 * @return Whether the user has voted
	 * */
	hasVoted(userId: string): boolean {
		return this.votes.has(userId);
	}
}

// Table schema - I wish I could create something like this for the Cell value and Column defaultValue
export type typeDefinition = string | number | boolean | DateTime | Vote;

/**
 * The Cell schema which should eventally support more types than just strings
 */
export class Cell extends sf.object("Cell", {
	id: sf.identifier,
	value: [sf.string, sf.number, sf.boolean, DateTime, Vote],
	props: sf.map([sf.number, sf.string, sf.boolean]),
}) {
	/**
	 * Property getter to get the row that the cell is in
	 */
	get row(): Row {
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
		const table = this.row.table;
		const column = table.columns.find((column) => column.id === this.columnId);
		if (Tree.is(column, Column)) return column;
		throw new Error("Column not found");
	}

	private get columnId(): string {
		for (const [key, value] of this.row.cells.entries()) {
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
	props: sf.map([sf.number, sf.string, sf.boolean]),
}) {
	/**
	 * Get the cells of this row as a JSON object
	 * Replace the key with the column name
	 * @param table The table that the row is in
	 * @returns The cells of this row as a JSON object
	 */
	getCellsAsJson(): Record<string, typeDefinition | string | number | boolean> {
		const cells: Record<string, typeDefinition | string | number | boolean> = {};
		for (const [key, value] of this.cells.entries()) {
			const column = this.table.getColumn(key);
			if (cells[column.name] === undefined) {
				cells[column.name] = value.value;
			} else {
				// If the column name already exists, use the column id
				cells[key] = value.value;
			}
		}
		return cells;
	}

	/**
	 * Get the props of this row as a JSON object
	 * @returns The props of this row as a JSON object
	 */
	getPropsAsJson(): Record<string, string | number | boolean> {
		const props: Record<string, string | number | boolean> = {};
		for (const [key, value] of this.props.entries()) {
			props[key] = value;
		}
		return props;
	}

	/**
	 * Get the cells and the props of this rows as a JSON object
	 * @returns The cells and the props of this rows as a JSON object
	 */
	getCellsAsJsonWithId(): Record<string, typeDefinition | string | number | boolean> {
		return { id: this.id, ...this.getCellsAsJson() };
	}

	/** Get a cell by the column id
	 * @param columnId The id of the column
	 * @returns The cell if it exists, otherwise undefined
	 * */
	getCell(columnId: string): Cell | undefined {
		return this.cells.get(columnId);
	}

	/**
	 * Initialize a cell with a value if it doesn't exist. If it does exist, return the cell without changing it
	 */
	initializeCell(columnId: string, value: typeDefinition): Cell {
		let cell = this.cells.get(columnId);
		if (cell) {
			return cell;
		} else {
			cell = new Cell({ value, props: {} });
			this.cells.set(columnId, cell);
		}
		return cell;
	}

	/**
	 * Delete a cell from the row
	 * @param columnId The id of the column
	 */
	deleteCell(columnId: string): void {
		this.cells.delete(columnId);
	}

	/**
	 * Get the value of a cell by the column id
	 * @param columnId The id of the column
	 * @returns The value of the cell if it exists, otherwise return the default value of the column
	 * which is defined in the column schema and may be undefined
	 */
	getValue(columnId: string): { value: typeDefinition | undefined; isDefault: boolean } {
		const cell = this.cells.get(columnId);
		if (cell) {
			return { value: cell.value, isDefault: false };
		}
		const column = this.table.getColumn(columnId);
		return { value: column.defaultValue, isDefault: true };
	}

	/**
	 * Move a row to a new location
	 * @param index The index to move the row to
	 * */
	moveTo(index: number): void {
		const rows = this.table?.rows;
		if (rows) {
			rows.insertAt(index, this);
		}
	}

	/**
	 * Get the parent Table
	 */
	get table(): Table {
		const parent = Tree.parent(this);
		if (parent) {
			const grandparent = Tree.parent(parent);
			if (Tree.is(grandparent, Table)) {
				return grandparent;
			}
		}
		throw new Error("Row is not in a table");
	}

	/**
	 * Get the index of the row in the table
	 * @returns The index of the row in the table
	 */
	get index(): number {
		const rows = this.table?.rows;
		if (rows) {
			return rows.indexOf(this);
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
	defaultValue: sf.optional([sf.string, sf.number, sf.boolean, DateTime, Vote]),
	hint: sf.optional(sf.string),
	props: sf.map([sf.number, sf.string, sf.boolean]),
}) {
	/**
	 * Get the parent Table
	 */
	get table(): Table {
		const parent = Tree.parent(this);
		if (parent) {
			const grandparent = Tree.parent(parent);
			if (Tree.is(grandparent, Table)) {
				return grandparent;
			}
		}
		throw new Error("Column is not in a table");
	}
	/**
	 * Get all the cells in this column
	 */
	get cells(): Cell[] {
		// Get all the cells in the column and put them in an array
		// omit the undefined values
		const cells = this.table.rows
			.map((row) => row.cells.get(this.id))
			.filter((cell) => cell !== undefined) as Cell[];
		return cells;
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
	 * Get a row by the id
	 * @param id The id of the row
	 */
	getRow(id: string): Row {
		const row = this.rows.find((row) => row.id === id);
		if (row) return row;
		throw new Error("Row not found");
	}

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
	 * @param rowId The id of the row to delete
	 */
	deleteRow(rowId: string): void {
		// Find the row by id
		const row = this.rows.find((row) => row.id === rowId);
		// Get the index of the row
		if (row) {
			const index = this.rows.indexOf(row);
			this.rows.removeAt(index);
		}
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
		return new Row({ cells: {}, props: {} });
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
	appendNewColumn(props: { name: string; defaultValue?: typeDefinition; hint?: string }): Column {
		// destructure the input
		const { name, defaultValue, hint } = props;

		const column = new Column({ name, props: {}, defaultValue, hint });
		this.columns.insertAtEnd(column);
		return column;
	}

	/**
	 * Insert a new column at a specific location
	 * @param index The index to insert the column at
	 * @param name The name of the column
	 * */
	insertNewColumn(index: number, name: string, defaultValue?: typeDefinition): Column {
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
			// TODO Remove the column from each row
			// Doing this in a transaction is too slow
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
