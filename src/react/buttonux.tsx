/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import React, { JSX } from "react";
import { Table } from "../schema/app_schema.js";
import {
	ThumbLikeFilled,
	DismissFilled,
	RectangleLandscapeRegular,
	ArrowUndoFilled,
	ArrowRedoFilled,
} from "@fluentui/react-icons";
import { Tree } from "fluid-framework";

export function NewRowButton(props: { table: Table }): JSX.Element {
	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		// Wrap the add group operation in a transaction as it adds a group and potentially moves
		// multiple notes into the group and we want to ensure that the operation is atomic.
		// This ensures that the revertible of the operation will undo all the changes made by the operation.
		Tree.runTransaction(props.table, () => {
			const row = props.table.createDetachedRow();
			// Iterate through all the columns and add a placeholder value for the new row
			for (const column of props.table.columns) {
				row.setValue(column.id, column.name);
			}
			props.table.appendDetachedRow(row);
		});
	};
	return (
		<IconButton
			color="white"
			background="black"
			handleClick={(e: React.MouseEvent) => handleClick(e)}
			icon={<RectangleLandscapeRegular />}
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
				const row = props.table.createDetachedRow();
				// Iterate through all the columns and add a placeholder value for the new row
				for (const column of props.table.columns) {
					row.setValue(column.id, column.name);
				}
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
			icon={<RectangleLandscapeRegular />}
		>
			Add Row
		</IconButton>
	);
}

export function ChangeAValueButton(props: { table: Table }): JSX.Element {
	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();

		// Change every value in the table to a random number
		Tree.runTransaction(props.table, () => {
			for (const row of props.table.rows) {
				for (const column of props.table.columns) {
					row.setValue(column.id, Math.floor(Math.random() * 100).toString());
				}
			}
		});
	};
	return (
		<IconButton
			color="white"
			background="black"
			handleClick={(e: React.MouseEvent) => handleClick(e)}
			icon={<RectangleLandscapeRegular />}
		>
			Change A Value
		</IconButton>
	);
}

export function NewColumnButton(props: { table: Table }): JSX.Element {
	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		// Wrap the add group operation in a transaction as it adds a group and potentially moves
		// multiple notes into the group and we want to ensure that the operation is atomic.
		// This ensures that the revertible of the operation will undo all the changes made by the operation.
		Tree.runTransaction(props.table, () => {
			const name = props.table.columns.length.toString();
			props.table.appendNewColumn(name);
		});
	};
	return (
		<IconButton
			color="white"
			background="black"
			handleClick={(e: React.MouseEvent) => handleClick(e)}
			icon={<RectangleLandscapeRegular />}
		>
			Add Column
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
