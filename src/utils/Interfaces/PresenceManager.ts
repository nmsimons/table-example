import {
	ClientConnectionId,
	ClientSessionId,
	ISessionClient as SessionClient,
	PresenceEvents as ClientEvents,
	LatestValueManager as LatestState,
	LatestValueManagerEvents as LatestStateEvents,
	LatestMapValueManager as LatestMap,
	LatestMapValueManagerEvents as LatestMapEvents,
} from "@fluidframework/presence/alpha";
import { Listenable } from "fluid-framework";

export interface PresenceClients {
	getAttendee: (clientId: ClientConnectionId | ClientSessionId) => SessionClient;
	getAttendees: () => ReadonlySet<SessionClient>;
	getMyself: () => SessionClient;
	events: Listenable<ClientEvents>;
}

export interface PresenceManager<TState> {
	initialState: TState;
	state: LatestState<TState>;
	clients: PresenceClients;
	events: Listenable<LatestStateEvents<TState>>;
}

export interface PresenceMapManager<TState> {
	state: LatestMap<TState>;
	clients: PresenceClients;
	events: Listenable<LatestMapEvents<TState, string>>;
}
