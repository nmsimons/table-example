/* eslint-disable @typescript-eslint/no-unused-vars */
import {
	ColumnDef,
	createColumnHelper,
	useReactTable,
	getCoreRowModel,
	Table,
	Header,
	Row,
	Cell,
	getSortedRowModel,
	SortingFnOption,
	SortDirection,
	Column,
	SortingFn,
} from "@tanstack/react-table";
import React, { JSX, useState, useEffect, use } from "react";
import {
	Table as FluidTable,
	Row as FluidRow,
	Column as FluidColumn,
	Cell as FluidCell,
	DateTime,
	typeDefinition,
} from "../schema/app_schema.js";
import { Tree } from "fluid-framework";
import { useVirtualizer, VirtualItem, Virtualizer } from "@tanstack/react-virtual";
import { ColumnTypeDropdown, DeleteButton, IconButton } from "./buttonux.js";
import {
	ArrowSortDownFilled,
	ArrowSortFilled,
	ArrowSortUpFilled,
	ReOrderDotsVertical16Filled,
} from "@fluentui/react-icons";
import { SelectionManager } from "../utils/presence.js";

const leftColumnWidth = "20px"; // Width of the index column
const columnWidth = "200px"; // Width of the data columns

export function TableView(props: {
	fluidTable: FluidTable;
	selection: SelectionManager;
}): JSX.Element {
	const { fluidTable } = props;
	const [data, setData] = useState<FluidRow[]>(
		fluidTable.rows.map((row) => {
			return row;
		}),
	);
	const [columns, setColumns] = useState<ColumnDef<FluidRow, cellValue>[]>(
		updateColumnData(fluidTable.columns.map((column) => column)),
	);

	// Register for tree deltas when the component mounts. Any time the rows change, the app will update.
	useEffect(() => {
		const unsubscribe = Tree.on(fluidTable.rows, "treeChanged", () => {
			setData(fluidTable.rows.map((row) => row));
		});
		return unsubscribe;
	}, [fluidTable.rows]);

	// Register for tree deltas when the component mounts. Any time the columns change, the app will update.
	useEffect(() => {
		const unsubscribe = Tree.on(fluidTable.columns, "treeChanged", () => {
			setColumns(updateColumnData(fluidTable.columns.map((column) => column)));
		});
		return unsubscribe;
	}, [fluidTable.columns]);

	// The virtualizer will need a reference to the scrollable container element
	const tableContainerRef = React.useRef<HTMLDivElement>(null);

	const table = useReactTable({
		data,
		columns,
		getRowId: (originalRow) => originalRow.id,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(), //provide a sorting row model
	});

	return (
		<div
			ref={tableContainerRef}
			className="h-[calc(100vh-200px)] w-5/6 overflow-auto mx-auto mt-8 border-2 border-black rounded-sm shadow-sm"
		>
			<table
				style={{ display: "grid" }}
				className="table-auto w-full border-collapse border-b-2 border-gray-200"
			>
				<TableHeadersView table={table} fluidTable={fluidTable} />
				<TableBodyView
					table={table}
					tableContainerRef={tableContainerRef}
					selection={props.selection}
				/>
			</table>
		</div>
	);
}

export function TableHeadersView(props: {
	table: Table<FluidRow>;
	fluidTable: FluidTable;
}): JSX.Element {
	const { table, fluidTable } = props;

	return (
		<thead
			style={{
				display: "grid",
				zIndex: 4,
			}}
			className="bg-gray-200 sticky top-0 min-h-[36px] w-full inline-flex items-center shadow-sm z-2"
		>
			{table.getHeaderGroups().map((headerGroup) => (
				<tr style={{ display: "flex", width: "100%" }} key={headerGroup.id}>
					{headerGroup.headers.map((header) =>
						header.id === "index" ? (
							<IndexHeaderView key="index" />
						) : (
							<TableHeaderView
								key={header.id}
								header={header}
								fluidTable={fluidTable}
							/>
						),
					)}
				</tr>
			))}
		</thead>
	);
}

