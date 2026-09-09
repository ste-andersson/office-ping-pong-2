import {
  isMusicEffectivelyOn,
  isSfxEffectivelyOn,
  getMusicVolume,
  getSfxVolume,
} from "./arcade-mode";

// iOS Safari deliberately ignores HTMLMediaElement.volume on <audio>
// elements — playback loudness there is tied only to the device's
// hardware volume buttons, by design, so setting `.volume` in JS silently
// does nothing audible on iPhone/iPad even though the property reads back
// correctly. Routing every clip through the Web Audio API's GainNode is
// the standard workaround: gain IS respected on iOS. `.volume` is still
// set alongside it below (harmless, and it's the only thing that matters
// on platforms where Web Audio routing isn't available).
let audioCtx: AudioContext | null = null;
let musicGainNode: GainNode | null = null;
let sfxGainNode: GainNode | null = null;

// Mobile browsers can suspend an idle AudioContext to save battery. While
// suspended, the graph produces no audible output at all even though a
// routed <audio> element's playback position keeps advancing normally, so
// .play() during a suspend can run a short clip's entire duration in
// silence before the graph comes back. .play() must still be called
// synchronously within the user gesture though (iOS can refuse it
// otherwise), so it can't just wait on resume() — instead a keep-alive
// timer (below) tries to make sure the context is never suspended in the
// first place by the time a sound is triggered.
let keepAliveTimer: ReturnType<typeof setInterval> | null = null;

const startKeepAlive = (ctx: AudioContext) => {
  if (keepAliveTimer) return;
  keepAliveTimer = setInterval(() => {
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
  }, 2000);
};

const ensureAudioGraph = (): AudioContext => {
  if (!audioCtx) {
    audioCtx = new AudioContext();

    musicGainNode = audioCtx.createGain();
    musicGainNode.gain.value = getMusicVolume();
    musicGainNode.connect(audioCtx.destination);

    sfxGainNode = audioCtx.createGain();
    sfxGainNode.gain.value = getSfxVolume();
    sfxGainNode.connect(audioCtx.destination);

    startKeepAlive(audioCtx);
  }
  return audioCtx;
};

const resumeAudioContext = (): Promise<void> => {
  const ctx = ensureAudioGraph();
  if (ctx.state === "suspended") return ctx.resume().catch(() => {});
  return Promise.resolve();
};

// An <audio> element can only ever be wired into the Web Audio graph once
// (a second createMediaElementSource call on the same element throws), so
// this must run exactly once per element, right when it's created.
const routeThroughGain = (audio: HTMLAudioElement, gain: "music" | "sfx") => {
  try {
    ensureAudioGraph();
    const node = gain === "music" ? musicGainNode! : sfxGainNode!;
    audioCtx!.createMediaElementSource(audio).connect(node);
  } catch {
    // Web Audio API unavailable — falls back to element.volume alone,
    // which is fine everywhere except iOS Safari.
  }
};

const MUSIC_SRC = "/assets/sounds/music/spin-chart.mp3";

let musicEl: HTMLAudioElement | null = null;

const getMusicEl = (): HTMLAudioElement => {
  if (!musicEl) {
    musicEl = new Audio(MUSIC_SRC);
    musicEl.loop = true;
    musicEl.volume = getMusicVolume();
    musicEl.preload = "auto";
    routeThroughGain(musicEl, "music");
  }
  return musicEl;
};

// Applies the current slider value to the live music element, so dragging
// the slider takes effect immediately even while music is already playing.
export const applyMusicVolume = () => {
  if (musicEl) musicEl.volume = getMusicVolume();
  if (musicGainNode) musicGainNode.gain.value = getMusicVolume();
};

// Applies the current SFX slider value to everything routed through the
// shared SFX gain node (blips/swishes and voice clips) immediately.
export const applySfxVolume = () => {
  if (sfxGainNode) sfxGainNode.gain.value = getSfxVolume();
};

const tryPlayMusic = () => {
  if (!isMusicEffectivelyOn()) return;
  resumeAudioContext();

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
// Blips/swishes are pre-decoded into raw AudioBuffers and triggered via
// AudioBufferSourceNode instead of <audio>.play(). Playing an <audio>
// element re-runs the browser's full media pipeline (cache check, demux,
// decode) on every single play — on a real mobile CPU that's simsurable
// latency each time, which is fine for a rarely-triggered voice clip but
// reads as "instant on desktop, delayed on phone" for a click sound that's
// meant to feel immediate. A pre-decoded buffer skips all of that: playing
// it is just scheduling already-in-memory PCM through the graph, so start
// latency is minimal and consistent across platforms. It also means no
// pooling is needed — any number of overlapping plays can share one buffer.
type SfxKey = "swish" | "blip";

const SFX_FILES: Record<SfxKey, string> = {
  swish: "/assets/sounds/sfx/swish.mp3",
  blip: "/assets/sounds/sfx/blip.mp3",
};

const sfxBuffers: Partial<Record<SfxKey, AudioBuffer>> = {};
const sfxBufferPromises: Partial<Record<SfxKey, Promise<AudioBuffer>>> = {};

const loadSfxBuffer = (key: SfxKey): Promise<AudioBuffer> => {
  const cached = sfxBuffers[key];
  if (cached) return Promise.resolve(cached);

  let pending = sfxBufferPromises[key];
  if (!pending) {
    const ctx = ensureAudioGraph();
    pending = fetch(SFX_FILES[key])
      .then((res) => res.arrayBuffer())
      .then((data) => ctx.decodeAudioData(data))
      .then((buffer) => {
        sfxBuffers[key] = buffer;
        return buffer;
      });
    sfxBufferPromises[key] = pending;
  }
  return pending;
};

const playSfxBuffer = (buffer: AudioBuffer) => {
  const ctx = ensureAudioGraph();
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(sfxGainNode!);
  source.start(0);
};

export const playSfx = (key: SfxKey) => {
  if (!isSfxEffectivelyOn()) return;

  // Unlike <audio>.play(), starting an already-decoded buffer isn't
  // subject to the "must be called synchronously in the gesture" autoplay
  // rule (only the AudioContext itself needs a gesture to unlock, which
  // resumeAudioContext()/the keep-alive already handle) — so it's safe to
  // wait for the context to actually be running before playing, avoiding
  // the "swallowed by a suspended graph" issue entirely instead of just
  // reducing its odds.
  resumeAudioContext().then(() => {
    const buffer = sfxBuffers[key];
    if (buffer) {
      playSfxBuffer(buffer);
    } else {
      loadSfxBuffer(key).then(playSfxBuffer);
    }
  });
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

  // Nudge the AudioContext to resume as early as possible on every touch
  // — pointerdown fires before the click that actually triggers a sound,
  // giving resume() a head start so the graph is more likely to already
  // be live by the time playback is requested.
  document.addEventListener(
    "pointerdown",
    () => {
      if (isSfxEffectivelyOn() || isMusicEffectivelyOn()) resumeAudioContext();
    },
    { passive: true },
  );
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
    routeThroughGain(audio, "sfx");
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

    // Same reasoning as playSfx: don't gate .play() behind resumeAudioContext()'s
    // promise — call it synchronously and let the resume happen in parallel.
    resumeAudioContext();
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

  loadSfxBuffer("swish");
  loadSfxBuffer("blip");
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
