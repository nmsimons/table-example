import {
	ClientConnectionId,
	ClientSessionId,
	ISessionClient as SessionClient,
	PresenceEvents,
	LatestValueManager as LatestState,
	LatestValueManagerEvents as LatestStateEvents,
	LatestMapValueManager as LatestMap,
	LatestMapValueManagerEvents as LatestMapEvents,
} from "@fluidframework/presence/alpha";
import { Listenable } from "fluid-framework";

export interface presenceClients {
	getAttendee: (clientId: ClientConnectionId | ClientSessionId) => SessionClient;
	getAttendees: () => ReadonlySet<SessionClient>;
	getMyself: () => SessionClient;
	events: Listenable<PresenceEvents>;
}

export interface PresenceManager<TState> {
	initialState: TState;
	state: LatestState<TState>;
	clients: presenceClients;
	events: Listenable<LatestStateEvents<TState>>;
}

export interface PresenceMapManager<TState> {
	state: LatestMap<TState>;
	clients: presenceClients;
	events: Listenable<LatestMapEvents<TState, string>>;
}
