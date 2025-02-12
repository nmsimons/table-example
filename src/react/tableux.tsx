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
	const [rowsArray, setRowsArray] = useState<FluidRow[]>(
		fluidTable.rows.map((row) => {
			return row;
		}),
	);
	const [columnsArray, setColumnsArray] = useState<FluidColumn[]>(
		fluidTable.columns.map((column) => column),
	);

	const [columnData, setColumnData] = useState<ColumnDef<FluidRow, string>[]>([]);

	// Register for tree deltas when the component mounts.
	// Any time the rows change, the app will update.
	useEffect(() => {
		const unsubscribe = Tree.on(props.fluidTable.rows, "treeChanged", () => {
			setRowsArray(props.fluidTable.rows.map((row) => row));
		});
		return unsubscribe;
	}, []);

	useEffect(() => {
		const unsubscribe = Tree.on(props.fluidTable.columns, "treeChanged", () => {
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
						return row.getCell(column.id)?.value ?? "";
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
		<div className="h-[calc(100vh-148px)] overflow-auto w-full">
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
		<thead>
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
		<th className="p-1 border-2 border-black">
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
		<td className="border-2 border-black p-1">
			<input
				className="outline-none"
				value={cell.renderValue() ?? ""}
				onChange={handleChange}
			></input>
		</td>
	);
}
