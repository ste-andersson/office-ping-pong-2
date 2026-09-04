import { isMusicEffectivelyOn, isSfxEffectivelyOn } from "./arcade-mode";

const MUSIC_SRC = "/assets/sounds/music/spin-chart.mp3";

let musicEl: HTMLAudioElement | null = null;

const getMusicEl = (): HTMLAudioElement => {
  if (!musicEl) {
    musicEl = new Audio(MUSIC_SRC);
    musicEl.loop = true;
    musicEl.volume = 0.5;
  }
  return musicEl;
};

const tryPlayMusic = () => {
  if (!isMusicEffectivelyOn()) return;

  getMusicEl()
    .play()
    .catch(() => {
      // Autoplay was blocked (no fresh user gesture, e.g. a page reload with
      // music already enabled in localStorage) — resume on the next tap
      // anywhere on the page instead.
      const retry = () => {
        document.removeEventListener("pointerdown", retry);
        if (isMusicEffectivelyOn()) getMusicEl().play().catch(() => {});
      };
      document.addEventListener("pointerdown", retry, { once: true });
    });
};

export const stopMusic = () => {
  if (musicEl) {
    musicEl.pause();
    musicEl.currentTime = 0;
  }
};

export const onArcadeModeChanged = (enabled: boolean) => {
  if (enabled) {
    tryPlayMusic();
  } else {
    stopMusic();
  }
};

export const onMusicToggleChanged = () => {
  if (isMusicEffectivelyOn()) {
    tryPlayMusic();
  } else {
    stopMusic();
  }
};

// Small registry of one-shot sound effects — extension point for more UI
// blips/swishes. Voice clips (player names, match-win announcements) live in
// their own registries below since they're keyed by player name, not a
// fixed set of UI events.
type SfxKey = "swish" | "blip";

const SFX_FILES: Record<SfxKey, string> = {
  swish: "/assets/sounds/sfx/swish.mp3",
  blip: "/assets/sounds/sfx/blip.mp3",
};

const sfxPool: Partial<Record<SfxKey, HTMLAudioElement>> = {};

export const playSfx = (key: SfxKey) => {
  if (!isSfxEffectivelyOn()) return;

  // Clone so rapid repeated triggers (e.g. fast +/- taps) can overlap
  // instead of cutting each other off.
  const base = sfxPool[key] ?? (sfxPool[key] = new Audio(SFX_FILES[key]));
  const instance = base.cloneNode() as HTMLAudioElement;
  instance.volume = 0.6;
  instance.play().catch(() => {});
};

// Generic "go nuts" click sound for interactive elements across the app,
// delegated via a single document-level listener rather than wiring a
// listener into every file. #prev-view/#next-view are excluded since they
// already play their own dedicated "swish" (see viewNavigation.ts).
const BLIP_SELECTORS = [
  "button",
  ".player-card",
  ".player-picker-item",
  ".player-picker-tab",
  ".match-card",
  ".team-standing-row",
  ".standings-row",
].join(", ");

const EXCLUDED_IDS = new Set(["prev-view", "next-view"]);

const handleGenericClick = (event: MouseEvent) => {
  const target = (event.target as HTMLElement).closest<HTMLElement>(
    BLIP_SELECTORS,
  );
  if (!target || EXCLUDED_IDS.has(target.id)) return;
  if (target.hasAttribute("disabled")) return;
  playSfx("blip");
};

export const initSound = () => {
  // Covers the "settings were already on in localStorage" case on a fresh
  // page load; falls back to the pointerdown retry above if blocked.
  tryPlayMusic();
  document.addEventListener("click", handleGenericClick);
};

// Maps each player's stored DB name to its recorded voice-clip filename.
// Spelled out explicitly rather than slugified, since a couple of names
// don't match their DB spelling 1:1 (e.g. "SHIRRE" was recorded as
// "Shirwac", "ABDULLAHI" as "Abdulahi").
const PLAYER_NAME_SOUND_FILES: Record<string, string> = {
  STEFAN: "stefan",
  "JING X": "jing-x",
  JAKUB: "jakub",
  SHIRRE: "shirwac",
  SEBASTIAN: "sebastian",
  SOFIE: "sofie",
  ALEXANDRA: "alexandra",
  VENU: "venu",
  MATTIAS: "mattias",
  TEHREEM: "tehreem",
  ALEK: "alek",
  CAMILLA: "camilla",
  DAMIR: "damir",
  DENNIS: "dennis",
  DISA: "disa",
  JULIA: "julia",
  MAGDALENA: "magdalena",
  SARA: "sara",
  ABDULLAHI: "abdulahi",
  EMBLA: "embla",
  EMIL: "emil",
  "JING Z": "jing-z",
  GHAZALEH: "ghazaleh",
  MIKIAS: "mikias",
  MOHAMED: "mohamed",
  NAZRET: "nazret",
  NORDIN: "nordin",
  ROBIN: "robin",
};

const WIN_PHRASE_FILES = [
  "/assets/sounds/phrases/wins.mp3",
  "/assets/sounds/phrases/is-the-winner.mp3",
];

const LEGEND_PHRASE_FILE = "/assets/sounds/phrases/the-ping-pong-legend.mp3";

const playClip = (src: string): Promise<void> =>
  new Promise((resolve) => {
    const audio = new Audio(src);
    audio.addEventListener("ended", () => resolve(), { once: true });
    audio.play().catch(() => resolve());
  });

// Players added later (e.g. via Arcade Mode's add-player form) have no
// recorded voice clip — "The Ping Pong Legend" stands in as their name.
const playerNameClip = (playerName: string): Promise<void> => {
  const file = PLAYER_NAME_SOUND_FILES[playerName];
  return playClip(file ? `/assets/sounds/names/${file}.mp3` : LEGEND_PHRASE_FILE);
};

// Voice announcement when a player is picked in the player selector.
export const playPlayerName = (playerName: string) => {
  if (!isSfxEffectivelyOn()) return;
  playerNameClip(playerName);
};

// Voice announcement when a match is reported: winner's name (or "The Ping
// Pong Legend" if unrecorded), then a randomly picked win phrase.
export const playMatchWinAnnouncement = (winnerName: string) => {
  if (!isSfxEffectivelyOn()) return;

  const phrase =
    WIN_PHRASE_FILES[Math.floor(Math.random() * WIN_PHRASE_FILES.length)];

  playerNameClip(winnerName).then(() => playClip(phrase));
};