export function IndexHeaderView(): JSX.Element {
	return (
		<th
			style={{
				display: "flex",
				minWidth: leftColumnWidth,
				width: leftColumnWidth,
			}}
			className="p-1"
		></th>
	);
}

export function TableHeaderView(props: {
	header: Header<FluidRow, unknown>;
	fluidTable: FluidTable;
}): JSX.Element {
	const { header, fluidTable } = props;
	const fluidColumn = fluidTable.getColumn(header.column.id);

	return (
		<th
			style={{
				display: "flex",
				minWidth: columnWidth,
				width: columnWidth,
				maxWidth: columnWidth,
			}}
			className="p-1"
		>
			<div className="flex flex-row justify-between w-full gap-x-1">
				<input
					id={fluidColumn.id}
					className="outline-none w-full h-full truncate"
					value={fluidColumn.name}
					onChange={(e) => {
						fluidColumn.name = e.target.value;
					}}
				></input>
				<div>
					<ColumnTypeDropdown column={fluidColumn} />
				</div>
				<div>
					<SortButton column={header.column} />
				</div>
				<div>
					<DeleteButton
						delete={() => {
							header.column.clearSorting();
							fluidColumn.table.deleteColumn(fluidColumn.id);
						}}
					/>
				</div>
			</div>
		</th>
	);
}

export function SortButton(props: { column: Column<FluidRow> }): JSX.Element {
	const { column } = props;
	const [sorted, setSorted] = useState(column.getIsSorted());

	useEffect(() => {
		setSorted(column.getIsSorted());
	}, [column.getIsSorted()]);

	const handleClick = (e: React.MouseEvent) => {
		const sortingFn = column.getToggleSortingHandler();
		if (sortingFn) {
			sortingFn(e);
		}
	};

	return (
		<IconButton
			background="bg-transparent"
			color="black"
			handleClick={handleClick}
			icon={<SortIndicator sorted={sorted} />}
			toggled={sorted !== false}
		/>
	);
}

export function SortIndicator(props: { sorted: false | SortDirection }): JSX.Element {
	const { sorted } = props;
	if (sorted === "asc") {
		return <ArrowSortUpFilled />;
	} else if (sorted === "desc") {
		return <ArrowSortDownFilled />;
	} else {
		return <ArrowSortFilled />;
	}
}

export function TableBodyView(props: {
	table: Table<FluidRow>;
	tableContainerRef: React.RefObject<HTMLDivElement | null>;
	selection: SelectionManager;
}): JSX.Element {
	const { table, tableContainerRef, selection } = props;
	const { rows } = table.getRowModel();

	const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
		count: rows.length,
		estimateSize: () => 36, //estimate row height for accurate scrollbar dragging
		getScrollElement: () => tableContainerRef.current,
		//measure dynamic row height, except in firefox because it measures table border height incorrectly
		measureElement:
			typeof window !== "undefined" && navigator.userAgent.indexOf("Firefox") === -1
				? (element) => element?.getBoundingClientRect().height
				: undefined,
		overscan: 5,
	});

	return (
		<tbody
			style={{
				display: "grid",
				height: `${rowVirtualizer.getTotalSize()}px`, //tells scrollbar how big the table is
				position: "relative", //needed for absolute positioning of rows
			}}
		>
			{rowVirtualizer.getVirtualItems().map((virtualRow) => {
				const row = rows[virtualRow.index] as Row<FluidRow>;
				return (
					<TableRowView
						key={row.id}
						row={row}
						virtualRow={virtualRow}
						rowVirtualizer={rowVirtualizer}
						selection={selection}
					/>
				);
			})}
		</tbody>
	);
}

