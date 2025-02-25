/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import React, { JSX, useEffect } from "react";
import { DateTime, FluidColumn, FluidRow, FluidTable } from "../schema/app_schema.js";
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
	TableDeleteRowFilled,
	TableMoveAboveFilled,
	TableMoveBelowFilled,
	TableMoveLeftFilled,
	TableMoveRightFilled,
} from "@fluentui/react-icons";
import { Tree, TreeStatus } from "fluid-framework";
import { SelectionManager } from "../utils/presence.js";

const getLastSelectedRow = (
	table: FluidTable,
	selection: SelectionManager,
): FluidRow | undefined => {
	const selectedRows = selection.getSelected("row");
	if (selectedRows.length > 0) {
		const lastSelectedRow = table.getRow(selectedRows[selectedRows.length - 1]);
		// If the last selected row is not in the table, we will return undefined
		if (
			lastSelectedRow !== undefined &&
			Tree.status(lastSelectedRow) === TreeStatus.InDocument
		) {
			return lastSelectedRow;
		} else {
			// Remove the last selected row from the selection
			selection.removeFromSelection(selectedRows[selectedRows.length - 1], "row");
			return getLastSelectedRow(table, selection);
		}
	}
	return undefined;
};

export function NewEmptyRowButton(props: {
	table: FluidTable;
	selection: SelectionManager;
}): JSX.Element {
	const { table, selection } = props;

	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		const lastSelectedRow = getLastSelectedRow(table, selection);

		if (lastSelectedRow !== undefined) {
			table.insertRow({ index: lastSelectedRow.index + 1 });
		} else {
			table.insertRow({ index: table.rows.length });
		}
	};
	return (
		<ToolbarButton
			handleClick={(e: React.MouseEvent) => handleClick(e)}
			icon={<TableInsertRowRegular />}
		>
			Empty Row
		</ToolbarButton>
	);
}

export function NewRowButton(props: {
	table: FluidTable;
	selection: SelectionManager;
}): JSX.Element {
	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		// Wrap the add group operation in a transaction as it adds a group and potentially moves
		// multiple notes into the group and we want to ensure that the operation is atomic.
		// This ensures that the revertible of the operation will undo all the changes made by the operation.
		Tree.runTransaction(props.table, () => {
			const lastSelectedRow = getLastSelectedRow(props.table, props.selection);
			const row = getRowWithValues(props.table);

			if (lastSelectedRow !== undefined) {
				props.table.insertDetachedRow(lastSelectedRow.index + 1, row);
			} else {
				props.table.insertDetachedRow(props.table.rows.length, row);
			}
		});
	};
	return (
		<ToolbarButton
			handleClick={(e: React.MouseEvent) => handleClick(e)}
			icon={<TableInsertRowFilled />}
		>
			Row
		</ToolbarButton>
	);
}

export function NewManysRowsButton(props: { table: FluidTable }): JSX.Element {
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
		<ToolbarButton
			handleClick={(e: React.MouseEvent) => handleClick(e)}
			icon={<RowTripleFilled />}
		>
			1000
		</ToolbarButton>
	);
}

const getRowWithValues = (table: FluidTable): FluidRow => {
	const row = table.createDetachedRow();
	// Iterate through all the columns and add a random value for the new row
	// If the column is a number, we will add a random number, otherwise we will add a random string
	// If the column is a boolean, we will add a random boolean
	for (const column of table.columns) {
		const type = typeof column.defaultValue;
		const fluidColumn = table.getColumn(column.id);

		if (type === "number") {
			row.setCell(fluidColumn, Math.floor(Math.random() * 1000));
		} else if (type === "boolean") {
			row.setCell(fluidColumn, Math.random() > 0.5);
		} else if (type === "string") {
			row.setCell(fluidColumn, Math.random().toString(36).substring(7));
		} else if (column.defaultValue === undefined && column.hint === "date") {
			// Add a random date
			const startDate = new Date(2020, 0, 1);
			const endDate = new Date();
			const date = getRandomDate(startDate, endDate);
			const dateTime = new DateTime({ raw: date.getTime() });
			row.setCell(fluidColumn, dateTime);
		}
	}
	return row;
};

function getRandomDate(start: Date, end: Date): Date {
	const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
	return date;
}

