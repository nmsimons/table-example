import { Cell } from "@tanstack/react-table";
import React, { JSX } from "react";
import { Row as FluidRow, DateTime, Vote } from "../schema/app_schema.js";
import { cellValue, setValue } from "./tableux.js";
import { Tree } from "fluid-framework";
import { IconButton } from "./buttonux.js";
import { ThumbLikeFilled } from "@fluentui/react-icons";

// Input field for a cell with a boolean value

export function CellInputBoolean(props: {
	value: boolean;
	cell: Cell<FluidRow, cellValue>;
}): JSX.Element {
	const { value, cell } = props;
	const data = cell.row.original;

	// handle a change event in the cell
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setValue(data, cell.column.id, e.target.checked);
	};

	return (
		// Layout the checkbox and label in a flex container and align the checkbox to the left
		<label className="flex items-center w-full h-full p-1 gap-x-2">
			<input
				id={cell.id}
				className="outline-none w-4 h-4"
				type="checkbox"
				checked={value ?? false}
				onChange={handleChange}
			></input>
			{data.table.getColumn(cell.column.id).props.get("label")}
		</label>
	);
}
// Input field for a string cell

export function CellInputString(props: {
	value: string;
	cell: Cell<FluidRow, cellValue>;
}): JSX.Element {
	const { value, cell } = props;
	const data = cell.row.original;

	// handle a change event in the cell
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setValue(data, cell.column.id, e.target.value);
	};

	return (
		<input
			id={cell.id}
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
	cell: Cell<FluidRow, cellValue>;
}): JSX.Element {
	const { value, cell } = props;
	const data = cell.row.original;

	// handle a change event in the cell
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		// convert the value to a number
		const num = parseFloat(e.target.value);
		if (!isNaN(num)) {
			setValue(data, cell.column.id, num);
		}
	};

	return (
		<input
			inputMode="numeric"
			id={cell.id}
			className="outline-none w-full h-full"
			type="number"
			value={value ?? 0}
			onChange={handleChange}
		></input>
	);
}

export function CellInputDate(props: {
	value: DateTime | undefined;
	cell: Cell<FluidRow, cellValue>;
}): JSX.Element {
	const { value, cell } = props;
	const data = cell.row.original;

	const date = value?.value?.toISOString().split("T")[0] ?? "";

	// handle a change event in the cell
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const fluidCell = data.getCell(cell.column.id);
		// Test if the target value is a valid date
		if (isNaN(Date.parse(e.target.value))) {
			if (fluidCell !== undefined) {
				if (Tree.is(fluidCell.value, DateTime)) {
					data.deleteCell(cell.column.id);
					return;
				}
			}
		}
		// If the cell is undefined, initialize it with the new date
		// Otherwise, update the existing
		// Generate a new Date from the target value
		const d: Date = new Date(e.target.value);
		if (fluidCell === undefined) {
			data.initializeCell(cell.column.id, new DateTime({ raw: d.getTime() }));
		} else {
			if (Tree.is(fluidCell.value, DateTime)) {
				fluidCell.value.value = d;
			}
		}
	};

	return (
		<input
			id={cell.id}
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
	cell: Cell<FluidRow, cellValue>;
	userId: string;
}): JSX.Element {
	const { cell, userId, value } = props;
	const fluidRow = cell.row.original;

	// Get the value of the cell
	const vote = value ?? new Vote({ votes: {} });

	// handle a click event in the cell
	const handleClick = () => {
		const fluidCell = fluidRow.getCell(cell.column.id);
		if (fluidCell === undefined) {
			fluidRow.initializeCell(cell.column.id, vote);
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
