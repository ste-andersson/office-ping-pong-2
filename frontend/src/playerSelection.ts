import { API_BASE_URL } from "./api.ts";
import { playPlayerName } from "./sound";

type Player = {
  id: number;
  name: string;
  avatar: string;
  team: string;
};

// matches #player-picker-list's grid-template-columns and gap in player-picker.css
const PICKER_COLUMNS = 3;
const PICKER_GAP_PX = 12;
const PICKER_MIN_ROWS = 4;
// fraction of an extra row peeking in at the bottom, hinting that the list scrolls
const PICKER_PEEK_ROW_FRACTION = 0.35;

// preferred team order for a first-time user's default second player: picks
// the most-preferred team (that isn't the first player's team) whose colors
// pair best with the others, rather than whichever team happens to sort
// first by player id
const DEFAULT_OPPONENT_TEAM_PREFERENCE = ["data-ai", "core", "java"];

let allPlayers: Player[] = [];
let topPlayer: Player;
let bottomPlayer: Player;
let currentSlot: "top" | "bottom" | null = null;
let currentTeamFilter: string | null = null;

const fetchPlayers = async (): Promise<Player[]> => {
  const res = await fetch(`${API_BASE_URL}/api/players`, {
    cache: "no-store",
  });
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

  const defaultTop = players[0];
  const defaultBottom =
    DEFAULT_OPPONENT_TEAM_PREFERENCE.filter((team) => team !== defaultTop.team)
      .map((team) => players.find((p) => p.team === team))
      .find((p): p is Player => p !== undefined) ?? players[1];

  return {
    top: defaultTop,
    bottom: defaultBottom,
  };
};

const setTeamClass = (el: Element, team: string) => {
  Array.from(el.classList)
    .filter((c) => c.startsWith("team-"))
    .forEach((c) => el.classList.remove(c));
  el.classList.add(`team-${team}`);
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

  topAvatar.src = `/assets/${top.avatar}`;
  bottomAvatar.src = `/assets/${bottom.avatar}`;

  topAvatar.alt = `${top.name} avatar`;
  bottomAvatar.alt = `${bottom.name} avatar`;

  setTeamClass(document.querySelector(".player-top")!, top.team);
  setTeamClass(document.querySelector(".player-bottom")!, bottom.team);
};

const savePlayers = (top: Player, bottom: Player) => {
  try {
    localStorage.setItem("topPlayerId", String(top.id));
    localStorage.setItem("bottomPlayerId", String(bottom.id));
  } catch {
    // localStorage can throw (e.g. quota/private browsing restrictions in Firefox);
    // player selection should still work for the current session even if it can't be persisted.
  }
};

const closePicker = () => {
  document.getElementById("player-picker")!.classList.add("hidden");
  currentSlot = null;
};

const renderPickerTabs = () => {
  document
    .querySelectorAll<HTMLButtonElement>(".player-picker-tab")
    .forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.team === currentTeamFilter);
    });
};

const updatePickerFade = () => {
  const scroll = document.getElementById("player-picker-list-scroll")!;
  const fade = document.getElementById("player-picker-fade")!;
  const canScrollMore =
    scroll.scrollHeight - scroll.scrollTop - scroll.clientHeight > 1;
  fade.classList.toggle("hidden", !canScrollMore);
};

const renderPickerList = () => {
  const list = document.getElementById("player-picker-list")!;
  list.innerHTML = "";

  const teamPlayers = currentTeamFilter
    ? allPlayers.filter((player) => player.team === currentTeamFilter)
    : allPlayers;

  teamPlayers.forEach((player) => {
    const isDisabled =
      (currentSlot === "top" && player.id === bottomPlayer.id) ||
      (currentSlot === "bottom" && player.id === topPlayer.id);

    const button = document.createElement("button");
    button.className = `player-picker-item team-${player.team}${isDisabled ? " disabled" : ""}`;
    button.type = "button";

    button.innerHTML = `
    <img class="player-picker-avatar" src="/assets/${player.avatar}" />
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
        playPlayerName(player.name);
        closePicker();
      });
    }

    list.appendChild(button);
  });

  // pin .player-picker-list-scroll at PICKER_MIN_ROWS rows worth of height
  // so the picker box never grows/shrinks between teams with different
  // player counts: fewer players leave blank space below (min-height), more
  // players scroll within that height instead of growing the box
  // (max-height). Using `height` directly instead of min/max would make the
  // grid's implicit "auto" row tracks shrink to fit rather than scroll.
  const scroll = document.getElementById("player-picker-list-scroll")!;
  const itemWidth =
    (list.clientWidth - PICKER_GAP_PX * (PICKER_COLUMNS - 1)) /
    PICKER_COLUMNS;
  const rowsHeight = `${
    itemWidth * PICKER_MIN_ROWS +
    PICKER_GAP_PX * PICKER_MIN_ROWS +
    itemWidth * PICKER_PEEK_ROW_FRACTION
  }px`;
  scroll.style.minHeight = rowsHeight;
  scroll.style.maxHeight = rowsHeight;

  updatePickerFade();
};

const selectTeamFilter = (team: string) => {
  currentTeamFilter = currentTeamFilter === team ? null : team;
  renderPickerTabs();
  renderPickerList();
};

const openPicker = (slot: "top" | "bottom") => {
  currentSlot = slot;
  currentTeamFilter = null;

  const title = document.getElementById("player-picker-title")!;
  title.textContent =
    slot === "top" ? "Choose first player" : "Choose second player";

  renderPickerTabs();
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
    .querySelectorAll<HTMLButtonElement>(".player-picker-tab")
    .forEach((tab) => {
      tab.addEventListener("click", () => selectTeamFilter(tab.dataset.team!));
    });

  document
    .getElementById("player-picker-list-scroll")!
    .addEventListener("scroll", updatePickerFade);

  document
    .getElementById("player-picker")!
    .addEventListener("click", (event) => {
      if (event.target === event.currentTarget) {
        closePicker();
      }
    });
};

export const refreshPlayers = async (selectAsTopId?: number) => {
  allPlayers = await fetchPlayers();

  if (selectAsTopId !== undefined) {
    const player = allPlayers.find((p) => p.id === selectAsTopId);
    if (player) {
      topPlayer = player;
      renderPlayers(topPlayer, bottomPlayer);
      savePlayers(topPlayer, bottomPlayer);
    }
  }

  renderPickerList();
};

export const getSelectedPlayerIds = () => {
  return {
    topPlayerId: topPlayer.id,
    bottomPlayerId: bottomPlayer.id,
  };
};

export const getCurrentPlayers = () => {
  return { top: topPlayer, bottom: bottomPlayer };
};
