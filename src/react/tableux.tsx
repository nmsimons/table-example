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

export function TableView(props: { fluidTable: FluidTable }): JSX.Element {
	const { fluidTable } = props;
	const [data, setData] = useState<FluidRow[]>(
		fluidTable.rows.map((row) => {
			return row;
		}),
	);
	const [columns, setColumns] = useState<ColumnDef<FluidRow, string>[]>(
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
			<table className="table-auto w-full border-collapse">
				<TableHeadersView table={table} />
				<TableBodyView table={table} />
			</table>
		</div>
	);
}

export function TableHeadersView(props: { table: Table<FluidRow> }): JSX.Element {
	const table = props.table;
	return (
		<thead className="bg-gray-200 sticky top-0">
			{table.getHeaderGroups().map((headerGroup) => (
				<tr key={headerGroup.id}>
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
		<th className="p-1">
			{header.isPlaceholder
				? null
				: flexRender(header.column.columnDef.header, header.getContext())}
		</th>
	);
}

export function TableBodyView(props: { table: Table<FluidRow> }): JSX.Element {
	const { table } = props;
	return <tbody>{table.getRowModel().rows.map((row) => TableRowView({ row }))}</tbody>;
}

export function TableRowView(props: { row: Row<FluidRow> }): JSX.Element {
	const { row } = props;
	return (
		<tr key={row.id}>
			{row.getVisibleCells().map((cell) => (
				<TableCellView key={cell.id} cell={cell} />
			))}
		</tr>
	);
}

export function TableCellView(props: { cell: Cell<FluidRow, string> }): JSX.Element {
	const { cell } = props;
	const data = cell.row.original;

	// handle a change event in the cell
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		data.setValue(cell.column.id, e.target.value);
	};

	return (
		<td className="border-2 border-gray-200 border-collapse">
			<input
				className="p-1 outline-none w-full h-full"
				value={cell.renderValue() ?? ""}
				onChange={handleChange}
			></input>
		</td>
	);
}

const updateColumnData = (columnsArray: FluidColumn[]) => {
	// Create a column helper based on the columns in the table
	const columnHelper = createColumnHelper<FluidRow>();

	// Create an array of ColumnDefs based on the columns in the table using
	// the column helper
	const headerArray: ColumnDef<FluidRow, string>[] = [];

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
