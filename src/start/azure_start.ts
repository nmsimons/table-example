import { AzureClient } from "@fluidframework/azure-client";
import { loadApp } from "../app_load.js";
import { getClientProps } from "../infra/azure/azureClientProps.js";
import { AttachState } from "fluid-framework";
import { AccountInfo, PublicClientApplication } from "@azure/msal-browser";
import { authHelper } from "../infra/auth.js";
import { GraphHelper } from "../infra/graph.js";

export async function azureStart() {
	// Get the user info
	const msalInstance: PublicClientApplication = await authHelper();

	// Handle the login redirect flows
	const tokenResponse = await msalInstance.handleRedirectPromise().catch((error: Error) => {
		console.log("Error in handleRedirectPromise: " + error.message);
	});

	// If the tokenResponse is not null, then the user is signed in
	// and the tokenResponse is the result of the redirect.
	if (tokenResponse !== null) {
		const account = msalInstance.getAllAccounts()[0];
		signedInAzureStart(msalInstance, account);
	} else {
		const currentAccounts = msalInstance.getAllAccounts();
		if (currentAccounts.length === 0) {
			// no accounts signed-in, attempt to sign a user in
			msalInstance.loginRedirect();
		} else if (currentAccounts.length > 1 || currentAccounts.length === 1) {
			// The user is signed in.
			// Treat more than one account signed in and a single account the same as
			// this is just a sample. But a real app would need to handle the multiple accounts case.
			// For now, just use the first account.
			const account = msalInstance.getAllAccounts()[0];
			signedInAzureStart(msalInstance, account);
		}
	}
}

async function signedInAzureStart(msalInstance: PublicClientApplication, account: AccountInfo) {
	// Set the active account
	msalInstance.setActiveAccount(account);

	// Create the azureUser from the account
	const azureUser = {
		name: account.name ?? "Unknown",
		id: account.localAccountId,
	};

	// Get the root container id from the URL
	// If there is no container id, then the app will make
	// a new container.
	let containerId = location.hash.substring(1);

	// Initialize Devtools logger if in development mode
	let telemetryLogger = undefined;
	if (process.env.NODE_ENV === "development") {
		const { createDevtoolsLogger } = await import("@fluidframework/devtools/beta");
		telemetryLogger = createDevtoolsLogger();
	}

	// Initialize the Azure client
	const clientProps = getClientProps(azureUser, telemetryLogger);
	const client = new AzureClient(clientProps);

	// Get the graph client
	const graphHelper = new GraphHelper(msalInstance, account);

	// Load the app
	const container = await loadApp(client, containerId, telemetryLogger);

	// If the app is in a `createNew` state - no containerId, and the container is detached, we attach the container.
	// This uploads the container to the service and connects to the collaboration session.
	if (container.attachState === AttachState.Detached) {
		containerId = await container.attach();

		// The newly attached container is given a unique ID that can be used to access the container in another session
		history.replaceState(undefined, "", "#" + containerId);
	}
}
