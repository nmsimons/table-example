/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import React, { JSX } from "react";
import { Row, Table } from "../schema/app_schema.js";
import {
	ThumbLikeFilled,
	DismissFilled,
	ArrowUndoFilled,
	ArrowRedoFilled,
	ColumnFilled,
	InsertRegular,
	InsertFilled,
	TableInsertColumnFilled,
} from "@fluentui/react-icons";
import { Tree } from "fluid-framework";

export function NewEmptyRowButton(props: { table: Table }): JSX.Element {
	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		props.table.appendNewRow();
	};
	return (
		<IconButton
			color="white"
			background="black"
			handleClick={(e: React.MouseEvent) => handleClick(e)}
			icon={<InsertRegular />}
		>
			Add Empty Row
		</IconButton>
	);
}

export function NewRowButton(props: { table: Table }): JSX.Element {
	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		// Wrap the add group operation in a transaction as it adds a group and potentially moves
		// multiple notes into the group and we want to ensure that the operation is atomic.
		// This ensures that the revertible of the operation will undo all the changes made by the operation.
		Tree.runTransaction(props.table, () => {
			const row = getRowWithValues(props.table);
			props.table.appendDetachedRow(row);
		});
	};
	return (
		<IconButton
			color="white"
			background="black"
			handleClick={(e: React.MouseEvent) => handleClick(e)}
			icon={<InsertFilled />}
		>
			Add Row
		</IconButton>
	);
}

export function NewManysRowsButton(props: { table: Table }): JSX.Element {
	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		// Wrap the add group operation in a transaction as it adds a group and potentially moves
		// multiple notes into the group and we want to ensure that the operation is atomic.
		// This ensures that the revertible of the operation will undo all the changes made by the operation.
		Tree.runTransaction(props.table, () => {
			// Add a thousand rows at a time
			const rows = [];
			for (let i = 0; i < 1000; i++) {
				const row = getRowWithValues(props.table);
				rows.push(row);
			}
			props.table.appendMultipleDetachedRows(rows);
		});
	};
	return (
		<IconButton
			color="white"
			background="black"
			handleClick={(e: React.MouseEvent) => handleClick(e)}
			icon={<TableInsertColumnFilled />}
		>
			Add 1000
		</IconButton>
	);
}

const getRowWithValues = (table: Table): Row => {
	const row = table.createDetachedRow();
	// Iterate through all the columns and add a random value for the new row
	// If the column is a number, we will add a random number, otherwise we will add a random string
	// If the column is a boolean, we will add a random boolean
	for (const column of table.columns) {
		if (column.type === "number") {
			row.setValue(column.id, Math.floor(Math.random() * 1000));
		} else if (column.type === "boolean") {
			row.setValue(column.id, Math.random() > 0.5);
		} else {
			row.setValue(column.id, Math.random().toString(36).substring(7));
		}
	}
	return row;
};

export function NewColumnButton(props: { table: Table }): JSX.Element {
	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();

		const name = props.table.columns.length.toString();

		// Add a new column to the table
		// Make the column type a string if the name is even, otherwise make it a number or a boolean
		if (parseInt(name) % 2 === 0) {
			props.table.appendNewColumn(name).setType("number");
		} else if (parseInt(name) % 3 === 0) {
			props.table.appendNewColumn(name).setType("boolean");
		} else {
			props.table.appendNewColumn(name).setType("string");
		}
	};
	return (
		<IconButton
			color="white"
			background="black"
			handleClick={(e: React.MouseEvent) => handleClick(e)}
			icon={<ColumnFilled />}
		>
			Add Column
		</IconButton>
	);
}

// Delete all the rows in the table
export function DeleteAllRowsButton(props: { table: Table }): JSX.Element {
	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		props.table.deleteAllRows();
	};
	return (
		<IconButton
			color="white"
			background="black"
			handleClick={(e: React.MouseEvent) => handleClick(e)}
			icon={<DismissFilled />}
		>
			Delete All Rows
		</IconButton>
	);
}

export function UndoButton(props: { undo: () => void }): JSX.Element {
	return (
		<IconButton
			color="white"
			background="black"
			handleClick={() => props.undo()}
			icon={<ArrowUndoFilled />}
		>
			Undo
		</IconButton>
	);
}

export function RedoButton(props: { redo: () => void }): JSX.Element {
	return (
		<IconButton
			color="white"
			background="black"
			handleClick={() => props.redo()}
			icon={<ArrowRedoFilled />}
		>
			Redo
		</IconButton>
	);
}

export function DeleteButton(props: {
	handleClick: (value: React.MouseEvent) => void;
}): JSX.Element {
	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		props.handleClick(e);
	};
	return (
		<button
			className={
				"bg-transparent hover:bg-gray-600 text-black hover:text-white font-bold px-2 py-1 rounded-sm inline-flex items-center h-6"
			}
			onClick={(e) => handleClick(e)}
		>
			{MiniX()}
		</button>
	);
}

export function IconButton(props: {
	handleClick: (value: React.MouseEvent) => void;
	children?: React.ReactNode;
	icon: JSX.Element;
	color?: string;
	background?: string;
}): JSX.Element {
	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		props.handleClick(e);
	};

	return (
		<button
			className={
				props.color +
				" " +
				props.background +
				" hover:bg-gray-600 hover:text-white font-bold px-2 py-1 rounded-sm inline-flex items-center h-6 grow"
			}
			onClick={(e) => handleClick(e)}
		>
			{props.icon}
			<IconButtonText>{props.children}</IconButtonText>
		</button>
	);
}

IconButton.defaultProps = {
	color: "text-gray-600",
	background: "bg-transparent",
};

function IconButtonText(props: { children: React.ReactNode }): JSX.Element {
	if (props.children == undefined) {
		return <span></span>;
	} else {
		return <span className="text-sm pl-2 leading-none">{props.children}</span>;
	}
}

function MiniX(): JSX.Element {
	return <DismissFilled />;
}

export function MiniThumb(): JSX.Element {
	return <ThumbLikeFilled />;
}

export function ButtonGroup(props: { children: React.ReactNode }): JSX.Element {
	return <div className="flex flex-intial items-center">{props.children}</div>;
}

export function Floater(props: { children: React.ReactNode }): JSX.Element {
	return (
		<div className="transition transform absolute z-100 bottom-0 inset-x-0 pb-2 sm:pb-5 opacity-100 scale-100 translate-y-0 ease-out duration-500 text-white">
			<div className="max-w-(--breakpoint-md) mx-auto px-2 sm:px-4">
				<div className="p-2 rounded-lg bg-black shadow-lg sm:p-3">
					<div className="flex flex-row items-center justify-between flex-wrap">
						{props.children}
					</div>
				</div>
			</div>
		</div>
	);
}
