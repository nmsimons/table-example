import type { ITelemetryBaseLogger } from "@fluidframework/core-interfaces";
import { AzureClient } from "@fluidframework/azure-client";
import { OdspClient } from "@fluidframework/odsp-client/beta";
import React from "react";
import { createRoot } from "react-dom/client";
import { ReactApp } from "./react/ux.js";
import { appTreeConfiguration, FluidTable } from "./schema/app_schema.js";
import { createUndoRedoStacks } from "./utils/undo.js";
import { containerSchema } from "./schema/container_schema.js";
import { loadFluidData } from "./infra/fluid.js";
import { IFluidContainer } from "fluid-framework";

import { acquirePresenceViaDataObject } from "@fluidframework/presence/alpha";
import { SelectionManager } from "./utils/presence.js";

export async function loadApp(
	client: AzureClient | OdspClient,
	containerId: string,
	logger?: ITelemetryBaseLogger,
): Promise<IFluidContainer> {
	// Initialize Fluid Container
	const { services, container } = await loadFluidData(
		containerId,
		containerSchema,
		client,
		logger,
	);

	// Create an array of rows to be used in the table
	const rows = new Array(10).fill(null).map(() => {
		return { _cells: [] };
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
						defaultValue: "",
					},
					{
						name: "Number",
						defaultValue: 0,
					},
					{
						name: "Boolean",
						defaultValue: false,
					},
					{
						name: "Date",
						hint: "date",
					},
					{
						name: "Vote",
						hint: "vote",
					},
				],
			}),
		);
	}

	// Get the Presence data object from the container
	const selection = new SelectionManager(
		acquirePresenceViaDataObject(container.initialObjects.presence),
		"selection:main",
	);

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
