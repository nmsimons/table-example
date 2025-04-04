/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import React, { JSX, useContext, useEffect, useState } from "react";
import { FluidTable } from "../schema/app_schema.js";
import "../output.css";
import { IFluidContainer, Tree, TreeView } from "fluid-framework";
import { Canvas } from "./canvasux.js";
import type { SelectionManager } from "../utils/Interfaces/SelectionManager.js";
import { undoRedo } from "../utils/undo.js";
import {
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
import { TableSelection } from "../utils/selection.js";
import {
	Avatar,
	AvatarGroup,
	AvatarGroupItem,
	AvatarGroupPopover,
	AvatarGroupProps,
	partitionAvatarGroupItems,
	Text,
	Toolbar,
	ToolbarDivider,
	ToolbarGroup,
	Tooltip,
} from "@fluentui/react-components";
import { User, UsersManager } from "../utils/Interfaces/UsersManager.js";
import { PresenceContext } from "./PresenceContext.js";

export function ReactApp(props: {
	table: TreeView<typeof FluidTable>;
	selection: SelectionManager<TableSelection>;
	users: UsersManager;
	container: IFluidContainer;
	undoRedo: undoRedo;
}): JSX.Element {
	const { table, selection, users, container, undoRedo } = props;
	const [connectionState, setConnectionState] = useState("");
	const [saved, setSaved] = useState(false);

	/** Unsubscribe to undo-redo events when the component unmounts */
	useEffect(() => {
		return undoRedo.dispose;
	}, []);

	return (
		<PresenceContext.Provider
			value={{
				users: users,
				selection: selection,
			}}
		>
			<div
				id="main"
				className="flex flex-col bg-transparent h-screen w-full overflow-hidden overscroll-none"
			>
				<Header saved={saved} connectionState={connectionState} table={table.root} />
				<Toolbar className="h-[48px]">
					<ToolbarGroup>
						<NewColumnButton table={table.root} />
						<NewEmptyRowButton table={table.root} selection={selection} />
						<NewRowButton table={table.root} selection={selection} />
						<NewManysRowsButton table={table.root} />
					</ToolbarGroup>
					<ToolbarDivider />
					<ToolbarGroup>
						<MoveSelectedRowsButton
							table={table.root}
							selection={selection}
							up={true}
						/>
						<MoveSelectedRowsButton
							table={table.root}
							selection={selection}
							up={false}
						/>
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
					</ToolbarGroup>
					<ToolbarDivider />
					<ToolbarGroup>
						<DeleteSelectedRowsButton table={table.root} selection={selection} />
						<DeleteAllRowsButton table={table.root} />
					</ToolbarGroup>
					<ToolbarDivider />
					<ToolbarGroup>
						<UndoButton undo={() => undoRedo.undo()} />
						<RedoButton redo={() => undoRedo.redo()} />
					</ToolbarGroup>
				</Toolbar>
				<div className="flex h-[calc(100vh-96px)] w-full flex-row ">
					<Canvas
						table={table.root}
						selection={selection}
						container={container}
						setConnectionState={setConnectionState}
						setSaved={setSaved}
					/>
				</div>
			</div>
		</PresenceContext.Provider>
	);
}

export function Header(props: {
	saved: boolean;
	connectionState: string;
	table: FluidTable;
}): JSX.Element {
	const { saved, connectionState, table } = props;

	return (
		<div className="h-[48px] flex shrink-0 flex-row items-center justify-between bg-black text-base text-white z-40 w-full text-nowrap">
			<div className="flex items-center">
				<div className="flex ml-2 mr-8">
					<Text weight="bold">Table</Text>
				</div>
			</div>
			<div className="flex flex-row items-center m-2">
				<SaveStatus saved={saved} />
				<HeaderDivider />
				<RowCount table={table} />
				<HeaderDivider />
				<ConnectionStatus connectionState={connectionState} />
				<HeaderDivider />
				<UserCorner />
			</div>
		</div>
	);
}

export function RowCount(props: { table: FluidTable }): JSX.Element {
	const { table } = props;
	const [rowCount, setRowCount] = useState(table.rows.length);

	useEffect(() => {
		const unsubscribe = Tree.on(table.rows, "nodeChanged", () => {
			setRowCount(table.rows.length);
		});
		return unsubscribe;
	}, [table]);

	return (
		<div className="flex items-center">
			<Text>{rowCount}&nbsp;rows</Text>
		</div>
	);
}

export function SaveStatus(props: { saved: boolean }): JSX.Element {
	const { saved } = props;
	return (
		<div className="flex items-center">
			<Text>{saved ? "" : "not"}&nbsp;saved</Text>
		</div>
	);
}

export function ConnectionStatus(props: { connectionState: string }): JSX.Element {
	const { connectionState } = props;
	return (
		<div className="flex items-center">
			<Text>{connectionState}</Text>
		</div>
	);
}

export function UserCorner(): JSX.Element {
	return (
		<div className="flex flex-row items-center gap-4 mr-2">
			<Facepile />
			<CurrentUser />
		</div>
	);
}

export const HeaderDivider = (): JSX.Element => {
	return <ToolbarDivider />;
};

export const CurrentUser = (): JSX.Element => {
	const users = useContext(PresenceContext).users;
	return <Avatar name={users.getMyself().value.name} size={24} />;
};

export const Facepile = (props: Partial<AvatarGroupProps>) => {
	const users = useContext(PresenceContext).users;
	const [userRoster, setUserRoster] = useState(users.getUsers());

	useEffect(() => {
		// Check for changes to the user roster and update the avatar group if necessary
		const unsubscribe = users.events.on("updated", () => {
			setUserRoster(users.getConnectedUsers());
		});
		return unsubscribe;
	}, []);

	useEffect(() => {
		// Update the user roster when users disconnect
		const unsubscribe = users.clients.events.on("attendeeDisconnected", () => {
			setUserRoster(users.getConnectedUsers());
		});
		return unsubscribe;
	}, []);

	const { inlineItems, overflowItems } = partitionAvatarGroupItems<User>({
		items: userRoster,
		maxInlineItems: 3, // Maximum number of inline avatars before showing overflow
	});

	if (inlineItems.length === 0) {
		return null; // No users to display
	}

	return (
		<AvatarGroup size={24} {...props}>
			{inlineItems.map((user) => (
				<Tooltip
					key={String(user.client.sessionId ?? user.value.name)}
					content={user.value.name}
					relationship={"label"}
				>
					<AvatarGroupItem
						name={user.value.name}
						key={String(user.client.sessionId ?? user.value.name)}
					/>
				</Tooltip>
			))}
			{overflowItems && (
				<AvatarGroupPopover>
					{overflowItems.map((user) => (
						<AvatarGroupItem
							name={user.value.name}
							key={String(user.client.sessionId ?? user.value.name)}
						/>
					))}
				</AvatarGroupPopover>
			)}
		</AvatarGroup>
	);
};
