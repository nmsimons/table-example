/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import React, { JSX } from "react";
import { Column, DateTime, Row, Table } from "../schema/app_schema.js";
import {
	DismissFilled,
	ArrowUndoFilled,
	ArrowRedoFilled,
	ColumnFilled,
	CaretDown16Filled,
	TableInsertRowFilled,
	TableInsertRowRegular,
	RowTripleFilled,
	CheckboxUncheckedFilled,
	CheckboxCheckedFilled,
} from "@fluentui/react-icons";
import { Tree } from "fluid-framework";
import { setValue } from "./tableux.js";

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
			icon={<TableInsertRowRegular />}
		>
			Empty Row
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
			icon={<TableInsertRowFilled />}
		>
			Row
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
			icon={<RowTripleFilled />}
		>
			1000
		</IconButton>
	);
}

const getRowWithValues = (table: Table): Row => {
	const row = table.createDetachedRow();
	// Iterate through all the columns and add a random value for the new row
	// If the column is a number, we will add a random number, otherwise we will add a random string
	// If the column is a boolean, we will add a random boolean
	for (const column of table.columns) {
		const type = typeof column.defaultValue;

		if (type === "number") {
			setValue(row, column.id, Math.floor(Math.random() * 1000));
		} else if (type === "boolean") {
			setValue(row, column.id, Math.random() > 0.5);
		} else if (type === "string") {
			setValue(row, column.id, Math.random().toString(36).substring(7));
		} else if (column.defaultValue === undefined && column.props.get("hint") === "date") {
			// Add a random date
			const startDate = new Date(2020, 0, 1);
			const endDate = new Date();
			const date = getRandomDate(startDate, endDate);
			const dateTime = new DateTime({ raw: date.getTime() });
			row.initializeCell(column.id, dateTime);
		}
	}
	return row;
};

function getRandomDate(start: Date, end: Date): Date {
	const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
	return date;
}

export function NewColumnButton(props: { table: Table }): JSX.Element {
	const { table } = props;

	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();

		const index = props.table.columns.length + 1;
		const name = `Column ${index.toString()}`;

		// Add a new column to the table
		if (index % 4 === 1) {
			table.appendNewColumn(name, "");
		} else if (index % 4 === 2) {
			table.appendNewColumn(name, 0);
		} else if (index % 4 === 3) {
			table
				.appendNewColumn(name, false)
				// Set the label for the boolean column to a random string
				.props.set("label", Math.random().toString(36).substring(7));
		} else {
			table.appendNewColumn(name, undefined).props.set("hint", "date");
		}
	};
	return (
		<IconButton
			color="white"
			background="black"
			handleClick={(e: React.MouseEvent) => handleClick(e)}
			icon={<ColumnFilled />}
		>
			Column
		</IconButton>
	);
}

// A menu that allows the user to change the column type
// The user can change the column type to a string, number, boolean, or date
export function ColumnTypeDropdown(props: { column: Column }): JSX.Element {
	const { column } = props;

	if (column.cells.length !== 0) return <></>;

	return (
		<div className="relative group">
			<IconButton
				color="white"
				background="black"
				handleClick={(e: React.MouseEvent) => e.stopPropagation()}
				icon={<CaretDown16Filled />}
			/>
			<div className="absolute right-0 z-10 hidden group-hover:block ">
				<div className="mt-1 bg-black text-white shadow-lg rounded-lg flex flex-col place-items-start">
					<ChangeColumnTypeButton column={column} type="String" />
					<ChangeColumnTypeButton column={column} type="Number" />
					<ChangeColumnTypeButton column={column} type="Boolean" />
					<ChangeColumnTypeButton column={column} type="Date" />
				</div>
			</div>
		</div>
	);
}

// Change the column type by setting the default value to a string, number, boolean, or date
export function ChangeColumnTypeButton(props: { column: Column; type: string }): JSX.Element {
	const { column, type } = props;

	// Get the type of the column based on the default value
	const columnType = typeof column.defaultValue;

	// Set the icon based on the type of the column
	// if the type is the same as the default type, we will show a checkmark
	// if the type is different, we will show a pencil
	let icon;
	if (columnType.toLowerCase() === type.toLowerCase()) {
		icon = <CheckboxCheckedFilled />;
	} else if (columnType === "undefined" && type === "Date") {
		icon = <CheckboxCheckedFilled />;
	} else {
		icon = <CheckboxUncheckedFilled />;
	}

	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (type === "String") {
			column.defaultValue = "";
		} else if (type === "Number") {
			column.defaultValue = 0;
		} else if (type === "Boolean") {
			column.defaultValue = false;
			column.props.set("label", Math.random().toString(36).substring(7));
		} else if (type === "Date") {
			column.defaultValue = undefined;
			column.props.set("hint", "date");
		}
	};
	return (
		<div className="p-1 w-full">
			<IconButton
				color="white"
				background="black"
				handleClick={(e: React.MouseEvent) => handleClick(e)}
				icon={icon}
				grow={true}
			>
				{type}
			</IconButton>
		</div>
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
			Clear
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
		></IconButton>
	);
}

export function RedoButton(props: { redo: () => void }): JSX.Element {
	return (
		<IconButton
			color="white"
			background="black"
			handleClick={() => props.redo()}
			icon={<ArrowRedoFilled />}
		></IconButton>
	);
}

export function DeleteButton(props: { delete: () => void }): JSX.Element {
	return (
		<IconButton
			color="white"
			background="black"
			handleClick={() => props.delete()}
			icon={<DismissFilled />}
			grow={false}
		/>
	);
}

export function IconButton(props: {
	handleClick: (value: React.MouseEvent) => void;
	children?: React.ReactNode;
	icon: JSX.Element;
	color?: string;
	background?: string;
	grow?: boolean;
	toggled?: boolean;
}): JSX.Element {
	const { handleClick, children, icon, color, background, grow, toggled } = props;

	return (
		<button
			className={`${color} text-nowrap hover:bg-gray-600 hover:text-white font-bold px-2 py-1 rounded-sm inline-flex items-center h-6 ${grow ? "grow w-full" : ""} ${toggled ? "bg-gray-400 text-white" : { background }}`}
			onClick={(e) => handleClick(e)}
		>
			{icon}
			<IconButtonText>{children}</IconButtonText>
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
