/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import {
	Latest as latestStateFactory,
	LatestValueManagerEvents as LatestStateEvents,
	PresenceStates as Workspace,
	LatestValueManager as LatestState,
} from "@fluidframework/presence/alpha";
import { Listenable } from "fluid-framework";

export type selectionType = "row" | "column" | "cell" | "";

type selection = {
	items: string[];
	type: selectionType;
};

export class SelectionManager {
	private state: LatestState<selection>;

	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	constructor(workspace: Workspace<{}>, name: string) {
		workspace.add(name, latestStateFactory<selection>({ items: [], type: "" }));
		this.state = workspace.props[name];
	}

	// export events
	public get events(): Listenable<LatestStateEvents<selection>> {
		return this.state.events;
	}

	public testSelection(id: string) {
		// check if the id is in the local selection
		return this.state.local.items.some((item) => item === id);
	}

	public testRemoteSelection(id: string) {
		const remoteSelectedClients: string[] = [];

		for (const cv of this.state.clientValues()) {
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
		if (this.state.local.type !== type) {
			this.state.local = { items: [], type };
		}

		const arr: string[] = this.state.local.items.slice();
		const i = arr.indexOf(id);
		if (i == -1) {
			arr.push(id);
		} else {
			arr.splice(i, 1);
		}
		this.state.local = { items: arr, type };
		return;
	}

	public toggleSelection(id: string, type: selectionType) {
		// check if type matches the current type and clear the selection if it doesn't
		if (this.state.local.type !== type) {
			this.state.local = { items: [], type };
		}
		const arr: string[] = this.state.local.items.slice();
		const i = arr.indexOf(id);
		if (i == -1) {
			this.state.local = { items: [id], type };
		} else {
			this.state.local = { items: [], type };
		}
		return;
	}

	public replaceSelection(id: string, type: selectionType) {
		let arr: string[] = [];
		arr = [id];
		this.state.local = { items: arr, type };
		return;
	}

	public appendSelection(id: string, type: selectionType) {
		// check if type matches the current type and clear the selection if it doesn't
		if (this.state.local.type !== type) {
			this.state.local = { items: [], type };
		}
		const arr: string[] = this.state.local.items.slice();
		const i = arr.indexOf(id);
		if (i == -1) {
			arr.push(id);
		}
		this.state.local = { items: arr, type };
		return;
	}

	public removeFromSelection(id: string, type: selectionType) {
		if (this.state.local.type !== type) return;
		const arr: string[] = this.state.local.items.slice();
		const i = arr.indexOf(id);
		if (i != -1) {
			arr.splice(i, 1);
			this.state.local = { items: arr, type: this.state.local.type };
		}

		return;
	}

	public clearSelection() {
		this.state.local = { items: [], type: "" };
	}

	public getSelected(type: selectionType) {
		if (this.state.local.type !== type) {
			return [];
		}
		return this.state.local.items;
	}

	public getRemoteSelected() {
		return this.state.clientValues();
	}
}