export function TableRowView(props: {
	row: Row<FluidRow>;
	virtualRow: VirtualItem;
	rowVirtualizer: Virtualizer<HTMLDivElement, HTMLTableRowElement>;
	selection: SelectionManager;
}): JSX.Element {
	const { row, virtualRow, rowVirtualizer, selection } = props;

	const style = { transform: `translateY(${virtualRow.start}px)` };

	// Get the fluid row from the row
	const fluidRow = row.original;

	const [isSelected, setIsSelected] = useState(selection.testSelection(fluidRow.id));
	const [isRemoteSelected, setIsRemoteSelected] = useState(
		selection.testRemoteSelection(fluidRow.id),
	);
	const [childIsSelected, setChildIsSelected] = useState(false);

	useEffect(() => {
		selection.addEventListener("selectionChanged", () => {
			setIsSelected(selection.testSelection(row.id));
			setIsRemoteSelected(selection.testRemoteSelection(row.id));
		});
	}, []);

	return (
		<tr
			key={row.id}
			data-index={virtualRow.index} //needed for dynamic row height measurement
			ref={(node) => {
				rowVirtualizer.measureElement(node);
			}} //measure dynamic row height
			style={{
				...style,
				display: "flex",
				position: "absolute",
				width: "100%",
				height: `${virtualRow.size}px`,
				...(isSelected ? { zIndex: 3 } : {}),
				...(childIsSelected ? { zIndex: 2 } : {}),
			}}
			className={`${isSelected ? "outline-2 outline-blue-300" : ""}  w-full even:bg-white odd:bg-gray-100`}
		>
			{row
				.getVisibleCells()
				.map((cell) =>
					cell.column.id === "index" ? (
						<IndexCellView key="index" rowId={row.id} selection={selection} />
					) : (
						<TableCellView
							key={cell.id}
							cell={cell as Cell<FluidRow, cellValue>}
							selection={selection}
							setChildIsSelected={setChildIsSelected}
						/>
					),
				)}
		</tr>
	);
}

export function IndexCellView(props: { selection: SelectionManager; rowId: string }): JSX.Element {
	const { selection, rowId } = props;

	// handle a click event in the cell
	const handleClick = (e: React.MouseEvent) => {
		if (e.ctrlKey) {
			selection.appendSelection(rowId);
		} else {
			selection.updateSelection(rowId);
		}
	};

	return (
		// Center the div in the cell and center the icon in the div
		<td
			onClick={(e) => handleClick(e)}
			style={{
				display: "flex",
				minWidth: leftColumnWidth,
				width: leftColumnWidth,
			}}
			className="bg-gray-200 hover:bg-gray-400 border-collapse z-0"
		>
			<div
				className={`flex w-full h-full justify-center items-center text-gray-400 hover:text-gray-800`}
			>
				<ReOrderDotsVertical16Filled />
			</div>
		</td>
	);
}

export function TableCellView(props: {
	cell: Cell<FluidRow, cellValue>;
	selection: SelectionManager;
	setChildIsSelected: (arg: boolean) => void;
}): JSX.Element {
	const { cell, selection, setChildIsSelected } = props;

	const [isSelected, setIsSelected] = useState(selection.testSelection(cell.id));
	const [isRemoteSelected, setIsRemoteSelected] = useState(
		selection.testRemoteSelection(cell.id),
	);

	useEffect(() => {
		selection.addEventListener("selectionChanged", () => {
			setIsSelected(selection.testSelection(cell.id));
			setIsRemoteSelected(selection.testRemoteSelection(cell.id));
		});
	}, []);

	useEffect(() => {
		setChildIsSelected(
			selection.testSelection(cell.id) || selection.testRemoteSelection(cell.id),
		);
	}, [isSelected, isRemoteSelected]);

	// handle a click event in the cell
	const handleFocus = () => {
		selection.updateSelection(cell.id);
		//setChildIsSelected(true);
	};

	const handleBlur = () => {
		selection.clearSelection();
		//setChildIsSelected(false);
	};

	return (
		<td
			onFocus={handleFocus}
			onBlur={handleBlur}
			style={{
				display: "flex",
				position: "relative",
				minWidth: columnWidth,
				width: columnWidth,
				maxWidth: columnWidth,
				...(isSelected ? { zIndex: 1000 } : {}),
				...(isRemoteSelected ? { zIndex: 900 } : {}),
			}}
			className={`flex p-1 border-collapse border-r-2`}
		>
			<PresenceBox color="blue" shade={600} width={2} offset={0} hidden={!isSelected} />
			<PresenceBox color="gray" shade={400} width={2} offset={2} hidden={!isRemoteSelected} />
			<TableCellViewContent key={cell.id} cell={cell} />
		</td>
	);
}

