/* eslint-disable @typescript-eslint/no-unused-vars */
/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import React, { JSX, useEffect } from "react";
import { FluidTable } from "../schema/app_schema.js";
import { ConnectionState, IFluidContainer, IServiceAudience, Myself } from "fluid-framework";
import { undoRedo } from "../utils/undo.js";
import type { SelectionManager } from "../utils/Interfaces/SelectionManager.js";

import { TableView } from "./tableux.js";
import { AzureMember } from "@fluidframework/azure-client";
import { TableSelection } from "../utils/selection.js";

export function Canvas(props: {
	table: FluidTable;
	selection: SelectionManager<TableSelection>;
	audience: IServiceAudience<AzureMember>;
	container: IFluidContainer;
	fluidMembers: AzureMember[];
	currentUser: AzureMember;
	setConnectionState: (arg: string) => void;
	setSaved: (arg: boolean) => void;
	setFluidMembers: (arg: AzureMember[]) => void;
	setCurrentUser: (arg: Myself<AzureMember>) => void;
}): JSX.Element {
	const {
		table,
		selection,
		audience,
		container,
		currentUser,
		setConnectionState,
		setSaved,
		setFluidMembers,
		setCurrentUser,
	} = props;

	useEffect(() => {
		const updateConnectionState = () => {
			if (container.connectionState === ConnectionState.Connected) {
				setConnectionState("connected");
			} else if (props.container.connectionState === ConnectionState.Disconnected) {
				setConnectionState("disconnected");
			} else if (props.container.connectionState === ConnectionState.EstablishingConnection) {
				setConnectionState("connecting");
			} else if (props.container.connectionState === ConnectionState.CatchingUp) {
				setConnectionState("catching up");
			}
		};
		updateConnectionState();
		setSaved(!props.container.isDirty);
		container.on("connected", updateConnectionState);
		container.on("disconnected", updateConnectionState);
		container.on("dirty", () => props.setSaved(false));
		container.on("saved", () => props.setSaved(true));
		container.on("disposed", updateConnectionState);
	}, []);

	const updateMembers = () => {
		if (container.connectionState !== ConnectionState.Connected) return;
		setFluidMembers(Array.from(audience.getMembers().values()));
		setCurrentUser(audience.getMyself()!);
	};

	useEffect(() => {
		audience.on("membersChanged", updateMembers);
		updateMembers();
		return () => {
			audience.off("membersChanged", updateMembers);
		};
	}, []);

	return (
		<div className="relative flex grow-0 h-full w-full bg-transparent">
			<TableView fluidTable={table} selection={selection} user={currentUser} />
		</div>
	);
}
