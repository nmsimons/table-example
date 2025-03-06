/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import React, { JSX, useEffect, useState } from "react";
import { FluidTable } from "../schema/app_schema.js";
import "../output.css";
import { IFluidContainer, IMember, IServiceAudience, Tree, TreeView } from "fluid-framework";
import { Canvas } from "./canvasux.js";
import type { SelectionManager } from "../utils/presence.js";
import { undoRedo } from "../utils/undo.js";
import {
	Toolbar,
	ButtonGroup,
	NewColumnButton,
	NewEmptyRowButton,
	NewRowButton,
	NewManysRowsButton,
	DeleteAllRowsButton,
	UndoButton,
	RedoButton,
	DeleteSelectedRowsButton,
	MoveSelectedRowsButton,
	MoveSelectedColumnsButton,
} from "./buttonux.js";

export function ReactApp(props: {
	table: TreeView<typeof FluidTable>;
	selection: SelectionManager;
	audience: IServiceAudience<IMember>;
	container: IFluidContainer;
	undoRedo: undoRedo;
}): JSX.Element {
	const { table, selection, audience, container, undoRedo } = props;

	const [currentUser, setCurrentUser] = useState(
		audience.getMyself() ?? { id: "unknown", connections: [] },
	);
	const [connectionState, setConnectionState] = useState("");
	const [saved, setSaved] = useState(false);
	const [fluidMembers, setFluidMembers] = useState<IMember[]>([]);

	/** Unsubscribe to undo-redo events when the component unmounts */
	useEffect(() => {
		return undoRedo.dispose;
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
				clientId={currentUser.id}
				table={table.root}
			/>
			<Toolbar>
				<ButtonGroup>
					<NewColumnButton table={table.root} />
					<NewEmptyRowButton table={table.root} selection={selection} />
					<NewRowButton table={table.root} selection={selection} />
					<NewManysRowsButton table={table.root} />
					<MoveSelectedRowsButton table={table.root} selection={selection} up={true} />
					<MoveSelectedRowsButton table={table.root} selection={selection} up={false} />
					<MoveSelectedColumnsButton
						table={table.root}
						selection={selection}
						left={true}
					/>
					<MoveSelectedColumnsButton
						table={table.root}
						selection={selection}
						left={false}
					/>
					<DeleteSelectedRowsButton table={table.root} selection={selection} />
					<DeleteAllRowsButton table={table.root} />
				</ButtonGroup>
				<ButtonGroup>
					<UndoButton undo={() => undoRedo.undo()} />
					<RedoButton redo={() => undoRedo.redo()} />
				</ButtonGroup>
			</Toolbar>
			<div className="flex h-[calc(100vh-96px)] w-full flex-row ">
				<Canvas
					table={table.root}
					selection={selection}
					audience={audience}
					container={container}
					fluidMembers={fluidMembers}
					currentUser={currentUser}
					undoRedo={undoRedo}
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
	fluidMembers: IMember[];
	clientId: string;
	table: FluidTable;
}): JSX.Element {
	// Update when the table changes
	const [rowCount, setRowCount] = useState(props.table.rows.length);

	useEffect(() => {
		const unsubscribe = Tree.on(props.table.rows, "nodeChanged", () => {
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
