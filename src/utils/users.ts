/* eslint-disable @typescript-eslint/no-empty-object-type */
// A function that creates a new UsersManager instance
// with the given presence and workspace.

import {
	type IPresence as Presence,
	Latest as latestStateFactory,
	LatestValueManagerEvents as LatestStateEvents,
	PresenceStates as Workspace,
	LatestValueManager as LatestState,
	ClientSessionId,
	ClientConnectionId,
	SessionClientStatus,
} from "@fluidframework/presence/alpha";
import { UsersManager, User, UserInfo } from "./Interfaces/UsersManager.js";
import { Listenable } from "fluid-framework";

export function createUsersManager(props: {
	presence: Presence;
	workspace: Workspace<{}>;
	name: string;
	me: UserInfo;
}): UsersManager {
	const { presence, workspace, name, me } = props;

	class UsersManagerImpl implements UsersManager {
		initialState: UserInfo = me; // Default initial state for the user manager
		state: LatestState<UserInfo>;

		constructor(
			name: string,
			workspace: Workspace<{}>,
			private presence: Presence,
		) {
			workspace.add(name, latestStateFactory(this.initialState));
			this.state = workspace.props[name];
		}

		public get events(): Listenable<LatestStateEvents<UserInfo>> {
			return this.state.events;
		}

		public clients = {
			getAttendee: (clientId: ClientConnectionId | ClientSessionId) => {
				return this.presence.getAttendee(clientId);
			},
			getAttendees: () => {
				return this.presence.getAttendees();
			},
			getMyself: () => {
				return this.presence.getMyself();
			},
			events: this.presence.events,
		};

		getUsers(): readonly User[] {
			return [...this.state.clientValues()];
		}

		getConnectedUsers(): readonly User[] {
			return this.getUsers().filter(
				(user) => user.client.getConnectionStatus() === SessionClientStatus.Connected,
			);
		}

		getDisconnectedUsers(): readonly User[] {
			return this.getUsers().filter(
				(user) => user.client.getConnectionStatus() === SessionClientStatus.Disconnected,
			);
		}

		updateMyself(userInfo: UserInfo): void {
			this.state.local = userInfo; // Update the local state with the new user info
		}

		getMyself(): User {
			return { value: this.state.local, client: this.presence.getMyself() };
		}
	}

	return new UsersManagerImpl(name, workspace, presence);
}
