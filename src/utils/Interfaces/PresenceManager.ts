import {
	ClientConnectionId,
	AttendeeId,
	Attendee,
	AttendeesEvents as ClientEvents,
	LatestRaw as LatestState,
	LatestRawEvents as LatestStateEvents,
	LatestMapRaw as LatestMap,
	LatestMapRawEvents as LatestMapEvents,
} from "@fluidframework/presence/alpha";
import { Listenable } from "fluid-framework";

export interface PresenceClients {
	getAttendee: (clientId: ClientConnectionId | AttendeeId) => Attendee;
	getAttendees: () => ReadonlySet<Attendee>;
	getMyself: () => Attendee;
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
