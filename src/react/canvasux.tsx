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
import { TableSelection } from "../utils/selection.js";

export function Canvas(props: {
	table: FluidTable;
	selection: SelectionManager<TableSelection>;

	container: IFluidContainer;
	setConnectionState: (arg: string) => void;
	setSaved: (arg: boolean) => void;
}): JSX.Element {
	const { table, selection, container, setConnectionState, setSaved } = props;

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

	return (
		<div className="relative flex grow-0 h-full w-full bg-transparent">
			<TableView fluidTable={table} selection={selection} />
		</div>
	);
}
