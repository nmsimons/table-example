/* eslint-disable @typescript-eslint/no-unused-vars */
/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import React, { JSX, use, useEffect } from "react";
import { FluidTable } from "../schema/app_schema.js";
import { ConnectionState, IFluidContainer, IServiceAudience, Myself } from "fluid-framework";
import { undoRedo } from "../utils/undo.js";
import type { SelectionManager } from "../utils/presence.js";

import { TableView } from "./tableux.js";
import { AzureMember } from "@fluidframework/azure-client";

export function Canvas(props: {
	table: FluidTable;
	selection: SelectionManager;
	audience: IServiceAudience<AzureMember>;
	container: IFluidContainer;
	fluidMembers: AzureMember[];
	currentUser: AzureMember;
	undoRedo: undoRedo;
	setConnectionState: (arg: string) => void;
	setSaved: (arg: boolean) => void;
	setFluidMembers: (arg: AzureMember[]) => void;
	setCurrentUser: (arg: Myself<AzureMember>) => void;
}): JSX.Element {
	useEffect(() => {
		const updateConnectionState = () => {
			if (props.container.connectionState === ConnectionState.Connected) {
				props.setConnectionState("connected");
			} else if (props.container.connectionState === ConnectionState.Disconnected) {
				props.setConnectionState("disconnected");
			} else if (props.container.connectionState === ConnectionState.EstablishingConnection) {
				props.setConnectionState("connecting");
			} else if (props.container.connectionState === ConnectionState.CatchingUp) {
				props.setConnectionState("catching up");
			}
		};
		updateConnectionState();
		props.setSaved(!props.container.isDirty);
		props.container.on("connected", updateConnectionState);
		props.container.on("disconnected", updateConnectionState);
		props.container.on("dirty", () => props.setSaved(false));
		props.container.on("saved", () => props.setSaved(true));
		props.container.on("disposed", updateConnectionState);
	}, []);

	const updateMembers = () => {
		if (props.audience.getMyself() == undefined) return;
		if (props.audience.getMyself()?.id == undefined) return;
		if (props.audience.getMembers() == undefined) return;
		if (props.container.connectionState !== ConnectionState.Connected) return;
		props.setFluidMembers(Array.from(props.audience.getMembers().values()));
		props.setCurrentUser(props.audience.getMyself()!);
	};

	useEffect(() => {
		props.audience.on("membersChanged", updateMembers);
		updateMembers();
		return () => {
			props.audience.off("membersChanged", updateMembers);
		};
	}, []);

	return (
		<div className="relative flex grow-0 h-full w-full bg-transparent">
			<TableView
				fluidTable={props.table}
				selection={props.selection}
				user={props.currentUser}
			/>
		</div>
	);
}
