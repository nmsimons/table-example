/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import {
	type IPresence,
	Latest,
	type PresenceStatesSchema,
	type PresenceStatesEntries,
	LatestValueManagerEvents,
} from "@fluidframework/presence/alpha";
import { Listenable } from "fluid-framework";

export type selectionType = "row" | "column" | "cell" | "";

type selection = {
	items: string[];
	type: selectionType;
};

export class SelectionManager {
	statesSchema = {
		// sets selected to an array of strings
		selected: Latest<selection>({ items: [], type: "" }),
	} satisfies PresenceStatesSchema;

	private valueManager: PresenceStatesEntries<typeof this.statesSchema>["selected"];

	constructor(presence: IPresence, statesName: string) {
		const statesWorkspace = presence.getStates("name:selectionManager", {});
		// Workaround ts(2775): Assertions require every name in the call target to be declared with an explicit type annotation.
		const workspace: typeof statesWorkspace = statesWorkspace;
		workspace.add(statesName, Latest<selection>({ items: [], type: "" }));
		this.valueManager = workspace.props[statesName];
	}

	// export events
	public get events(): Listenable<LatestValueManagerEvents<selection>> {
		return this.valueManager.events;
	}

	public testSelection(id: string) {
		// check if the id is in the local selection
		return this.valueManager.local.items.some((item) => item === id);
	}

	public testRemoteSelection(id: string) {
		const remoteSelectedClients: string[] = [];

		for (const cv of this.valueManager.clientValues()) {
			if (cv.client.getConnectionStatus() === "Connected") {
				if (cv.value.items.some((item) => item === id)) {
					remoteSelectedClients.push(cv.client.sessionId);
				}
			}
		}

		return remoteSelectedClients.length > 0;
	}

	public toggleMultiSelection(id: string, type: selectionType) {
		// check if type matches the current type and clear the selection if it doesn't
		if (this.valueManager.local.type !== type) {
			this.valueManager.local = { items: [], type };
		}

		const arr: string[] = this.valueManager.local.items.slice();
		const i = arr.indexOf(id);
		if (i == -1) {
			arr.push(id);
		} else {
			arr.splice(i, 1);
		}
		this.valueManager.local = { items: arr, type };
		return;
	}

	public toggleSelection(id: string, type: selectionType) {
		// check if type matches the current type and clear the selection if it doesn't
		if (this.valueManager.local.type !== type) {
			this.valueManager.local = { items: [], type };
		}
		const arr: string[] = this.valueManager.local.items.slice();
		const i = arr.indexOf(id);
		if (i == -1) {
			this.valueManager.local = { items: [id], type };
		} else {
			this.valueManager.local = { items: [], type };
		}
		return;
	}

	public replaceSelection(id: string, type: selectionType) {
		let arr: string[] = [];
		arr = [id];
		this.valueManager.local = { items: arr, type };
		return;
	}

	public appendSelection(id: string, type: selectionType) {
		// check if type matches the current type and clear the selection if it doesn't
		if (this.valueManager.local.type !== type) {
			this.valueManager.local = { items: [], type };
		}
		const arr: string[] = this.valueManager.local.items.slice();
		const i = arr.indexOf(id);
		if (i == -1) {
			arr.push(id);
		}
		this.valueManager.local = { items: arr, type };
		return;
	}

	public removeFromSelection(id: string, type: selectionType) {
		if (this.valueManager.local.type !== type) return;
		const arr: string[] = this.valueManager.local.items.slice();
		const i = arr.indexOf(id);
		if (i != -1) {
			arr.splice(i, 1);
			this.valueManager.local = { items: arr, type: this.valueManager.local.type };
		}

		return;
	}

	public clearSelection() {
		this.valueManager.local = { items: [], type: "" };
	}

	public getSelected(type: selectionType) {
		if (this.valueManager.local.type !== type) {
			return [];
		}
		return this.valueManager.local.items;
	}

	public getRemoteSelected() {
		return this.valueManager.clientValues();
	}
}
