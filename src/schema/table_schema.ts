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

export function Table<T extends ImplicitAllowedTypes, Scope extends string | undefined>(
	sf: SchemaFactory<Scope>,
	schemaTypes: T,
) {
	// Create a new table based on the SharedTree schema in this file
	// The table will be empty and will have no columns
	// The types allowed in the table are defined in the schemaTypes array
	// The table will be initialized with the types allowed in the table

	type CellValueType = TreeNodeFromImplicitAllowedTypes<T>;
	type CellInsertableType = InsertableTreeNodeFromImplicitAllowedTypes<T>;

	/**
	 * The Cell
	 */
	class Cell extends sf.object("Cell", {
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
		 * Property getter to get the sythetic id of the cell
		 * This is the id of the column that the cell is in combined
		 * with the id of the row that the cell is in in the format of rowId_columnId
		 * This is used to identify the cell in the table
		 * */
		get id(): `${string}_${string}` {
			const column = this.column;
			const row = this.row;
			if (column && row) {
				return `${row.id}_${column.id}`;
			}
			throw new Error("Cell is not in a row or column");
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
		_cells: sf.map(Cell), // The keys of this map are the column ids - this would ideally be private
		props: sf.map([sf.number, sf.string, sf.boolean]),
	}) {
		/**
		 * Property getter to get the cells in the row
		 * @returns The cells in the row as an object where the keys are the column ids
		 * and the values are the cell values
		 */
		get cells(): Record<string, CellValueType> {
			const cells: Record<string, CellValueType> = {};
			for (const [key, value] of this._cells.entries()) {
				cells[key] = value.value;
			}
			return cells;
		}

		/** Get a cell by the column
		 * @param column The column
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

		/**
		 * Get the synthetic id of a cell in the row by the column.
		 * This is the id of the column that the cell is in combined
		 * with the id of the row that the cell is in in the format of rowId_columnId
		 * This is used to identify the cell in the table
		 * @param column The column
		 */
		getCellId(column: Column): `${string}_${string}` {
			const columnId = column.id;
			const rowId = this.id;
			return `${rowId}_${columnId}`;
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

		/**
		 * Get the index of the column in the table
		 * @returns The index of the column in the table
		 */
		get index(): number {
			const columns = this.table?.columns;
			if (columns) {
				return columns.indexOf(this);
			}
			throw new Error("Column is not in a table");
		}

		/**
		 * Move a column to a new location
		 * @param index The index to move the column to
		 * */
		moveTo(index: number): void {
			const columns = this.table.columns;
			if (index > this.index) {
				index += 1; // If the index is greater than the current index, move it to the right
			}

			// Make sure the index is within the bounds of the table
			if (index < 0 && this.index > 0) {
				columns.moveToStart(this.index);
				return;
			}
			if (index > columns.length - 1 && this.index < columns.length - 1) {
				columns.moveToEnd(this.index);
				return;
			}
			if (index < 0 || index >= columns.length) {
				return; // If the index is out of bounds, do nothing
			}
			columns.moveToIndex(index, this.index);
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
		 * Get a cell by the row and column
		 * @param row The row
		 * @param column The column
		 */
		getCell(row: Row, column: Column): Cell | undefined {
			const cell = row.getCell(column);
			if (cell) return cell;
			// If the cell does not exist return undefined
			return undefined;
		}

		/**
		 * Get a cell by the synthetic id
		 * @param id The synthetic id of the cell
		 */
		getCellById(id: `${string}_${string}`): Cell | undefined {
			const [rowId, columnId] = id.split("_");
			const row = this.getRow(rowId);
			if (row) {
				const column = this.getColumn(columnId);
				if (column) {
					return row.getCell(column);
				}
			}
			// If the cell does not exist return undefined
			return undefined;
		}

		/**
		 * Get the synthetic id of a cell in the table by the row and column.
		 * This is the id of the column that the cell is in combined
		 * with the id of the row that the cell is in in the format of rowId_columnId
		 * This is used to identify the cell in the table
		 * @param row The row
		 * @param column The column
		 * @returns The synthetic id of the cell
		 */
		getCellId(row: Row, column: Column): `${string}_${string}` {
			const columnId = column.id;
			const rowId = row.id;
			return `${rowId}_${columnId}`;
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
		 * @param row The row to delete
		 */
		deleteRow(row: Row): void {
			const index = this.rows.indexOf(row);
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
		deleteColumn(column: Column): void {
			const index = this.columns.indexOf(column);
			this.columns.removeAt(index);
			// TODO Remove the column from each row
			// Doing this in a transaction is too slow
		}
	}

	// Return the table schema
	return Table;
}