export function TableCellViewContent(props: { cell: Cell<FluidRow, cellValue> }): JSX.Element {
	const { cell } = props;
	const data = cell.row.original;
	const fluidColumn = data.table.getColumn(cell.column.id);
	const value = data.getValue(cell.column.id).value;

	if (typeof value === "boolean") {
		return <CellInputBoolean value={value} cell={cell} />;
	} else if (typeof value === "number") {
		return <CellInputNumber value={value} cell={cell} />;
	} else if (typeof value === "string") {
		return <CellInputString value={value} cell={cell} />;
	}
	// If the value is undefined and the column hint is date, display a date input
	else if (value === undefined && fluidColumn.props.get("hint") === "date") {
		return <CellInputDate value={value} cell={cell} />;
	} else if (value instanceof DateTime) {
		return <CellInputDate value={value} cell={cell} />;
	}

	return <></>;
}

// Input field for a cell with a boolean value
export function CellInputBoolean(props: {
	value: boolean;
	cell: Cell<FluidRow, cellValue>;
}): JSX.Element {
	const { value, cell } = props;
	const data = cell.row.original;

	// handle a change event in the cell
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setValue(data, cell.column.id, e.target.checked);
	};

	return (
		// Layout the checkbox and label in a flex container and align the checkbox to the left
		<label className="flex items-center w-full h-full p-1 gap-x-2">
			<input
				id={cell.id}
				className="outline-none w-4 h-4"
				type="checkbox"
				checked={value ?? false}
				onChange={handleChange}
			></input>
			{data.table.getColumn(cell.column.id).props.get("label")}
		</label>
	);
}

// Input field for a string cell
export function CellInputString(props: {
	value: string;
	cell: Cell<FluidRow, cellValue>;
}): JSX.Element {
	const { value, cell } = props;
	const data = cell.row.original;

	// handle a change event in the cell
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setValue(data, cell.column.id, e.target.value);
	};

	return (
		<input
			id={cell.id}
			className="outline-none w-full h-full"
			type="text"
			value={value ?? ""}
			onChange={handleChange}
		></input>
	);
}

// Input field for a string cell
export function CellInputNumber(props: {
	value: number;
	cell: Cell<FluidRow, cellValue>;
}): JSX.Element {
	const { value, cell } = props;
	const data = cell.row.original;

	// handle a change event in the cell
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		// convert the value to a number
		const num = parseFloat(e.target.value);
		if (!isNaN(num)) {
			setValue(data, cell.column.id, num);
		}
	};

	return (
		<input
			inputMode="numeric"
			id={cell.id}
			className="outline-none w-full h-full"
			type="number"
			value={value ?? 0}
			onChange={handleChange}
		></input>
	);
}

export function CellInputDate(props: {
	value: DateTime | undefined;
	cell: Cell<FluidRow, cellValue>;
}): JSX.Element {
	const { value, cell } = props;
	const data = cell.row.original;

	const date = value?.value?.toISOString().split("T")[0] ?? "";

	// handle a change event in the cell
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const fluidCell = data.getCell(cell.column.id);
		// Test if the target value is a valid date
		if (isNaN(Date.parse(e.target.value))) {
			if (fluidCell !== undefined) {
				if (Tree.is(fluidCell.value, DateTime)) {
					data.deleteCell(cell.column.id);
					return;
				}
			}
		}
		// If the cell is undefined, initialize it with the new date
		// Otherwise, update the existing
		// Generate a new Date from the target value
		const d: Date = new Date(e.target.value);
		if (fluidCell === undefined) {
			data.initializeCell(cell.column.id, new DateTime({ raw: d.getTime() }));
		} else {
			if (Tree.is(fluidCell.value, DateTime)) {
				fluidCell.value.value = d;
			}
		}
	};

	return (
		<input
			id={cell.id}
			className="outline-none w-full h-full"
			type="date"
			value={date}
			onChange={handleChange}
		></input>
	);
}

