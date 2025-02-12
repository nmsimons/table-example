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
import { Table as FluidTable, Row as FluidRow, Column } from "../schema/app_schema.js";
import { Tree } from "fluid-framework";

export function TableView(props: { fluidTable: FluidTable }): JSX.Element {
	const { fluidTable } = props;
	const [rowsArray, setRowsArray] = useState<FluidRow[]>(
		fluidTable.rows.map((row) => {
			return row;
		}),
	);
	const [columnsArray, setColumnsArray] = useState<Column[]>(
		fluidTable.columns.map((column) => column),
	);

	const [columnData, setColumnData] = useState<ColumnDef<FluidRow, string>[]>([]);

	// Register for tree deltas when the component mounts.
	// Any time the rows change, the app will update.
	useEffect(() => {
		const unsubscribe = Tree.on(props.fluidTable.rows, "nodeChanged", () => {
			// Set the rows array to the first 10 rows in the table
			const arr = props.fluidTable.rows.map((row) => row);
			setRowsArray(arr);
		});
		return unsubscribe;
	}, []);

	useEffect(() => {
		const unsubscribe = Tree.on(props.fluidTable.columns, "nodeChanged", () => {
			setColumnsArray(props.fluidTable.columns.map((column) => column));
		});
		return unsubscribe;
	}, []);

	useEffect(() => {
		// Create a column helper based on the columns in the table
		const columnHelper = createColumnHelper<FluidRow>();

		// Create an array of ColumnDefs based on the columns in the table using
		// the column helper
		const headerArray: ColumnDef<FluidRow, string>[] = [];

		columnsArray.forEach((column) => {
			headerArray.push(
				columnHelper.accessor(
					(row) => {
						const val = row.getCell(column)?.value ?? "";
						return val;
					},
					{
						id: column.id,
						header: column.name,
					},
				),
			);
		});

		setColumnData(headerArray);
	}, [columnsArray]);

	const table = useReactTable({
		data: rowsArray,
		columns: columnData,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<div className="h-full overflow-auto w-full p-2">
			<table>
				<TableHeadersView table={table} />
				<TableBodyView table={table} />
			</table>
		</div>
	);
}

export function TableHeadersView(props: { table: Table<FluidRow> }): JSX.Element {
	const table = props.table;
	return (
		<thead>
			{table.getHeaderGroups().map((headerGroup) => (
				<tr key={headerGroup.id}>
					{headerGroup.headers.map((header) => (
						// eslint-disable-next-line react/jsx-key
						<TableHeaderView header={header} />
					))}
				</tr>
			))}
		</thead>
	);
}

export function TableHeaderView(props: { header: Header<FluidRow, unknown> }): JSX.Element {
	const { header } = props;
	return (
		<th key={header.id}>
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
				// eslint-disable-next-line react/jsx-key
				<TableCellView cell={cell} />
			))}
		</tr>
	);
}

export function TableCellView(props: { cell: Cell<FluidRow, string> }): JSX.Element {
	const cell = props.cell;
	return <td key={cell.id}>{cell.renderValue()}</td>;
}
