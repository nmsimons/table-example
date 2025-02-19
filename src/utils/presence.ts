/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import {
	type IPresence,
	Latest,
	type PresenceStatesSchema,
	type PresenceStatesEntries,
} from "@fluidframework/presence/alpha";

type payload = string;

export class SelectionManager extends EventTarget {
	statesName: `${string}:${string}`;

	statesSchema = {
		// sets selected to an array of strings
		selected: Latest({ items: [] as payload[] }),
	} satisfies PresenceStatesSchema;

	private valueManager: PresenceStatesEntries<typeof this.statesSchema>["selected"];

	constructor(presence: IPresence, statesName: `${string}:${string}`) {
		super();
		this.statesName = statesName;
		this.valueManager = presence.getStates(this.statesName, this.statesSchema).props.selected;
		this.valueManager.events.on("updated", () =>
			this.dispatchEvent(new Event("selectionChanged")),
		);
	}

	public testSelection(id: payload) {
		// check if the id is in the local selection
		return this.valueManager.local.items.some((item) => item === id);
	}

	public testRemoteSelection(id: payload) {
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

	public updateSelection(id: payload) {
		let arr: payload[] = [];
		const i = this.valueManager.local.items.indexOf(id);
		if (i == -1) {
			arr = [id];
		}
		this.valueManager.local = { items: arr };

		// emit an event to notify the app that the selection has changed
		this.dispatchEvent(new Event("selectionChanged"));

		return;
	}

	public appendSelection(id: payload) {
		const arr: payload[] = this.valueManager.local.items.slice();
		const i = arr.indexOf(id);
		if (i == -1) {
			arr.push(id);
		} else {
			arr.splice(i, 1);
		}
		this.valueManager.local = { items: arr };

		// emit an event to notify the app that the selection has changed
		this.dispatchEvent(new Event("selectionChanged"));

		return;
	}

	public clearSelection() {
		this.valueManager.local = { items: [] };
		this.dispatchEvent(new Event("selectionChanged"));
	}

	public getSelected() {
		return this.valueManager.local.items;
	}

	public getRemoteSelected() {
		return this.valueManager.clientValues();
	}

	public dispose() {
		this.valueManager.events.off("updated", () =>
			this.dispatchEvent(new Event("selectionChanged")),
		);
	}
}