export function NewColumnButton(props: { table: FluidTable }): JSX.Element {
	const { table } = props;

	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();

		const index = props.table.columns.length + 1;
		const name = `Column ${index.toString()}`;

		// Add a new column to the table
		if (index % 5 === 1) {
			table.insertColumn({ name, defaultValue: "", index: table.columns.length });
		} else if (index % 5 === 2) {
			table.insertColumn({ name, defaultValue: 0, index: table.columns.length });
		} else if (index % 5 === 3) {
			table
				.insertColumn({ name, defaultValue: false, index: table.columns.length })
				// Set the label for the boolean column to a random string
				.props.set("label", Math.random().toString(36).substring(7));
		} else if (index % 5 === 4) {
			table.insertColumn({ name, hint: "vote", index: table.columns.length });
		} else {
			table.insertColumn({ name, hint: "date", index: table.columns.length });
		}
	};
	return (
		<ToolbarButton
			handleClick={(e: React.MouseEvent) => handleClick(e)}
			icon={<ColumnFilled />}
		>
			Column
		</ToolbarButton>
	);
}

export function MoveSelectedRowsButton(props: {
	table: FluidTable;
	selection: SelectionManager;
	up: boolean;
}): JSX.Element {
	const { table, selection, up } = props;
	// Disable the button if there are no selected rows
	const [disabled, setDisabled] = React.useState(selection.getSelected("row").length === 0);
	useEffect(() => {
		selection.addEventListener("selectionChanged", () => {
			// If the selection is empty, we will disable the button
			if (selection.getSelected("row").length === 0) {
				setDisabled(true);
			} else {
				setDisabled(false);
			}
		});
	}, []);
	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		// Get the selected rows from the selection manager
		const selectedRows = selection.getSelected("row");

		// If there are no selected rows, return
		if (selectedRows.length === 0) {
			return;
		}

		// Iterate through the selected rows and move them to the top of the table
		Tree.runTransaction(table, () => {
			for (const rowId of selectedRows) {
				const row = table.getRow(rowId);
				if (row !== undefined && Tree.status(row) === TreeStatus.InDocument) {
					if (up) {
						row.moveTo(row.index - 1);
					} else {
						row.moveTo(row.index + 1);
					}
				}
			}
		});
	};

	return (
		<ToolbarButton
			handleClick={(e: React.MouseEvent) => handleClick(e)}
			icon={up ? <TableMoveAboveFilled /> : <TableMoveBelowFilled />}
			disabled={disabled}
		>
			{up ? "Up" : "Down"}
		</ToolbarButton>
	);
}

export function MoveSelectedColumnsButton(props: {
	table: FluidTable;
	selection: SelectionManager;
	left: boolean;
}): JSX.Element {
	const { table, selection, left } = props;
	// Disable the button if there are no selected columns
	// and no selected cells in the table
	const [disabled, setDisabled] = React.useState(
		selection.getSelected("column").length === 0 && selection.getSelected("cell").length === 0,
	);

	useEffect(() => {
		selection.addEventListener("selectionChanged", () => {
			// If the selection is empty, we will disable the button
			if (
				selection.getSelected("column").length === 0 &&
				selection.getSelected("cell").length === 0
			) {
				setDisabled(true);
			} else {
				setDisabled(false);
			}
		});
	}, []);
	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		// Get the selected columns from the selection manager
		// convert the array to a mutable array
		const selectedColumns = selection.getSelected("column").slice();

		// If there are no selected columns, check for
		// selected cells and move the column of the first selected cell
		if (selectedColumns.length === 0) {
			const selectedCells = selection.getSelected("cell");
			if (selectedCells.length > 0) {
				console.log(selectedCells[0]);
				const column = table.getColumnByCellId(selectedCells[0] as `${string}_${string}`);
				if (column !== undefined && Tree.status(column) === TreeStatus.InDocument) {
					selectedColumns.push(column.id);
				}
			}
		}

		Tree.runTransaction(table, () => {
			for (const columnId of selectedColumns) {
				const column = table.getColumn(columnId);
				if (column !== undefined && Tree.status(column) === TreeStatus.InDocument) {
					if (left) {
						column.moveTo(column.index - 1);
					} else {
						column.moveTo(column.index + 1);
					}
				}
			}
		});
	};

	return (
		<ToolbarButton
			handleClick={(e: React.MouseEvent) => handleClick(e)}
			icon={left ? <TableMoveLeftFilled /> : <TableMoveRightFilled />}
			disabled={disabled}
		>
			{left ? "Left" : "Right"}
		</ToolbarButton>
	);
}

