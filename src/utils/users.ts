/* eslint-disable @typescript-eslint/no-empty-object-type */
// A function that creates a new UsersManager instance
// with the given presence and workspace.

import {
	type Presence,
	StateFactory,
	LatestRawEvents as LatestStateEvents,
	StatesWorkspace as Workspace,
	LatestRaw as LatestState,
	type AttendeeId,
	ClientConnectionId,
	AttendeeStatus,
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
			workspace.add(name, StateFactory.latest({ local: this.initialState }));
			this.state = workspace.states[name];
		}

		public get events(): Listenable<LatestStateEvents<UserInfo>> {
			return this.state.events;
		}

		public clients = {
			getAttendee: (clientId: ClientConnectionId | AttendeeId) => {
				return this.presence.attendees.getAttendee(clientId);
			},
			getAttendees: () => {
				return this.presence.attendees.getAttendees();
			},
			getMyself: () => {
				return this.presence.attendees.getMyself();
			},
			events: this.presence.attendees.events,
		};

		getUsers(): readonly User[] {
			return [...this.state.getRemotes()];
		}

		getConnectedUsers(): readonly User[] {
			return this.getUsers().filter(
				(user) => user.attendee.getConnectionStatus() === AttendeeStatus.Connected,
			);
		}

		getDisconnectedUsers(): readonly User[] {
			return this.getUsers().filter(
				(user) => user.attendee.getConnectionStatus() === AttendeeStatus.Disconnected,
			);
		}

		updateMyself(userInfo: UserInfo): void {
			this.state.local = userInfo; // Update the local state with the new user info
		}

		getMyself(): User {
			return { value: this.state.local, attendee: this.presence.attendees.getMyself() };
		}
	}

	return new UsersManagerImpl(name, workspace, presence);
}
