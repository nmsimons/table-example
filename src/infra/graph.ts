import { PublicClientApplication, AccountInfo } from "@azure/msal-browser";
import { Client } from "@microsoft/microsoft-graph-client";

// A Helper class to initialize the Microsoft Graph client
// and provide functions to call the Microsoft Graph API
export class GraphHelper {
	private graphClient: Client;

	constructor(
		private msalInstance: PublicClientApplication,
		private account: AccountInfo,
	) {
		this.graphClient = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: async () => {
					const response = await this.msalInstance.acquireTokenSilent({
						account: this.account,
						scopes: ["User.Read"],
					});
					return response.accessToken;
				},
			},
		});
	}

	async getUserInfo(): Promise<{ id: string; displayName: string; mail: string }> {
		try {
			const user = await this.graphClient.api("/me").get();
			return user;
		} catch (error) {
			console.error("Error fetching user info:", error);
			throw error;
		}
	}
}
