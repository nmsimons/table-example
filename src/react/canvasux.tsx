/* eslint-disable @typescript-eslint/no-unused-vars */
/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import React, { JSX, use, useEffect, useState } from "react";
import { Table, Row, Column } from "../schema/app_schema.js";
import {
	ConnectionState,
	IFluidContainer,
	IMember,
	IServiceAudience,
	Tree,
	TreeView,
} from "fluid-framework";
import {
	Floater,
	NewRowButton,
	ButtonGroup,
	UndoButton,
	RedoButton,
	NewColumnButton,
	NewManysRowsButton,
} from "./buttonux.js";
import { undoRedo } from "../utils/undo.js";
import type { SelectionManager } from "../utils/presence_helpers.js";

import {
	ColumnDef,
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";

export function Canvas(props: {
	table: Table;
	selection: SelectionManager;
	audience: IServiceAudience<IMember>;
	container: IFluidContainer;
	fluidMembers: string[];
	currentUser: string;
	undoRedo: undoRedo;
	setCurrentUser: (arg: string) => void;
	setConnectionState: (arg: string) => void;
	setSaved: (arg: boolean) => void;
	setFluidMembers: (arg: string[]) => void;
}): JSX.Element {
	useEffect(() => {
		const updateConnectionState = () => {
			if (props.container.connectionState === ConnectionState.Connected) {
				props.setConnectionState("connected");
			} else if (props.container.connectionState === ConnectionState.Disconnected) {
				props.setConnectionState("disconnected");
			} else if (props.container.connectionState === ConnectionState.EstablishingConnection) {
				props.setConnectionState("connecting");
			} else if (props.container.connectionState === ConnectionState.CatchingUp) {
				props.setConnectionState("catching up");
			}
		};
		updateConnectionState();
		props.setSaved(!props.container.isDirty);
		props.container.on("connected", updateConnectionState);
		props.container.on("disconnected", updateConnectionState);
		props.container.on("dirty", () => props.setSaved(false));
		props.container.on("saved", () => props.setSaved(true));
		props.container.on("disposed", updateConnectionState);
	}, []);

	const updateMembers = () => {
		if (props.audience.getMyself() == undefined) return;
		if (props.audience.getMyself()?.id == undefined) return;
		if (props.audience.getMembers() == undefined) return;
		if (props.container.connectionState !== ConnectionState.Connected) return;
		props.setFluidMembers(Array.from(props.audience.getMembers().keys()));
	};

	useEffect(() => {
		props.audience.on("membersChanged", updateMembers);
		updateMembers();
		return () => {
			props.audience.off("membersChanged", updateMembers);
		};
	}, []);

	return (
		<div className="relative flex grow-0 h-full w-full bg-transparent">
			<TableView table={props.table} />
			<Floater>
				<ButtonGroup>
					<NewRowButton table={props.table} />
					<NewManysRowsButton table={props.table} />
					<NewColumnButton table={props.table} />
				</ButtonGroup>
				<ButtonGroup>
					<UndoButton undo={() => props.undoRedo.undo()} />
					<RedoButton redo={() => props.undoRedo.redo()} />
				</ButtonGroup>
			</Floater>
		</div>
	);
}

export function TableView(props: { table: Table }): JSX.Element {
	const [rowsArray, setRowsArray] = useState<Row[]>(props.table.rows.map((row) => row));
	const [columnsArray, setColumnsArray] = useState<Column[]>(
		props.table.columns.map((column) => column),
	);

	const [columnData, setColumnData] = useState<ColumnDef<Row, string>[]>([]);

	// Register for tree deltas when the component mounts.
	// Any time the rows change, the app will update.
	useEffect(() => {
		const unsubscribe = Tree.on(props.table.rows, "nodeChanged", () => {
			setRowsArray(props.table.rows.map((row) => row));
		});
		return unsubscribe;
	}, []);

	useEffect(() => {
		const unsubscribe = Tree.on(props.table.columns, "nodeChanged", () => {
			setColumnsArray(props.table.columns.map((column) => column));
		});
		return unsubscribe;
	}, []);

	useEffect(() => {
		// Create a column helper based on the columns in the table
		const columnHelper = createColumnHelper<Row>();

		// Create an array of ColumnDefs based on the columns in the table using
		// the column helper
		const headerArray: ColumnDef<Row, string>[] = [];

		columnsArray.forEach((column) => {
			headerArray.push(
				columnHelper.accessor(
					(row) => {
						return row.getCell(column).value;
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
		<div className="p-2">
			<table>
				<thead>
					{table.getHeaderGroups().map((headerGroup) => (
						<tr key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<th key={header.id}>
									{header.isPlaceholder
										? null
										: flexRender(
												header.column.columnDef.header,
												header.getContext(),
											)}
								</th>
							))}
						</tr>
					))}
				</thead>
				<tbody>
					{table.getRowModel().rows.map((row) => (
						<tr key={row.id}>
							{row.getVisibleCells().map((cell) => (
								<td key={cell.id}>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</td>
							))}
						</tr>
					))}
				</tbody>
				<tfoot>
					{table.getFooterGroups().map((footerGroup) => (
						<tr key={footerGroup.id}>
							{footerGroup.headers.map((header) => (
								<th key={header.id}>
									{header.isPlaceholder
										? null
										: flexRender(
												header.column.columnDef.footer,
												header.getContext(),
											)}
								</th>
							))}
						</tr>
					))}
				</tfoot>
			</table>
		</div>
	);
}
