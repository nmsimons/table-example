import {
	ColumnDef,
	createColumnHelper,
	useReactTable,
	getCoreRowModel,
	flexRender,
	Table,
	Header,
	Row,
	Cell,
	getSortedRowModel,
	SortingFnOption,
	SortDirection,
	Column,
} from "@tanstack/react-table";
import React, { JSX, useState, useEffect } from "react";
import {
	Table as FluidTable,
	Row as FluidRow,
	Column as FluidColumn,
	DateTime,
} from "../schema/app_schema.js";
import { Tree } from "fluid-framework";
import { useVirtualizer, VirtualItem, Virtualizer } from "@tanstack/react-virtual";
import { DeleteButton, IconButton } from "./buttonux.js";
import {
	ArrowSortDownFilled,
	ArrowSortFilled,
	ArrowSortUpFilled,
	ReOrderDotsVertical16Filled,
} from "@fluentui/react-icons";

const leftColumnWidth = "20px"; // Width of the index column
const columnWidth = "200px"; // Width of the data columns

export function TableView(props: { fluidTable: FluidTable }): JSX.Element {
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
				className="table-auto w-full border-collapse rounded-md"
			>
				<TableHeadersView table={table} fluidTable={fluidTable} />
				<TableBodyView table={table} tableContainerRef={tableContainerRef} />
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
			}}
			className="bg-gray-200 sticky top-0 min-h-[36px] w-full inline-flex items-center shadow-sm z-2"
		>
			{table.getHeaderGroups().map((headerGroup) => (
				<tr className="z-2" style={{ display: "flex", width: "100%" }} key={headerGroup.id}>
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
			className="p-1 z-5"
		>
			<div className="flex flex-row justify-between w-full gap-x-1">
				<div className="text-left truncate grow">
					{header.isPlaceholder
						? null
						: flexRender(header.column.columnDef.header, header.getContext())}
				</div>
				<div>
					<SortButton column={header.column} />
				</div>
				<div>
					<DeleteButton
						delete={() => {
							header.column.clearSorting();
							fluidColumn.parent.deleteColumn(fluidColumn.id);
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
			grow={false}
			color="text-gray-600"
			background="bg-transparent"
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
}): JSX.Element {
	const { table, tableContainerRef } = props;
	const { rows } = table.getRowModel();

	const [selected, setSelected] = useState<string[]>([]);

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
			className="border-collapse"
		>
			{rowVirtualizer.getVirtualItems().map((virtualRow) => {
				const row = rows[virtualRow.index] as Row<FluidRow>;
				return (
					<TableRowView
						key={row.id}
						row={row}
						virtualRow={virtualRow}
						rowVirtualizer={rowVirtualizer}
						selected={selected}
						setSelected={setSelected}
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
	selected: string[];
	setSelected: (selected: string[]) => void;
}): JSX.Element {
	const { row, virtualRow, rowVirtualizer, selected, setSelected } = props;

	// Get the fluid row from the row
	const fluidRow = row.original;

	const [isSelected, setIsSelected] = useState(selected.includes(fluidRow.id));

	// Update the selected state when the selected array changes
	useEffect(() => {
		setIsSelected(selected.includes(fluidRow.id));
	}, [selected]);

	return (
		<tr
			key={row.id}
			data-index={virtualRow.index} //needed for dynamic row height measurement
			ref={(node) => rowVirtualizer.measureElement(node)} //measure dynamic row height
			style={{
				display: "flex",
				position: "absolute",
				transform: `translateY(${virtualRow.start}px)`, //this should always be a `style` as it changes on scroll
				width: "100%",
				height: `${virtualRow.size}px`,
			}}
			className={isSelected ? "z-1 outline-2 bg-gray-200" : ""}
		>
			{row
				.getVisibleCells()
				.map((cell) =>
					cell.column.id === "index" ? (
						<IndexCellView
							key="index"
							selected={selected}
							setSelected={setSelected}
							rowId={fluidRow.id}
						/>
					) : (
						<TableCellView key={cell.id} cell={cell as Cell<FluidRow, cellValue>} />
					),
				)}
		</tr>
	);
}

export function IndexCellView(props: {
	setSelected: (selected: string[]) => void;
	selected: string[];
	rowId: string;
}): JSX.Element {
	const { setSelected, selected, rowId } = props;

	// handle a click event in the cell
	const handleClick = (e: React.MouseEvent) => {
		// If the row is already selected, remove it from the selected array
		if (selected.includes(rowId) && e.ctrlKey) {
			setSelected(selected.filter((id) => id !== rowId));
		} else if (selected.includes(rowId)) {
			setSelected([]);
		} else if (e.ctrlKey) {
			setSelected([...selected, rowId]);
		} else {
			setSelected([rowId]);
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
			className="border-l-2 border-r-2 border-b-2 border-gray-300 bg-gray-100 hover:bg-gray-200 border-collapse z-0"
		>
			<div className="flex w-full h-full justify-center items-center text-gray-300 hover:text-gray-600">
				<ReOrderDotsVertical16Filled />
			</div>
		</td>
	);
}

export function TableCellView(props: { cell: Cell<FluidRow, cellValue> }): JSX.Element {
	const { cell } = props;
	return (
		<td
			style={{
				display: "flex",
				minWidth: columnWidth,
				width: columnWidth,
				maxWidth: columnWidth,
			}}
			className="flex border-r-2 border-b-2 border-gray-300 p-1 border-collapse z-0"
		>
			<div className="w-full h-full">
				<TableCellViewContent key={cell.id} cell={cell} />
			</div>
		</td>
	);
}

export function TableCellViewContent(props: { cell: Cell<FluidRow, cellValue> }): JSX.Element {
	const { cell } = props;
	const data = cell.row.original;
	const fluidColumn = data.parent.getColumn(cell.column.id);
	const value = data.getValue(cell.column.id).value;

	if (typeof value === "boolean") {
		return <CellInputBoolean value={value} cell={cell} />;
	} else if (typeof value === "number" || typeof value === "string") {
		return (
			<CellInputStringAndNumber
				value={value}
				cell={cell}
				type={typeof fluidColumn.defaultValue as "string" | "number"}
			/>
		);
	} else if (value === undefined && fluidColumn.props.get("hint") === "date") {
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
		data.setValue(cell.column.id, e.target.checked);
	};

	return (
		// Layout the checkbox and label in a flex container and align the checkbox to the left
		<label className="flex items-center w-full h-full p-1 gap-x-2">
			<input
				id={data.getCell(cell.column.id)?.id ?? data.id + cell.column.id}
				className="outline-none w-4 h-4"
				type="checkbox"
				checked={value ?? false}
				onChange={handleChange}
			></input>
			{data.parent.getColumn(cell.column.id).props.get("label")}
		</label>
	);
}

// Input field for a string cell
export function CellInputStringAndNumber(props: {
	value: string | number;
	cell: Cell<FluidRow, cellValue>;
	type: "string" | "number";
}): JSX.Element {
	const { value, cell, type } = props;
	const data = cell.row.original;

	// handle a change event in the cell
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		data.setValue(cell.column.id, e.target.value);
	};

	return (
		<input
			id={data.getCell(cell.column.id)?.id ?? data.id + cell.column.id}
			className="outline-none w-full h-full"
			type={type}
			value={value ?? ""}
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
		if (fluidCell === undefined) {
			data.initializeCell(cell.column.id, new DateTime({ raw: e.target.value }));
		} else {
			if (Tree.is(fluidCell.value, DateTime)) {
				fluidCell.value.value = new Date(e.target.value);
			}
		}
	};

	return (
		<input
			id={data.getCell(cell.column.id)?.id ?? data.id + cell.column.id}
			className="outline-none w-full h-full"
			type="date"
			value={date}
			onChange={handleChange}
		></input>
	);
}

type cellValue = string | number | boolean | DateTime;

const updateColumnData = (columnsArray: FluidColumn[]) => {
	// Create a column helper based on the columns in the table
	const columnHelper = createColumnHelper<FluidRow>();

	const d = columnHelper.display({
		id: "index",
	});

	// Create an array of ColumnDefs based on the columns in the table using
	// the column helper
	const headerArray: ColumnDef<FluidRow, cellValue>[] = [];

	headerArray.push(d);

	columnsArray.forEach((column) => {
		const sortingConfig = getSortingConfig(column);
		headerArray.push(
			columnHelper.accessor(
				(row) => {
					return row.getCell(column.id)?.value ?? "";
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

// Get the type of the column
const getSortingConfig = (
	column: FluidColumn,
): { fn: SortingFnOption<FluidRow> | undefined; desc: boolean } => {
	if (typeof column.defaultValue === "boolean") {
		return { fn: "basic", desc: false };
	} else if (typeof column.defaultValue === "number") {
		return { fn: "alphanumeric", desc: false };
	} else if (typeof column.defaultValue === "string") {
		return { fn: "alphanumeric", desc: false };
	} else {
		return { fn: "basic", desc: false };
	}
};
