/* eslint-disable @typescript-eslint/no-empty-object-type */
/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import {
	type IPresence as Presence,
	Latest as latestStateFactory,
	LatestValueManagerEvents as LatestStateEvents,
	PresenceStates as Workspace,
	LatestValueManager as LatestState,
	ClientSessionId,
	ClientConnectionId,
} from "@fluidframework/presence/alpha";
import { Listenable } from "fluid-framework";
import { SelectionManager, SelectionPackage } from "./Interfaces/SelectionManager.js";

// A function that creates a new SelectionManager instance
// with the given presence and workspace.
export function createTableSelectionManager(props: {
	presence: Presence;
	workspace: Workspace<{}>;
	name: string;
}): SelectionManager<TableSelection> {
	const { presence, workspace, name } = props;

	class SelectionManagerImpl implements SelectionManager<TableSelection> {
		initialState: SelectionPackage<TableSelection> = { selected: [] }; // Default initial state for the selection manager

		state: LatestState<SelectionPackage<TableSelection>>;

		constructor(
			name: string,
			workspace: Workspace<{}>,
			private presence: Presence,
		) {
			workspace.add(name, latestStateFactory(this.initialState));
			this.state = workspace.props[name];
		}

		public get events(): Listenable<LatestStateEvents<SelectionPackage<TableSelection>>> {
			return this.state.events;
		}

		public clients = {
			getAttendee: (clientId: ClientConnectionId | ClientSessionId) => {
				return this.presence.getAttendee(clientId);
			},
			getAttendees: () => {
				return this.presence.getAttendees();
			},
			getMyself: () => {
				return this.presence.getMyself();
			},
			events: this.presence.events,
		};

		/** Test if the given id is selected by the local client */
		public testSelection(sel: TableSelection) {
			return this._testForInclusion(sel, this.state.local.selected);
		}

		/** Test if the given id is selected by any remote client */
		public testRemoteSelection(sel: TableSelection): string[] {
			const remoteSelectedClients: string[] = [];
			for (const cv of this.state.clientValues()) {
				if (cv.client.getConnectionStatus() === "Connected") {
					if (this._testForInclusion(sel, cv.value.selected)) {
						remoteSelectedClients.push(cv.client.sessionId);
					}
				}
			}
			return remoteSelectedClients;
		}

		/** Clear the current selection */
		public clearSelection() {
			this.state.local = this.initialState;
		}

		/** Change the selection to the given id or array of ids */
		public setSelection(sel: TableSelection | TableSelection[]) {
			if (Array.isArray(sel)) {
				// If an array of selections is provided, set it directly
				this.state.local = { selected: sel };
			} else {
				// Otherwise, set the single selection
				this.state.local = { selected: [sel] };
			}
			/**
			 * Note: This will overwrite the current local selection with the new one.
			 * This means that if you want to maintain previous selections, you should use `addToSelection` or `toggleSelection` instead.
			 */
			return;
		}

		/** Toggle the selection of the given id */
		public toggleSelection(sel: TableSelection) {
			if (this.testSelection(sel)) {
				this.removeFromSelection(sel);
			} else {
				this.addToSelection(sel);
			}
			return;
		}

		/** Add the given id to the selection */
		public addToSelection(sel: TableSelection) {
			const arr: TableSelection[] = this.state.local.selected.slice();
			if (!this._testForInclusion(sel, arr)) {
				arr.push(sel);
			}
			this.state.local = { selected: arr };
		}

		/** Remove the given id from the selection */
		public removeFromSelection(sel: TableSelection) {
			const arr: TableSelection[] = this.state.local.selected.filter((s) => s.id !== sel.id);
			this.state.local = { selected: arr };
		}

		/** Get the current local selection array */
		public getLocalSelection(): readonly TableSelection[] {
			return this.state.local.selected;
		}

		/** Get the current remote selection map where the key is the selected item id and the value is an array of client ids */
		public getRemoteSelected(): Map<TableSelection, string[]> {
			const remoteSelected = new Map<TableSelection, string[]>();
			for (const cv of this.state.clientValues()) {
				if (cv.client.getConnectionStatus() === "Connected") {
					for (const sel of cv.value.selected) {
						if (!remoteSelected.has(sel)) {
							remoteSelected.set(sel, []);
						}
						remoteSelected.get(sel)?.push(cv.client.sessionId);
					}
				}
			}

			return remoteSelected;
		}

		private _testForInclusion(
			sel: TableSelection,
			collection: readonly TableSelection[],
		): boolean {
			/**
			 * Helper function to test for inclusion of a selection in a collection.
			 */
			if (!collection || collection.length === 0) {
				return false;
			}

			for (const s of collection) {
				if (s.id === sel.id && s.type === sel.type) {
					return true;
				}
			}
			return false;
		}
	}

	return new SelectionManagerImpl(name, workspace, presence);
}

export type TableSelection = {
	id: string; // The unique identifier for the selected item
	type: selectionType; // The type of the selection (row, column, cell, etc.)
};

export type selectionType = "row" | "column" | "cell";
