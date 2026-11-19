type RoomStat = { name: string; visits: number; timeMs: number };
type StoredStats = { totalMs: number; roomEntries: number; rooms: Record<string, RoomStat> };

let statsOwner = localStorage.getItem("hrn_stats_owner") || "local";
const FLUSH_INTERVAL_MS = 15000;
let activeRoom: { key: string; startedAt: number; lastFlushAt: number } | null = null;

const storageKey = (): string => `hrn_play_stats_${statsOwner}`;

const emptyStats = (): StoredStats => ({ totalMs: 0, roomEntries: 0, rooms: {} });

const readStats = (): StoredStats => {
	try {
		const value = JSON.parse(localStorage.getItem(storageKey()) || "null") as Partial<StoredStats> | null;
		if (!value || typeof value !== "object") return emptyStats();
		return {
			totalMs: Number.isFinite(value.totalMs) ? Number(value.totalMs) : 0,
			roomEntries: Number.isFinite(value.roomEntries) ? Number(value.roomEntries) : 0,
			rooms: value.rooms && typeof value.rooms === "object" ? value.rooms : {},
		};
	} catch {
		return emptyStats();
	}
};

const getRoomIdentity = (): { key: string; name: string } => {
	const frame = document.getElementsByClassName("gameframe")[0] as HTMLIFrameElement | undefined;
	const documents = [frame?.contentDocument, document].filter(Boolean) as Document[];
	const hrefs = [frame?.contentWindow?.location.href, frame?.src, window.location.href].filter(Boolean) as string[];
	for (const href of hrefs) {
		try {
			const url = new URL(href);
			const code = url.searchParams.get("c") || url.searchParams.get("room");
			if (code) {
				const roomName = documents
					.map(doc => doc.querySelector<HTMLElement>("[data-hook='room-name'],.room-title,.room-view .title,.room-view .header .name"))
					.find(element => element?.textContent?.trim())?.textContent?.trim();
				return { key: code, name: roomName || `Sala ${code.slice(0, 6)}` };
			}
		} catch { /* Ignore non-URL values such as about:blank. */ }
	}
	const title = documents
		.map(doc => doc.querySelector<HTMLElement>("[data-hook='room-name'],.room-title,.room-view .title,.room-view .header .name"))
		.find(element => element?.textContent?.trim())?.textContent?.trim();
	return { key: title ? `name:${title.toLocaleLowerCase()}` : "unknown-room", name: title || "Sala sin nombre" };
};

const flushActiveRoom = (now = Date.now()): void => {
	if (!activeRoom) return;
	const elapsed = Math.max(0, now - activeRoom.lastFlushAt);
	activeRoom.lastFlushAt = now;
	const stats = readStats();
	const room = stats.rooms[activeRoom.key];
	if (!room) return;
	room.timeMs += elapsed;
	stats.totalMs += elapsed;
	localStorage.setItem(storageKey(), JSON.stringify(stats));
};

export const trackHaxballView = (viewName: string): void => {
	const inRoom = viewName === "room-view" || viewName.startsWith("game-view");
	if (!inRoom) {
		flushActiveRoom();
		activeRoom = null;
		return;
	}
	const identity = getRoomIdentity();
	if (activeRoom?.key === identity.key) return;
	flushActiveRoom();
	const stats = readStats();
	const room = stats.rooms[identity.key] || { name: identity.name, visits: 0, timeMs: 0 };
	room.name = identity.name;
	room.visits++;
	stats.rooms[identity.key] = room;
	stats.roomEntries++;
	localStorage.setItem(storageKey(), JSON.stringify(stats));
	const now = Date.now();
	activeRoom = { key: identity.key, startedAt: now, lastFlushAt: now };
};

window.setInterval(() => flushActiveRoom(), FLUSH_INTERVAL_MS);
window.addEventListener("beforeunload", () => flushActiveRoom());

export const getPlayStats = (): StoredStats => {
	const stats = readStats();
	if (activeRoom) {
		const elapsed = Math.max(0, Date.now() - activeRoom.lastFlushAt);
		stats.totalMs += elapsed;
		const room = stats.rooms[activeRoom.key];
		if (room) room.timeMs += elapsed;
	}
	return stats;
};

export const setPlayStatsAccount = (discordId: string | null): void => {
	const hadActiveRoom = activeRoom !== null;
	flushActiveRoom();
	statsOwner = discordId || "local";
	localStorage.setItem("hrn_stats_owner", statsOwner);
	if (hadActiveRoom) {
		const identity = getRoomIdentity();
		const stats = readStats();
		const room = stats.rooms[identity.key] || { name: identity.name, visits: 0, timeMs: 0 };
		room.name = identity.name;
		room.visits++;
		stats.rooms[identity.key] = room;
		stats.roomEntries++;
		localStorage.setItem(storageKey(), JSON.stringify(stats));
		const now = Date.now();
		activeRoom = { key: identity.key, startedAt: now, lastFlushAt: now };
	}
};

export const formatPlayTime = (milliseconds: number): string => {
	const totalMinutes = Math.floor(Math.max(0, milliseconds) / 60000);
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
};
