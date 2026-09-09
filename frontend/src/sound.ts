import {
  isMusicEffectivelyOn,
  isSfxEffectivelyOn,
  getMusicVolume,
  getSfxVolume,
} from "./arcade-mode";

const MUSIC_SRC = "/assets/sounds/music/spin-chart.mp3";

let musicEl: HTMLAudioElement | null = null;

const getMusicEl = (): HTMLAudioElement => {
  if (!musicEl) {
    musicEl = new Audio(MUSIC_SRC);
    musicEl.loop = true;
    musicEl.volume = getMusicVolume();
    musicEl.preload = "auto";
  }
  return musicEl;
};

// Applies the current slider value to the live music element, so dragging
// the slider takes effect immediately even while music is already playing.
export const applyMusicVolume = () => {
  if (musicEl) musicEl.volume = getMusicVolume();
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
    preloadArcadeAudio();
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

export const onSfxToggleChanged = () => {
  if (isSfxEffectivelyOn()) preloadArcadeAudio();
};

// --- one-shot UI sound effects ---
// A small pool of pre-fetched instances per key lets rapid repeated
// triggers (e.g. fast +/- taps) overlap instead of cutting each other off,
// while avoiding cloneNode() — a clone does NOT inherit the original's
// buffered media data, so it has to re-fetch over the network from
// scratch on every single play. That re-fetch is exactly what caused the
// 1-2s lag on a real (especially mobile) network against the deployed
// site, even though it was unnoticeable on localhost.
type SfxKey = "swish" | "blip";

const SFX_FILES: Record<SfxKey, string> = {
  swish: "/assets/sounds/sfx/swish.mp3",
  blip: "/assets/sounds/sfx/blip.mp3",
};

const SFX_POOL_SIZE = 4;
const sfxPools: Partial<Record<SfxKey, HTMLAudioElement[]>> = {};
const sfxPoolIndex: Partial<Record<SfxKey, number>> = {};

const ensureSfxPool = (key: SfxKey): HTMLAudioElement[] => {
  let pool = sfxPools[key];
  if (!pool) {
    pool = Array.from({ length: SFX_POOL_SIZE }, () => {
      const audio = new Audio(SFX_FILES[key]);
      audio.preload = "auto";
      audio.load();
      return audio;
    });
    sfxPools[key] = pool;
    sfxPoolIndex[key] = 0;
  }
  return pool;
};

export const playSfx = (key: SfxKey) => {
  if (!isSfxEffectivelyOn()) return;

  const pool = ensureSfxPool(key);
  const index = sfxPoolIndex[key] ?? 0;
  sfxPoolIndex[key] = (index + 1) % pool.length;

  const instance = pool[index];
  instance.pause();
  instance.currentTime = 0;
  instance.volume = getSfxVolume();
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
  if (isSfxEffectivelyOn()) preloadArcadeAudio();
  tryPlayMusic();
  document.addEventListener("click", handleGenericClick);
};

// --- voice clips (player names, match-win announcements) ---
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

// Every voice-clip src is fetched once and reused — never `new Audio()` at
// play time — so playback starts immediately instead of waiting on a fresh
// network round-trip each time.
const voiceClipCache = new Map<string, HTMLAudioElement>();

const getVoiceClip = (src: string): HTMLAudioElement => {
  let audio = voiceClipCache.get(src);
  if (!audio) {
    audio = new Audio(src);
    audio.preload = "auto";
    voiceClipCache.set(src, audio);
  }
  return audio;
};

const playClip = (src: string): Promise<void> =>
  new Promise((resolve) => {
    const audio = getVoiceClip(src);
    audio.currentTime = 0;
    const onEnded = () => {
      audio.removeEventListener("ended", onEnded);
      resolve();
    };
    audio.addEventListener("ended", onEnded);
    audio.play().catch(() => {
      audio.removeEventListener("ended", onEnded);
      resolve();
    });
  });

// Fetches every SFX/voice clip (and primes the music element) up front as
// soon as Arcade Mode — or just its SFX sub-toggle — turns on, instead of
// waiting until the moment of first playback to start each fetch.
let arcadeAudioPreloaded = false;

const preloadArcadeAudio = () => {
  if (arcadeAudioPreloaded) return;
  arcadeAudioPreloaded = true;

  ensureSfxPool("swish");
  ensureSfxPool("blip");
  getMusicEl().load();

  const voiceUrls = [
    ...Object.values(PLAYER_NAME_SOUND_FILES).map(
      (file) => `/assets/sounds/names/${file}.mp3`,
    ),
    LEGEND_PHRASE_FILE,
    ...WIN_PHRASE_FILES,
  ];
  voiceUrls.forEach((src) => getVoiceClip(src).load());
};

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
