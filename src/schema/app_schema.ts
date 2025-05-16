/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { TreeViewConfiguration, Tree } from "fluid-framework";
import { SchemaFactoryAlpha } from "fluid-framework/alpha";
import {
	InsertableTreeNodeFromImplicitAllowedTypes,
	TableSchema,
	TreeNodeFromImplicitAllowedTypes,
} from "@fluidframework/tree/internal";

// Schema is defined using a factory object that generates classes for objects as well
// as list and map nodes.

// Include a UUID to guarantee that this schema will be uniquely identifiable.
// As this schema uses a recursive type, the beta SchemaFactoryRecursive is used instead of just SchemaFactory.
const sf = new SchemaFactoryAlpha("fc1db2e8-0a00-11ee-be56-0242ac120002");

/**
 * A SharedTree object date-time
 */
export class DateTime extends sf.object("DateTime", {
	raw: sf.number,
}) {
	/**
	 * Get the date-time
	 */
	get value(): Date {
		return new Date(this.raw);
	}

	/**
	 * Set the raw date-time string
	 */
	set value(value: Date) {
		// Test if the value is a valid date
		if (isNaN(value.getTime())) {
			return;
		}
		this.raw = value.getTime();
	}
}

/**
 * A SharedTree object that allows users to vote
 */
export class Vote extends sf.object("Vote", {
	votes: sf.map(sf.string), // Map of votes
}) {
	/**
	 * Add a vote to the map of votes
	 * The key is the user id and the value is irrelevant
	 * @param vote The vote to add
	 */
	addVote(vote: string): void {
		if (this.votes.has(vote)) {
			return;
		}
		this.votes.set(vote, "");
	}

	/**
	 * Remove a vote from the map of votes
	 * @param vote The vote to remove
	 */
	removeVote(vote: string): void {
		if (!this.votes.has(vote)) {
			return;
		}
		this.votes.delete(vote);
	}

	/**
	 * Toggle a vote in the map of votes
	 */
	toggleVote(vote: string): void {
		if (this.votes.has(vote)) {
			this.removeVote(vote);
		} else {
			this.addVote(vote);
		}
	}

	/**
	 * Get the number of votes
	 * @returns The number of votes
	 */
	get numberOfVotes(): number {
		return this.votes.size;
	}

	/**
	 * Return whether the user has voted
	 * @param userId The user id
	 * @return Whether the user has voted
	 */
	hasVoted(userId: string): boolean {
		return this.votes.has(userId);
	}
}

const Cell = [sf.string, sf.number, sf.boolean, DateTime, Vote] as const;
export type CellValueType = TreeNodeFromImplicitAllowedTypes<typeof Cell>;
export type CellInsertableType = InsertableTreeNodeFromImplicitAllowedTypes<typeof Cell>;

export class TableColumn extends TableSchema.column({
	schemaFactory: sf,
	cell: Cell,
	props: sf.object("ColumnProps", {
		label: sf.string,
		hint: sf.string,
	}),
}) {}

export class TableRow extends TableSchema.row({
	schemaFactory: sf,
	cell: Cell,
}) {}

export class Table extends TableSchema.table({
	schemaFactory: sf,
	row: TableRow,
	column: TableColumn,
	cell: Cell,
}) {
	/**
	 * Delete a column and all of its cells
	 * @param column The column to delete
	 */
	deleteColumn(column: TableColumn): void {
		// if (Tree.status(column) !== TreeStatus.InDocument) return;
		Tree.runTransaction(this, () => {
			for (const row of this.rows) {
				row.removeCell(column);
			}
			this.removeColumn(column);
		});
	}
}

export type HintValues = (typeof hintValues)[keyof typeof hintValues];
export const hintValues = {
	string: "string",
	number: "number",
	boolean: "boolean",
	date: "date",
	vote: "vote",
} as const;

/**
 * Export the tree config appropriate for this schema.
 * This is passed into the SharedTree when it is initialized.
 * */
export const appTreeConfiguration = new TreeViewConfiguration(
	// Schema for the root
	{ schema: Table },
);
