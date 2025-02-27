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
import React, { JSX, useState, useEffect, use, useCallback } from "react";
import {
	DateTime,
	Vote,
	FluidTable,
	FluidRow,
	FluidColumn,
	typeDefinition,
} from "../schema/app_schema.js";
import { IMember, Tree } from "fluid-framework";
import { useVirtualizer, VirtualItem, Virtualizer } from "@tanstack/react-virtual";
import { ColumnTypeDropdown, DeleteButton, IconButton } from "./buttonux.js";
import {
	ArrowSortDownFilled,
	ArrowSortFilled,
	ArrowSortUpFilled,
	ReOrderDotsVertical16Filled,
} from "@fluentui/react-icons";
import { SelectionManager } from "../utils/presence.js";
import { createPortal } from "react-dom";
import {
	CellInputBoolean,
	CellInputNumber,
	CellInputString,
	CellInputDate,
	CellInputVote,
	ColumnInput,
} from "./inputux.js";

const leftColumnWidth = "20px"; // Width of the index column
const columnWidth = "200px"; // Width of the data columns

export function TableView(props: {
	fluidTable: FluidTable;
	selection: SelectionManager;
	user: IMember;
}): JSX.Element {
	const { fluidTable, selection, user } = props;
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
		const unsubscribe = Tree.on(fluidTable.rows, "nodeChanged", () => {
			setData(fluidTable.rows.map((row) => row));
		});
		return unsubscribe;
	}, [fluidTable.rows]);

	// Register for tree deltas when the component mounts. Any time the columns change, the app will update.
	useEffect(() => {
		const unsubscribe = Tree.on(fluidTable.columns, "nodeChanged", () => {
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
		<div ref={tableContainerRef} className="overflow-auto mx-auto h-full w-full relative">
			<table
				style={{ display: "grid" }}
				className="table-auto w-full border-collapse border-b-2 border-gray-200"
			>
				<TableHeadersView table={table} fluidTable={fluidTable} selection={selection} />
				<TableBodyView
					table={table}
					tableContainerRef={tableContainerRef}
					{...props} // Pass the user prop to the TableBodyView
				/>
			</table>
		</div>
	);
}

export function TableHeadersView(props: {
	table: Table<FluidRow>;
	fluidTable: FluidTable;
	selection: SelectionManager;
}): JSX.Element {
	const { table, fluidTable, selection } = props;

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
								selection={selection} // Pass the selection prop to the TableHeaderView
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
	selection: SelectionManager;
}): JSX.Element {
	const { header, fluidTable, selection } = props;
	const fluidColumn = fluidTable.getColumn(header.column.id);
	const [localSelection, setLocalSelection] = useState(selection.testSelection(fluidColumn.id));
	const [remoteSelection, setRemoteSelection] = useState(
		selection.testRemoteSelection(fluidColumn.id),
	);
	const [inval, setInval] = useState(0); // used to force a re-render of the header

	useEffect(() => {
		const unsubscribe = Tree.on(fluidColumn, "nodeChanged", () => {
			// Trigger a re-render of the header
			// This is necessary because the header is not re-rendered when the data changes
			// because the header is not a React component
			// set inval to a random number to force a re-render
			// This is a hacky way to do it, but it works
			setInval(Math.random());
		});
		return unsubscribe;
	}, []); // Only run this effect once when the component mounts

	useEffect(() => {
		selection.addEventListener("selectionChanged", () => {
			setLocalSelection(selection.testSelection(fluidColumn.id));
			setRemoteSelection(selection.testRemoteSelection(fluidColumn.id));
		});
	}, []);

	// handle a focus event in the header
	const handleFocus = () => {
		// set the selection to the column
		selection.replaceSelection(fluidColumn.id, "column");
	};

	return (
		<th
			style={{
				display: "flex",
				minWidth: columnWidth,
				width: columnWidth,
				maxWidth: columnWidth,
			}}
			className="relative p-1 border-r-1 border-gray-100"
			onFocus={handleFocus}
		>
			<PresenceBox selection={selection} item={header} /> {/* Local selection box */}
			<PresenceBox selection={selection} item={header} /> {/* Remote selection box */}
			<div className="flex flex-row justify-between w-full gap-x-1">
				<ColumnInput column={fluidColumn} /> {/* Input field for the column name */}
				<ColumnTypeDropdown column={fluidColumn} />
				<SortButton column={header.column} />
				<DeleteButton
					delete={() => {
						header.column.clearSorting();
						fluidColumn.table.deleteColumn(fluidColumn);
					}}
				/>
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
	user: IMember; // Add the user prop here
}): JSX.Element {
	const { table, tableContainerRef, selection, user } = props;
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
			id="tableBody"
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
						{...props} // Pass the user prop to the TableRowView
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
	user: IMember; // Add the user prop here
}): JSX.Element {
	const { row, virtualRow, rowVirtualizer, selection, user } = props;
	const [, setInval] = useState(0); // used to force a re-render of the row

	const style = { transform: `translateY(${virtualRow.start}px)` };

	// Get the fluid row from the row
	const fluidRow = row.original;
	const fluidColumn = useEffect(() => {
		const unsubscribe = Tree.on(fluidRow, "treeChanged", () => {
			// Trigger a re-render of the row
			// This is necessary because the row is not re-rendered when the data changes
			// because the row is not a React component
			// set inval to a random number to force a re-render
			// This is a hacky way to do it, but it works
			setInval(Math.random());
		});
		return unsubscribe;
	}, []); // Only run this effect once when the component mounts

	const [isSelected, setIsSelected] = useState(selection.testSelection(fluidRow.id));

	useEffect(() => {
		selection.addEventListener("selectionChanged", () => {
			setIsSelected(selection.testSelection(row.id));
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
			}}
			className={`${isSelected ? "outline-2 outline-blue-300" : ""}  w-full even:bg-white odd:bg-gray-100`}
		>
			{row.getVisibleCells().map((cell) =>
				cell.column.id === "index" ? (
					<IndexCellView key="index" rowId={row.id} selection={selection} />
				) : (
					<TableCellView
						key={cell.id}
						cell={cell as Cell<FluidRow, cellValue>}
						{...props} // Pass the user prop to the TableCellView
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
			selection.toggleMultiSelection(rowId, "row");
		} else {
			selection.toggleSelection(rowId, "row");
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
	user: IMember; // Add the user prop here
}): JSX.Element {
	const { cell, selection, user } = props;

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

	// handle a click event in the cell
	const handleFocus = () => {
		selection.replaceSelection(cell.id, "cell");
	};

	return (
		<td
			onFocus={handleFocus}
			style={{
				display: "flex",
				position: "relative",
				minWidth: columnWidth,
				width: columnWidth,
				maxWidth: columnWidth,
				...(isSelected ? { zIndex: 1000 } : {}),
				...(isRemoteSelected ? { zIndex: 1000 } : {}),
			}}
			className={`flex p-1 border-collapse border-r-2`}
		>
			<PresenceBox selection={selection} item={cell} />
			<TableCellViewContent key={cell.id} cell={cell} user={user} />
		</td>
	);
}

export function TableCellViewContent(props: {
	cell: Cell<FluidRow, cellValue>;
	user: IMember;
}): JSX.Element {
	const { cell, user } = props;
	const fluidRow = cell.row.original;
	const fluidColumn = fluidRow.table.getColumn(cell.column.id);
	const value = fluidRow.getCell(fluidColumn) ?? fluidColumn.defaultValue;
	const [, setInval] = useState(0); // used to force a re-render of the cell

	useEffect(() => {
		const unsubscribe = Tree.on(fluidColumn, "nodeChanged", () => {
			// Trigger a re-render of the cell
			if (fluidRow.getCell(fluidColumn) === undefined) {
				setInval(Math.random());
			}
		});
		return unsubscribe;
	}, []); // Only run this effect once when the component mounts

	if (typeof value === "boolean") {
		return (
			<CellInputBoolean value={value} row={fluidRow} column={fluidColumn} cellId={cell.id} />
		);
	} else if (typeof value === "number") {
		return (
			<CellInputNumber value={value} row={fluidRow} column={fluidColumn} cellId={cell.id} />
		);
	} else if (typeof value === "string") {
		return (
			<CellInputString value={value} row={fluidRow} column={fluidColumn} cellId={cell.id} />
		);
	}
	// If the value is undefined and the column hint is date, display a date input
	else if (value === undefined && fluidColumn.hint === "date") {
		return <CellInputDate value={value} row={fluidRow} column={fluidColumn} cellId={cell.id} />;
	} else if (value instanceof DateTime) {
		return <CellInputDate value={value} row={fluidRow} column={fluidColumn} cellId={cell.id} />;
	}
	// If the value is undefined and the column hint is vote, display a vote button
	else if (value === undefined && fluidColumn.hint === "vote") {
		return <CellInputVote value={value} row={fluidRow} column={fluidColumn} userId={user.id} />;
	} // If the value is a vote, display the vote button
	else if (value instanceof Vote) {
		return <CellInputVote value={value} row={fluidRow} column={fluidColumn} userId={user.id} />;
	}
	return <></>;
}

export function PresenceBox(props: {
	selection: SelectionManager;
	item: Cell<FluidRow, cellValue> | Header<FluidRow, unknown>;
}): JSX.Element {
	const { selection, item } = props;
	const [hidden, setHidden] = useState(
		(selection.testSelection(item.id) || selection.testRemoteSelection(item.id)) === false,
	);
	const defineColor = useCallback((): string => {
		if (selection.testSelection(item.id) && selection.testRemoteSelection(item.id)) {
			return "outline-purple-800";
		} else if (selection.testSelection(item.id)) {
			return "outline-blue-600";
		} else if (selection.testRemoteSelection(item.id)) {
			return "outline-red-800";
		}
		return "outline-none";
	}, [selection, item]);

	const [color, setColor] = useState(defineColor());

	useEffect(() => {
		selection.addEventListener("selectionChanged", () => {
			setHidden(
				(selection.testSelection(item.id) || selection.testRemoteSelection(item.id)) ===
					false,
			);
			setColor(defineColor());
		});
	}, []);

	return (
		<div
			className={`absolute z-1 h-full w-full inset-0 pointer-events-none outline-2 -outline-offset-2
			${hidden ? "hidden" : ""} ${color} opacity-50`}
		></div>
	);
}

export type cellValue = typeDefinition; // Define the allowed cell value types

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
			columnHelper.accessor((row) => row.cells[column.id], {
				id: column.id,
				header: column.name,
				sortingFn: sortingConfig.fn,
				sortDescFirst: sortingConfig.desc,
				sortUndefined: "last",
			}),
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
	} else if (valueA === undefined || valueA.value === undefined) {
		return 1;
	} else if (valueB === undefined || valueB.value === undefined) {
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

// Custom sorting function for DateTime objects because
// the default alphanumeric sorting function does not work
// because the data is accessed via a second layer of the object
const voteSortingFn: SortingFn<FluidRow> = (
	rowA: Row<FluidRow>,
	rowB: Row<FluidRow>,
	columnId: string,
) => {
	const valueA = rowA.getValue(columnId) as { value: Vote | undefined };
	const valueB = rowB.getValue(columnId) as { value: Vote | undefined };
	if (valueA === undefined && valueB === undefined) {
		return 0;
	} else if (valueA === undefined) {
		return 1;
	} else if (valueB === undefined) {
		return -1;
	} else if (Tree.is(valueA, Vote) && Tree.is(valueB, Vote)) {
		const dateA = valueA.numberOfVotes;
		const dateB = valueB.numberOfVotes;
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
		return { fn: "alphanumeric", desc: true };
	} else if (typeof column.defaultValue === "string") {
		return { fn: "alphanumeric", desc: false };
	} else if (column.hint === "date") {
		return { fn: dateSortingFn, desc: false };
	} else if (column.hint === "vote") {
		return { fn: voteSortingFn, desc: true };
	} else {
		console.error(
			"Unknown column type",
			"DefaultValue:",
			column.defaultValue,
			"Hint:",
			column.hint,
		);
		return { fn: "basic", desc: false };
	}
};
