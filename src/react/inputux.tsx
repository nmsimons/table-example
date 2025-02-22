import React, { JSX } from "react";
import { DateTime, Vote, Row, Column, Cell as FluidCell } from "../schema/app_schema.js";
import { Tree } from "fluid-framework";
import { IconButton } from "./buttonux.js";
import { ThumbLikeFilled } from "@fluentui/react-icons";

export function ColumnInput(props: { column: Column }): JSX.Element {
	const { column } = props;
	return (
		<input
			id={column.id}
			className="outline-none w-full h-full truncate"
			value={column.name}
			onChange={(e) => {
				column.name = e.target.value;
			}}
		></input>
	);
}

// Input field for a cell with a boolean value
export function CellInputBoolean(props: {
	value: boolean;
	row: Row;
	column: Column;
	cellId: string;
}): JSX.Element {
	const { value, row, column, cellId } = props;

	// handle a change event in the cell
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setValue(row, column, e.target.checked);
	};

	return (
		// Layout the checkbox and label in a flex container and align the checkbox to the left
		<label className="flex items-center w-full h-full p-1 gap-x-2">
			<input
				id={cellId}
				className="outline-none w-4 h-4"
				type="checkbox"
				checked={value ?? false}
				onChange={handleChange}
			></input>
			{column.props.get("label")}
		</label>
	);
}

// Input field for a string cell
export function CellInputString(props: {
	value: string;
	row: Row;
	column: Column;
	cellId: string;
}): JSX.Element {
	const { value, row, column, cellId } = props;

	// handle a change event in the cell
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setValue(row, column, e.target.value);
	};

	return (
		<input
			id={cellId}
			className="outline-none w-full h-full"
			type="text"
			value={value ?? ""}
			onChange={handleChange}
		></input>
	);
}

// Input field for a string cell
export function CellInputNumber(props: {
	value: number;
	row: Row;
	column: Column;
	cellId: string;
}): JSX.Element {
	const { value, row, column, cellId } = props;

	// handle a change event in the cell
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		// convert the value to a number
		const num = parseFloat(e.target.value);
		if (!isNaN(num)) {
			setValue(row, column, num);
		}
	};

	return (
		<input
			inputMode="numeric"
			id={cellId}
			className="outline-none w-full h-full"
			type="number"
			value={value ?? 0}
			onChange={handleChange}
		></input>
	);
}

export function CellInputDate(props: {
	value: DateTime | undefined;
	row: Row;
	column: Column;
	cellId: string;
}): JSX.Element {
	const { value, row, column, cellId } = props;

	const date = value?.value?.toISOString().split("T")[0] ?? "";

	// handle a change event in the cell
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const fluidCell = row.getCell(column);
		// Test if the target value is a valid date
		if (isNaN(Date.parse(e.target.value))) {
			if (fluidCell !== undefined) {
				if (Tree.is(fluidCell.value, DateTime)) {
					row.deleteCell(column);
					return;
				}
			}
		}
		// If the cell is undefined, initialize it with the new date
		// Otherwise, update the existing
		// Generate a new Date from the target value
		const d: Date = new Date(e.target.value);
		if (fluidCell === undefined) {
			row.initializeCell(column, new DateTime({ raw: d.getTime() }));
		} else {
			if (Tree.is(fluidCell.value, DateTime)) {
				fluidCell.value.value = d;
			}
		}
	};

	return (
		<input
			id={cellId}
			className="outline-none w-full h-full"
			type="date"
			value={date}
			onChange={handleChange}
		></input>
	);
}
// A control that allows users to vote by clicking a button in a cell

export function CellInputVote(props: {
	value: Vote | undefined;
	row: Row;
	column: Column;
	userId: string;
}): JSX.Element {
	const { value, row, column, userId } = props;

	// Get the value of the cell
	const vote = value ?? new Vote({ votes: {} });

	// handle a click event in the cell
	const handleClick = () => {
		const cell = row.getCell(column);
		if (cell === undefined) {
			row.initializeCell(column, vote);
		}
		vote.toggleVote(userId);
	};

	return (
		<div className="flex items-center justify-center w-full h-full">
			<IconButton
				icon={<ThumbLikeFilled />}
				handleClick={handleClick}
				toggled={vote.hasVoted(userId)}
				toggleBackground="bg-blue-500 hover:bg-blue-700"
			>
				{vote.numberOfVotes}
			</IconButton>
		</div>
	);
}

/**
 * Set the value of a cell. First test if it exists. If it doesn't exist, create it.
 * This will overwrite the value of the cell so if the value isn't a primitive, don't use this -
 * use initializeCell instead.
 * @param row The row
 * @param column The column
 * @param value The value to set
 * @returns The cell that was set
 * */
export const setValue = (row: Row, column: Column, value: string | number | boolean): FluidCell => {
	const cell = row.getCell(column);
	if (cell) {
		cell.value = value;
		return cell;
	} else {
		return row.initializeCell(column, value);
	}
};