export function PresenceBox(props: {
	color: string;
	shade: number;
	width: number;
	offset: number;
	hidden: boolean;
}): JSX.Element {
	const { color, shade, width, offset, hidden } = props;
	return (
		<div
			style={{
				zIndex: 1000,
			}}
			className={`absolute pointer-events-none inset-0 outline-${color}-${shade} outline-${width}  outline-offset-${offset}
			${hidden ? "hidden" : ""} opacity-50`}
		></div>
	);
}

type cellValue = typeDefinition; // Define the allowed cell value types

const updateColumnData = (columnsArray: FluidColumn[]) => {
	// Create a column helper based on the columns in the table
	const columnHelper = createColumnHelper<FluidRow>();

	// Create an array of ColumnDefs based on the columns in the table using
	// the column helper
	const headerArray: ColumnDef<FluidRow, cellValue>[] = [];
	// Add the index column
	const d = columnHelper.display({
		id: "index",
	});
	headerArray.push(d);

	// Add the data columns
	columnsArray.forEach((column) => {
		const sortingConfig = getSortingConfig(column);
		headerArray.push(
			columnHelper.accessor(
				(row) => {
					return row.getValue(column.id).value ?? "";
				},
				{
					id: column.id,
					header: column.name,
					sortingFn: sortingConfig.fn,
					sortDescFirst: sortingConfig.desc,
					sortUndefined: "last",
				},
			),
		);
	});

	return headerArray;
};

// Custom sorting function for DateTime objects because
// the default alphanumeric sorting function does not work
// because the data is accessed via a second layer of the object
const dateSortingFn: SortingFn<FluidRow> = (
	rowA: Row<FluidRow>,
	rowB: Row<FluidRow>,
	columnId: string,
) => {
	const valueA = rowA.getValue(columnId) as { value: DateTime | undefined };
	const valueB = rowB.getValue(columnId) as { value: DateTime | undefined };
	if (valueA === undefined && valueB === undefined) {
		return 0;
	} else if (valueA === undefined) {
		return 1;
	} else if (valueB === undefined) {
		return -1;
	} else if (Tree.is(valueA, DateTime) && Tree.is(valueB, DateTime)) {
		const dateA = valueA.value;
		const dateB = valueB.value;
		if (dateA < dateB) {
			return -1;
		} else if (dateA > dateB) {
			return 1;
		} else {
			return 0;
		}
	}
	return 0;
};

// Get the sorting function and sort direction for a column
const getSortingConfig = (
	column: FluidColumn,
): { fn: SortingFnOption<FluidRow> | undefined; desc: boolean } => {
	if (typeof column.defaultValue === "boolean") {
		return { fn: "basic", desc: false };
	} else if (typeof column.defaultValue === "number") {
		return { fn: "alphanumeric", desc: false };
	} else if (typeof column.defaultValue === "string") {
		return { fn: "alphanumeric", desc: false };
	} else if (column.props.get("hint") === "date") {
		return { fn: dateSortingFn, desc: false };
	} else {
		console.error("Unknown column type");
		return { fn: "basic", desc: false };
	}
};

/**
 * Set the value of a cell. First test if it exists. If it doesn't exist, create it.
 * This will overwrite the value of the cell so if the value isn't a primitive, don't use this.
 * @param columnId The id of the column
 * @param value The value to set
 * @returns The cell that was set
 * */
export const setValue = (
	row: FluidRow,
	columnId: string,
	value: string | number | boolean,
): FluidCell => {
	const cell = row.cells.get(columnId);
	if (cell) {
		cell.value = value;
		return cell;
	} else {
		return row.initializeCell(columnId, value);
	}
};
