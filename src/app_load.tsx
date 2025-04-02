import type { ITelemetryBaseLogger } from "@fluidframework/core-interfaces";
import { AzureClient } from "@fluidframework/azure-client";
import React from "react";
import { createRoot } from "react-dom/client";
import { ReactApp } from "./react/ux.js";
import { appTreeConfiguration, FluidTable, hintValues } from "./schema/app_schema.js";
import { createUndoRedoStacks } from "./utils/undo.js";
import { containerSchema } from "./schema/container_schema.js";
import { loadFluidData } from "./infra/fluid.js";
import { IFluidContainer } from "fluid-framework";

import { acquirePresenceViaDataObject } from "@fluidframework/presence/alpha";
import { createTableSelectionManager } from "./utils/selection.js";

export async function loadApp(props: {
	client: AzureClient;
	containerId: string;
	logger?: ITelemetryBaseLogger;
}): Promise<IFluidContainer> {
	const { client, containerId, logger } = props;

	// Initialize Fluid Container
	const { services, container } = await loadFluidData(
		containerId,
		containerSchema,
		client,
		logger,
	);

	// Create an array of rows to be used in the table
	const rows = new Array(10).fill(null).map(() => {
		return { _cells: [], props: null };
	});

	// Initialize the SharedTree DDSes
	const appTree = container.initialObjects.appData.viewWith(appTreeConfiguration);
	if (appTree.compatibility.canInitialize) {
		appTree.initialize(
			new FluidTable({
				rows: rows,
				columns: [
					{
						name: "String",
						hint: hintValues.string,
						props: null,
					},
					{
						name: "Number",
						hint: hintValues.number,
						props: null,
					},
					{
						name: "Boolean",
						hint: hintValues.boolean,
						props: null,
					},
					{
						name: "Date",
						hint: hintValues.date,
						props: null,
					},
					{
						name: "Vote",
						hint: hintValues.vote,
						props: null,
					},
				],
			}),
		);
	}

	// Get the Presence data object from the container
	const presence = acquirePresenceViaDataObject(container.initialObjects.presence);

	// Create a workspace for the selection manager
	const workspace = presence.getStates("workspace:main", {});

	// Create a selection manager in the workspace
	// The selection manager will be used to manage the selection of cells in the table
	// and will be used to synchronize the selection across clients
	const selection = createTableSelectionManager({
		name: "selection:main", // The name of the workspace
		workspace, // The presence workspace
		presence, // The presence data object
	});

	// create the root element for React
	const app = document.createElement("div");
	app.id = "app";
	document.body.appendChild(app);
	const root = createRoot(app);

	// Create undo/redo stacks for the app
	const undoRedo = createUndoRedoStacks(appTree.events);

	// Render the app - note we attach new containers after render so
	// the app renders instantly on create new flow. The app will be
	// interactive immediately.
	root.render(
		<ReactApp
			table={appTree}
			selection={selection}
			audience={services.audience}
			container={container}
			undoRedo={undoRedo}
		/>,
	);

	return container;
}
