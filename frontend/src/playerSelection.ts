import { API_BASE_URL } from "./api.ts";

type Player = {
  id: number;
  name: string;
  avatar: string;
};

let allPlayers: Player[] = [];
let topPlayer: Player;
let bottomPlayer: Player;
let currentSlot: "top" | "bottom" | null = null;

const fetchPlayers = async (): Promise<Player[]> => {
  const res = await fetch(`${API_BASE_URL}/api/players`);
  if (!res.ok) throw new Error("Failed to fetch players");
  return res.json();
};

const getSelectedPlayers = (players: Player[]) => {
  const savedTop = Number(localStorage.getItem("topPlayerId"));
  const savedBottom = Number(localStorage.getItem("bottomPlayerId"));

  const top = players.find((p) => p.id === savedTop);
  const bottom = players.find((p) => p.id === savedBottom);

  if (top && bottom && top.id !== bottom.id) {
    return { top, bottom };
  }

  return {
    top: players[0],
    bottom: players[1],
  };
};

const renderPlayers = (top: Player, bottom: Player) => {
  const topName = document.getElementById("player-name-top")!;
  const bottomName = document.getElementById("player-name-bottom")!;
  const topAvatar = document.getElementById(
    "player-avatar-top",
  ) as HTMLImageElement;
  const bottomAvatar = document.getElementById(
    "player-avatar-bottom",
  ) as HTMLImageElement;

  topName.textContent = top.name;
  bottomName.textContent = bottom.name;

  topAvatar.src = `/src/assets/${top.avatar}`;
  bottomAvatar.src = `/src/assets/${bottom.avatar}`;

  topAvatar.alt = `${top.name} avatar`;
  bottomAvatar.alt = `${bottom.name} avatar`;
};

const savePlayers = (top: Player, bottom: Player) => {
  localStorage.setItem("topPlayerId", String(top.id));
  localStorage.setItem("bottomPlayerId", String(bottom.id));
};

const closePicker = () => {
  document.getElementById("player-picker")!.classList.add("hidden");
  currentSlot = null;
};

const renderPickerList = () => {
  const list = document.getElementById("player-picker-list")!;
  list.innerHTML = "";

  allPlayers.forEach((player) => {
    const isDisabled =
      (currentSlot === "top" && player.id === bottomPlayer.id) ||
      (currentSlot === "bottom" && player.id === topPlayer.id);

    const button = document.createElement("button");
    button.className = `player-picker-item${isDisabled ? " disabled" : ""}`;
    button.type = "button";

    button.innerHTML = `
    <img class="player-picker-avatar" src="/src/assets/${player.avatar}" />
    <span class="player-picker-name">${player.name}</span>
    `;

    if (!isDisabled) {
      button.addEventListener("click", () => {
        if (currentSlot === "top") {
          topPlayer = player;
        } else if (currentSlot === "bottom") {
          bottomPlayer = player;
        }

        renderPlayers(topPlayer, bottomPlayer);
        savePlayers(topPlayer, bottomPlayer);
        closePicker();
      });
    }

    list.appendChild(button);
  });
};

const openPicker = (slot: "top" | "bottom") => {
  currentSlot = slot;

  const title = document.getElementById("player-picker-title")!;
  title.textContent =
    slot === "top" ? "Choose first player" : "Choose second player";

  renderPickerList();
  document.getElementById("player-picker")!.classList.remove("hidden");
};

export const initPlayerSelection = async () => {
  allPlayers = await fetchPlayers();

  if (allPlayers.length < 2) {
    throw new Error("At least two players are required");
  }

  const selected = getSelectedPlayers(allPlayers);
  topPlayer = selected.top;
  bottomPlayer = selected.bottom;

  renderPlayers(topPlayer, bottomPlayer);
  savePlayers(topPlayer, bottomPlayer);

  document
    .getElementById("player-card-top")!
    .addEventListener("click", () => openPicker("top"));

  document
    .getElementById("player-card-bottom")!
    .addEventListener("click", () => openPicker("bottom"));

  document
    .getElementById("close-player-picker")!
    .addEventListener("click", closePicker);

  document
    .getElementById("player-picker")!
    .addEventListener("click", (event) => {
      if (event.target === event.currentTarget) {
        closePicker();
      }
    });
};

export const getSelectedPlayerIds = () => {
  return {
    topPlayerId: topPlayer.id,
    bottomPlayerId: bottomPlayer.id,
  };
};