export function DeleteSelectedRowsButton(props: {
	table: FluidTable;
	selection: SelectionManager;
}): JSX.Element {
	const { table, selection } = props;

	// Disable the button if there are no selected rows
	const [disabled, setDisabled] = React.useState(selection.getSelected("row").length === 0);

	useEffect(() => {
		selection.addEventListener("selectionChanged", () => {
			// If the selection is empty, we will disable the button
			if (selection.getSelected("row").length === 0) {
				setDisabled(true);
			} else {
				setDisabled(false);
			}
		});
	}, []);

	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		// Get the selected rows from the selection manager
		const selectedRows = selection.getSelected("row");

		// If there are no selected rows, return
		if (selectedRows.length === 0) {
			return;
		}

		// Iterate through the selected rows and delete them from the table
		// We need to do this in a transaction to ensure that the operation is atomic
		// This ensures that the revertible of the operation will undo all the changes made by the operation.
		Tree.runTransaction(table, () => {
			for (const rowId of selectedRows) {
				const row = table.getRow(rowId);
				if (row !== undefined && Tree.status(row) === TreeStatus.InDocument) {
					table.deleteRow(row);
				}
			}
		});
		// Clear the selection
		selection.clearSelection();
	};

	return (
		<ToolbarButton
			handleClick={(e: React.MouseEvent) => handleClick(e)}
			icon={<TableDeleteRowFilled />}
			disabled={disabled}
		>
			Delete
		</ToolbarButton>
	);
}

// A menu that allows the user to change the column type
// The user can change the column type to a string, number, boolean, or date
export function ColumnTypeDropdown(props: { column: FluidColumn }): JSX.Element {
	const { column } = props;

	const [hidden, setHidden] = React.useState(true);
	const [clicked, setClicked] = React.useState(false);

	const handleOnFocus = (e: React.FocusEvent<HTMLDivElement, Element>) => {
		e.stopPropagation();
		setHidden(false);
	};

	const handleOnBlur = () => {
		// setTimeout to allow the click event to be registered
		// before the dropdown is hidden
		setClicked(false);
		setTimeout(() => {
			setHidden(true);
		}, 300);
	};

	const handleOnClick = () => {
		setClicked(!clicked);
		if (clicked !== hidden) setHidden(!hidden);
	};

	if (column.cells.length !== 0) return <></>;

	return (
		<div onFocus={(e) => handleOnFocus(e)} onBlur={handleOnBlur} className="relative group">
			<IconButton
				toggled={!hidden}
				handleClick={() => handleOnClick()}
				icon={<CaretDown16Filled />}
			/>
			<div className={`absolute right-0 z-10 ${hidden ? `invisible` : `visible`}`}>
				<div className="mt-1 bg-black text-white shadow-lg rounded-lg flex flex-col place-items-start">
					<ChangeColumnTypeButton column={column} type="String" />
					<ChangeColumnTypeButton column={column} type="Number" />
					<ChangeColumnTypeButton column={column} type="Boolean" />
					<ChangeColumnTypeButton column={column} type="Date" />
					<ChangeColumnTypeButton column={column} type="Vote" />
				</div>
			</div>
		</div>
	);
}

// Change the column type by setting the default value to a string, number, boolean, or date
export function ChangeColumnTypeButton(props: { column: FluidColumn; type: string }): JSX.Element {
	const { column, type } = props;

	// Set the icon based on the type of the column
	// if the type is the same as the default type, we will show a checkmark
	// if the type is different, we will show a box
	let icon;
	if ((typeof column.defaultValue).toLowerCase() === type.toLowerCase()) {
		icon = <CheckboxCheckedFilled />;
	} else if (
		column.defaultValue === undefined &&
		(column.hint ?? "").toLowerCase() === type.toLowerCase()
	) {
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
			column.hint = "date";
		} else if (type === "Vote") {
			column.defaultValue = undefined;
			column.hint = "vote";
		}
	};
	return (
		<div className="p-1 w-full">
			<IconButton
				color="white"
				handleClick={(e: React.MouseEvent) => handleClick(e)}
				icon={icon}
				grow={true}
				responsive={false}
			>
				{type}
			</IconButton>
		</div>
	);
}

