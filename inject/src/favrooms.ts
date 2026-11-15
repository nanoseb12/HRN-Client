export const injectFavoriteRoomsButtons = (): void => {
    const gameframe = document.getElementsByClassName("gameframe")[0] as HTMLIFrameElement;
    const doc = gameframe?.contentDocument;
    const splitter = doc?.getElementsByClassName("splitter")[0] as HTMLElement;
    if (!splitter || splitter.querySelector("#addfav-btn")) return;

    const roomListButtons = splitter.getElementsByClassName("buttons")[0];
    if (!roomListButtons) return;

    const addFavButton = doc!.createElement("button");
    addFavButton.id = "addfav-btn";
    addFavButton.innerHTML = '<i class="icon-star"></i><div>Agregar favorita</div>';
    roomListButtons.insertBefore(addFavButton, roomListButtons.childNodes[3]);

    const showFavButton = doc!.createElement("button");
    showFavButton.id = "showfav-btn";
    showFavButton.innerHTML = '<i class="icon-star"></i><div>Ver favoritas</div>';
    roomListButtons.insertBefore(showFavButton, roomListButtons.childNodes[4]);

    let favoritesOnly = false;
    const readFavorites = (): Set<string> => {
        try {
            const value: unknown = JSON.parse(localStorage.getItem("fav_rooms") || "[]");
            return new Set(Array.isArray(value) ? value.filter((name): name is string => typeof name === "string") : []);
        } catch { return new Set(); }
    };
    const getRoomRows = (): NodeListOf<HTMLTableRowElement> | null =>
        doc?.querySelector('[data-hook="list"]')?.querySelectorAll("tr") ?? null;
    const applyFilter = (): void => {
        const rows = getRoomRows();
        if (!rows) return;
        const favorites = readFavorites();
        rows.forEach(row => {
            const name = row.querySelector('[data-hook="name"]')?.textContent?.trim();
            row.style.display = !favoritesOnly || (!!name && favorites.has(name)) ? "" : "none";
        });
        showFavButton.innerHTML = favoritesOnly
            ? '<i class="icon-star"></i><div>Ver todas</div>'
            : '<i class="icon-star"></i><div>Ver favoritas</div>';
    };

    addFavButton.addEventListener("click", () => {
        const selected = splitter.getElementsByClassName("selected")[0];
        const name = selected?.querySelector('[data-hook="name"]')?.textContent?.trim();
        if (!name) return;
        const favorites = readFavorites();
        if (favorites.has(name)) favorites.delete(name); else favorites.add(name);
        localStorage.setItem("fav_rooms", JSON.stringify([...favorites]));
        updateFavButtonLabel(addFavButton, splitter);
        applyFilter();
    });
    showFavButton.addEventListener("click", () => { favoritesOnly = !favoritesOnly; applyFilter(); });
    splitter.addEventListener("click", () => updateFavButtonLabel(addFavButton, splitter));
    const refresh = doc?.querySelector('[data-hook="refresh"]');
    refresh?.addEventListener("click", () => { favoritesOnly = false; applyFilter(); });
};

function updateFavButtonLabel(button: HTMLButtonElement, splitter: HTMLElement): void {
    const selected = splitter.getElementsByClassName("selected")[0];
    const name = selected?.querySelector('[data-hook="name"]')?.textContent?.trim();
    if (!name) return;
    let favorites: string[] = [];
    try {
        const saved: unknown = JSON.parse(localStorage.getItem("fav_rooms") || "[]");
        if (Array.isArray(saved)) favorites = saved.filter((value): value is string => typeof value === "string");
    } catch { /* Ignore invalid saved data. */ }
    button.innerHTML = favorites.includes(name)
        ? '<i class="icon-star"></i><div>Quitar favorita</div>'
        : '<i class="icon-star"></i><div>Agregar favorita</div>';
}
