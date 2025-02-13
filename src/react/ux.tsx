/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import React, { JSX, useEffect, useState } from "react";
import { Table } from "../schema/app_schema.js";
import "../output.css";
import { IFluidContainer, IMember, IServiceAudience, Tree, TreeView } from "fluid-framework";
import { Canvas } from "./canvasux.js";
import type { SelectionManager } from "../utils/presence_helpers.js";
import { undoRedo } from "../utils/undo.js";

export function ReactApp(props: {
	table: TreeView<typeof Table>;
	selection: SelectionManager;
	audience: IServiceAudience<IMember>;
	container: IFluidContainer;
	undoRedo: undoRedo;
}): JSX.Element {
	const [currentUser, setCurrentUser] = useState("");
	const [connectionState, setConnectionState] = useState("");
	const [saved, setSaved] = useState(false);
	const [fluidMembers, setFluidMembers] = useState<string[]>([]);

	/** Unsubscribe to undo-redo events when the component unmounts */
	useEffect(() => {
		return props.undoRedo.dispose;
	}, []);

	return (
		<div
			id="main"
			className="flex flex-col bg-transparent h-screen w-full overflow-hidden overscroll-none"
		>
			<Header
				saved={saved}
				connectionState={connectionState}
				fluidMembers={fluidMembers}
				clientId={currentUser}
				table={props.table.root}
			/>
			<div className="flex h-[calc(100vh-48px)] flex-row ">
				<Canvas
					table={props.table.root}
					selection={props.selection}
					audience={props.audience}
					container={props.container}
					fluidMembers={fluidMembers}
					currentUser={currentUser}
					undoRedo={props.undoRedo}
					setCurrentUser={setCurrentUser}
					setConnectionState={setConnectionState}
					setSaved={setSaved}
					setFluidMembers={setFluidMembers}
				/>
			</div>
		</div>
	);
}

export function Header(props: {
	saved: boolean;
	connectionState: string;
	fluidMembers: string[];
	clientId: string;
	table: Table;
}): JSX.Element {
	// Update when the table changes
	const [rowCount, setRowCount] = useState(props.table.rows.length);

	useEffect(() => {
		const unsubscribe = Tree.on(props.table, "treeChanged", () => {
			setRowCount(props.table.rows.length);
		});
		return unsubscribe;
	}, [props.table]);

	return (
		<div className="h-[48px] flex shrink-0 flex-row items-center justify-between bg-black text-base text-white z-40 w-full">
			<div className="flex m-2">Table</div>
			<div className="flex m-2 ">
				{rowCount} rows | {props.saved ? "saved" : "not saved"} | {props.connectionState} |
				users: {props.fluidMembers.length}
			</div>
		</div>
	);
}
