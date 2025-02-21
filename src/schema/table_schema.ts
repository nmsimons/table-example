import {
	TreeNodeFromImplicitAllowedTypes,
	TreeArrayNode,
	Tree,
	SchemaFactory,
	ImplicitAllowedTypes,
	InsertableTreeNodeFromImplicitAllowedTypes,
} from "fluid-framework";

// Schema is defined using a factory object that generates classes for objects as well
// as list and map nodes.

export function makeTable<T extends ImplicitAllowedTypes>(sf: SchemaFactory, schemaTypes: T) {
	// Create a new table based on the SharedTree schema in this file
	// The table will be empty and will have no columns
	// The types allowed in the table are defined in the schemaTypes array
	// The table will be initialized with the types allowed in the table

	type CellValueType = TreeNodeFromImplicitAllowedTypes<T>;
	type CellInsertableType = InsertableTreeNodeFromImplicitAllowedTypes<T>;

	/**
	 * The Cell schema which should eventally support more types than just strings
	 */
	class Cell extends sf.object("Cell", {
		id: sf.identifier,
		value: sf.required(schemaTypes),
		props: sf.map([sf.number, sf.string, sf.boolean]),
	}) {
		/**
		 * Property getter to get the row that the cell is in
		 */
		get row(): Row {
			const parent = Tree.parent(this);
			if (parent !== undefined) {
				const grandparent = Tree.parent(parent);
				if (grandparent instanceof Row) {
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
			if (column instanceof Column) return column;
			throw new Error("Column not found");
		}

		private get columnId(): string {
			for (const [key, value] of this.row._cells.entries()) {
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

	class Row extends sf.object("Row", {
		id: sf.identifier,
		_cells: sf.map(Cell), // The keys of this map are the column ids
		props: sf.map([sf.number, sf.string, sf.boolean]),
	}) {
		/**
		 * Get the cells of this row as a JSON object
		 * Replace the key with the column name
		 * @param table The table that the row is in
		 * @returns The cells of this row as a JSON object
		 */
		// getCellsAsJson(): Record<string, typeDefinition> {
		// 	const cells: Record<string, typeDefinition> = {};
		// 	for (const [key, value] of this._cells.entries()) {
		// 		const column = this.table.getColumn(key);
		// 		if (cells[column.name] === undefined) {
		// 			cells[column.name] = value.value;
		// 		} else {
		// 			// If the column name already exists, use the column id
		// 			cells[key] = value.value;
		// 		}
		// 	}
		// 	return cells;
		// }

		/**
		 * Get the props of this row as a JSON object
		 * @returns The props of this row as a JSON object
		 */
		// getPropsAsJson(): Record<string, string | number | boolean> {
		// 	const props: Record<string, string | number | boolean> = {};
		// 	for (const [key, value] of this.props.entries()) {
		// 		props[key] = value;
		// 	}
		// 	return props;
		// }

		/**
		 * Get the cells and the props of this rows as a JSON object
		 * @returns The cells and the props of this rows as a JSON object
		 */
		// getCellsAsJsonWithId(): Record<string, typeDefinition | string | number | boolean> {
		// 	return { id: this.id, ...this.getCellsAsJson() };
		// }

		/** Get a cell by the column id
		 * @param column The id of the column
		 * @returns The cell if it exists, otherwise undefined
		 * */
		getCell(column: Column): Cell | undefined {
			return this._cells.get(column.id);
		}

		/**
		 * Initialize a cell with a value if it doesn't exist. If it does exist, return the cell without changing it
		 */
		initializeCell(column: Column, value: CellInsertableType): Cell {
			let cell = this._cells.get(column.id);
			if (cell) {
				return cell;
			} else {
				cell = new Cell({ value, props: {} });
				this._cells.set(column.id, cell);
			}
			return cell;
		}

		/**
		 * Delete a cell from the row
		 * @param column The column
		 */
		deleteCell(column: Column): void {
			this._cells.delete(column.id);
		}

		/**
		 * Get the value of a cell by the column id
		 * @param column The column
		 * @returns The value of the cell if it exists, otherwise return the default value of the column
		 * which is defined in the column schema and may be undefined
		 */
		getValue(column: Column): { value: CellValueType | undefined; isDefault: boolean } {
			const cell = this._cells.get(column.id);
			if (cell) {
				return { value: cell.value, isDefault: false };
			}
			return { value: column.defaultValue, isDefault: true };
		}

		/**
		 * Move a row to a new location
		 * @param index The index to move the row to
		 * */
		moveTo(index: number): void {
			const rows = this.table.rows;
			if (index > this.index) {
				index += 1; // If the index is greater than the current index, move it to the right
			}

			// Make sure the index is within the bounds of the table
			if (index < 0 && this.index > 0) {
				rows.moveToStart(this.index);
				return;
			}
			if (index > rows.length - 1 && this.index < rows.length - 1) {
				rows.moveToEnd(this.index);
				return;
			}
			if (index < 0 || index >= rows.length) {
				return; // If the index is out of bounds, do nothing
			}
			rows.moveToIndex(index, this.index);
		}

		moveBefore(row: Row): void {
			const rows = this.table.rows;
			const index = rows.indexOf(row);
			if (index < 0) {
				return; // If the row is not in the table, do nothing
			}
			this.moveTo(index);
		}

		moveAfter(row: Row): void {
			const rows = this.table.rows;
			const index = rows.indexOf(row);
			if (index < 0) {
				return; // If the row is not in the table, do nothing
			}
			this.moveTo(index + 1);
		}

		/**
		 * Get the parent Table
		 */
		get table(): Table {
			const parent = Tree.parent(this);
			if (parent) {
				const grandparent = Tree.parent(parent);
				if (grandparent instanceof Table) {
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

	class Column extends sf.object("Column", {
		id: sf.identifier,
		name: sf.string,
		defaultValue: sf.optional(schemaTypes),
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
				if (grandparent instanceof Table) {
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
				.map((row) => row._cells.get(this.id))
				.filter((cell) => cell !== undefined) as Cell[];
			return cells;
		}
	}
	/**
	 * The Table schema
	 * */

	class Table extends sf.object("Table", {
		rows: sf.array(Row),
		columns: sf.array(Column),
	}) {
		public static readonly Row = Row;
		public static readonly Column = Column;
		public static readonly Cell = Cell;

		/**
		 * Get a row by the id
		 * @param id The id of the row
		 */
		getRow(id: string): Row | undefined {
			const row = this.rows.find((row) => row.id === id);
			if (row) return row;
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
			return new Row({ _cells: {}, props: {} });
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
		appendNewColumn(props: {
			name: string;
			defaultValue?: CellInsertableType;
			hint?: string;
		}): Column {
			// destructure the input
			const { name, defaultValue, hint } = props;
			return this.insertNewColumn({ index: this.columns.length, name, defaultValue, hint });
		}

		/**
		 * Insert a new column at a specific location
		 * @param index The index to insert the column at
		 * @param name The name of the column
		 * */
		insertNewColumn(props: {
			index: number;
			name: string;
			defaultValue?: CellInsertableType;
			hint?: string;
		}): Column {
			const { index, name, defaultValue, hint } = props;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = new Column({ props: {}, name, defaultValue, hint } as any);
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

	// Return the table schema
	return Table;
}