// Delete all the rows in the table
export function DeleteAllRowsButton(props: { table: FluidTable }): JSX.Element {
	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		props.table.deleteAllRows();
	};
	return (
		<ToolbarButton
			handleClick={(e: React.MouseEvent) => handleClick(e)}
			icon={<DismissFilled />}
		>
			Clear
		</ToolbarButton>
	);
}

export function UndoButton(props: { undo: () => void }): JSX.Element {
	return (
		<ToolbarButton handleClick={() => props.undo()} icon={<ArrowUndoFilled />}></ToolbarButton>
	);
}

export function RedoButton(props: { redo: () => void }): JSX.Element {
	return (
		<ToolbarButton handleClick={() => props.redo()} icon={<ArrowRedoFilled />}></ToolbarButton>
	);
}

export function DeleteButton(props: { delete: () => void }): JSX.Element {
	return <IconButton handleClick={() => props.delete()} icon={<DismissFilled />} grow={false} />;
}

// A wrapper for IconButton just for the toolbar buttons that are not toggled
export function ToolbarButton(props: {
	handleClick: (value: React.MouseEvent) => void;
	children?: React.ReactNode;
	icon: JSX.Element;
	disabled?: boolean;
}): JSX.Element {
	const { handleClick, children, icon, disabled } = props;

	return (
		<IconButton
			handleClick={(e: React.MouseEvent) => handleClick(e)}
			icon={icon}
			color="text-white"
			background="bg-gray-600 hover:bg-black"
			grow={false}
			disabled={disabled}
			disabledColor="disabled:text-gray-400"
			disabledBackground="disabled:bg-transparent"
		>
			{children}
		</IconButton>
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
	toggleBackground?: string;
	toggleColor?: string;
	disabledColor?: string;
	disabledBackground?: string;
	disabled?: boolean;
	responsive?: boolean;
}): JSX.Element {
	const {
		handleClick,
		children,
		icon,
		color,
		background,
		grow,
		toggled,
		toggleBackground,
		toggleColor,
		disabledColor,
		disabledBackground,
		disabled,
		responsive,
	} = props;

	return (
		<button
			className={`text-nowrap font-bold px-2 py-1 rounded-sm inline-flex items-center h-6 ${grow ? "grow w-full" : ""} ${toggled ? `${toggleBackground} ${toggleColor}` : `${background} ${color}`} ${disabledColor} ${disabledBackground} `}
			onClick={(e) => handleClick(e)}
			disabled={disabled}
		>
			{icon}
			<IconButtonText responsive={responsive ?? true}>{children}</IconButtonText>
		</button>
	);
}

IconButton.defaultProps = {
	color: "text-gray-600 hover:text-white",
	background: "bg-transparent hover:bg-gray-600",
	toggleBackground: "bg-gray-400 hover:bg-gray-600",
	toggleColor: "text-white",
	disabledColor: "disabled:text-gray-600",
	disabledBackground: "disabled:bg-transparent",
	grow: false,
	responsive: true,
};

function IconButtonText(props: { children: React.ReactNode; responsive: boolean }): JSX.Element {
	const { children, responsive } = props;

	if (children == undefined) {
		return <></>;
	} else {
		return (
			<span className={`${responsive ? `hidden` : ``} text-sm pl-2 leading-none lg:block`}>
				{props.children}
			</span>
		);
	}
}

export function ButtonGroup(props: { children: React.ReactNode }): JSX.Element {
	return <div className="flex flex-intial items-center">{props.children}</div>;
}

export function Toolbar(props: { children: React.ReactNode }): JSX.Element {
	return (
		<div className="h-[48px] relative bg-gray-600 text-base text-white z-40 w-full shadow p-2">
			<div className="h-full w-full flex flex-row items-center justify-between no-wrap">
				{props.children}
			</div>
		</div>
	);
}

export function Placeholder(): JSX.Element {
	return (
		<div className="h-full w-full flex flex-col items-center justify-center hover:bg-black hover: text-white">
			<div className="h-12 w-12 rounded-full bg-gray-600"></div>
			<div className="h-6 w-24 rounded-md bg-gray-600 mt-2"></div>
		</div>
	);
}
