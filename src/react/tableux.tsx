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
} from "@tanstack/react-table";
import React, { JSX, useState, useEffect } from "react";
import {
	Table as FluidTable,
	Row as FluidRow,
	Column as FluidColumn,
} from "../schema/app_schema.js";
import { Tree } from "fluid-framework";
import { useVirtualizer, VirtualItem, Virtualizer } from "@tanstack/react-virtual";

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
		const unsubscribe = Tree.on(props.fluidTable.rows, "treeChanged", () => {
			setData(props.fluidTable.rows.map((row) => row));
		});
		return unsubscribe;
	}, [fluidTable]);

	// Register for tree deltas when the component mounts. Any time the columns change, the app will update.
	useEffect(() => {
		const unsubscribe = Tree.on(props.fluidTable.columns, "treeChanged", () => {
			setColumns(updateColumnData(props.fluidTable.columns.map((column) => column)));
		});
		return unsubscribe;
	}, [fluidTable]);

	// The virtualizer will need a reference to the scrollable container element
	const tableContainerRef = React.useRef<HTMLDivElement>(null);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<div
			ref={tableContainerRef}
			className="h-[calc(100vh-200px)] w-5/6 overflow-auto mx-auto mt-8 border-2 border-black"
		>
			<table style={{ display: "grid" }} className="table-auto w-full border-collapse">
				<TableHeadersView table={table} />
				<TableBodyView table={table} tableContainerRef={tableContainerRef} />
			</table>
		</div>
	);
}

export function TableHeadersView(props: { table: Table<FluidRow> }): JSX.Element {
	const table = props.table;
	return (
		<thead
			style={{
				display: "grid",
				zIndex: 1,
			}}
			className="bg-gray-200 sticky top-0"
		>
			{table.getHeaderGroups().map((headerGroup) => (
				<tr style={{ display: "flex", width: "100%" }} key={headerGroup.id}>
					{headerGroup.headers.map((header) => (
						<TableHeaderView key={header.id} header={header} />
					))}
				</tr>
			))}
		</thead>
	);
}

export function TableHeaderView(props: { header: Header<FluidRow, unknown> }): JSX.Element {
	const { header } = props;
	return (
		<th
			style={{
				display: "flex",
				width: "100%",
			}}
			className="p-1"
		>
			{header.isPlaceholder
				? null
				: flexRender(header.column.columnDef.header, header.getContext())}
		</th>
	);
}

export function TableBodyView(props: {
	table: Table<FluidRow>;
	tableContainerRef: React.RefObject<HTMLDivElement | null>;
}): JSX.Element {
	const { table, tableContainerRef } = props;
	const { rows } = table.getRowModel();

	const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
		count: rows.length,
		estimateSize: () => 33, //estimate row height for accurate scrollbar dragging
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
}): JSX.Element {
	const { row, virtualRow, rowVirtualizer } = props;
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
			}}
		>
			{row.getVisibleCells().map((cell) => (
				<td
					key={cell.id}
					style={{ display: "flex", width: "100%" }}
					className="border-1 border-gray-300"
				>
					<TableCellView key={cell.id} cell={cell} />
				</td>
			))}
		</tr>
	);
}

export function TableCellView(props: { cell: Cell<FluidRow, cellValue> }): JSX.Element {
	const { cell } = props;
	const data = cell.row.original;
	const value = data.getCell(cell.column.id)?.value;

	// Get the specified column type
	const columnType = data
		.getTable()
		?.columns.find((value) => value.id === cell.column.id)
		?.getType() as "string" | "number" | "boolean";

	if (value === undefined) {
		// Test using the type property
		if (columnType === "boolean") {
			return <CellInputBoolean value={false} cell={cell} />;
		} else if (columnType === "number") {
			return <CellInputStringAndNumber value={0} cell={cell} type={columnType} />;
		} else {
			return <CellInputStringAndNumber value={""} cell={cell} type={columnType} />;
		}
	} else {
		if (typeof value === "boolean") {
			return <CellInputBoolean value={value} cell={cell} />;
		} else {
			return <CellInputStringAndNumber value={value} cell={cell} type={columnType} />;
		}
	}
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
		<input
			className="p-1 outline-none w-full h-full"
			type="checkbox"
			checked={value ?? false}
			onChange={handleChange}
		></input>
	);
}

// Input field for a string cell
export function CellInputStringAndNumber(props: {
	value: string | number;
	cell: Cell<FluidRow, cellValue>;
	type: "string" | "number" | "boolean";
}): JSX.Element {
	const { value, cell, type } = props;
	const data = cell.row.original;

	// handle a change event in the cell
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		data.setValue(cell.column.id, e.target.value);
	};

	return (
		<input
			className="p-1 outline-none w-full h-full"
			type={type}
			value={value ?? ""}
			onChange={handleChange}
		></input>
	);
}

type cellValue = string | number | boolean;

const updateColumnData = (columnsArray: FluidColumn[]) => {
	// Create a column helper based on the columns in the table
	const columnHelper = createColumnHelper<FluidRow>();

	// Create an array of ColumnDefs based on the columns in the table using
	// the column helper
	const headerArray: ColumnDef<FluidRow, cellValue>[] = [];

	columnsArray.forEach((column) => {
		headerArray.push(
			columnHelper.accessor(
				(row) => {
					return row.getCell(column.id)?.value ?? "";
				},
				{
					id: column.id,
					header: column.name,
				},
			),
		);
	});

	return headerArray;
};
