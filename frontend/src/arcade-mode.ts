import { API_BASE_URL } from "./api";
import { refreshPlayers } from "./playerSelection";
import {
  onArcadeModeChanged,
  onMusicToggleChanged,
  onSfxToggleChanged,
  applyMusicVolume,
  applySfxVolume,
} from "./sound";

const STORAGE_KEY_ARCADE = "arcadeModeEnabled";
const STORAGE_KEY_MUSIC = "arcadeMusicEnabled";
const STORAGE_KEY_SFX = "arcadeSfxEnabled";
const STORAGE_KEY_MUSIC_VOLUME = "arcadeMusicVolumePercent";
const STORAGE_KEY_SFX_VOLUME = "arcadeSfxVolumePercent";

const DEFAULT_MUSIC_VOLUME_PERCENT = 15;
const DEFAULT_SFX_VOLUME_PERCENT = 90;

const getStoredFlag = (key: string, defaultValue: boolean): boolean => {
  try {
    const stored = localStorage.getItem(key);
    return stored === null ? defaultValue : stored === "true";
  } catch {
    return defaultValue;
  }
};

const setStoredFlag = (key: string, value: boolean) => {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // localStorage can throw (e.g. quota/private browsing restrictions);
    // arcade mode should still work for the current session either way.
  }
};

const getStoredPercent = (key: string, defaultValue: number): number => {
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return defaultValue;
    const parsed = Number(stored);
    return Number.isFinite(parsed) ? parsed : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setStoredPercent = (key: string, value: number) => {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // see setStoredFlag above
  }
};

export const isArcadeModeEnabled = (): boolean =>
  getStoredFlag(STORAGE_KEY_ARCADE, false);

export const isMusicEffectivelyOn = (): boolean =>
  isArcadeModeEnabled() && getStoredFlag(STORAGE_KEY_MUSIC, true);

export const isSfxEffectivelyOn = (): boolean =>
  isArcadeModeEnabled() && getStoredFlag(STORAGE_KEY_SFX, true);

export const getMusicVolume = (): number =>
  getStoredPercent(STORAGE_KEY_MUSIC_VOLUME, DEFAULT_MUSIC_VOLUME_PERCENT) /
  100;

export const getSfxVolume = (): number =>
  getStoredPercent(STORAGE_KEY_SFX_VOLUME, DEFAULT_SFX_VOLUME_PERCENT) / 100;

export const initArcadeMode = (goToView: (index: number) => void) => {
  const arcadeToggle = document.getElementById(
    "arcade-mode-toggle",
  ) as HTMLInputElement;
  const musicToggle = document.getElementById(
    "arcade-music-toggle",
  ) as HTMLInputElement;
  const sfxToggle = document.getElementById(
    "arcade-sfx-toggle",
  ) as HTMLInputElement;
  const subToggles = document.getElementById("arcade-sub-toggles")!;
  const musicVolumeSlider = document.getElementById(
    "arcade-music-volume",
  ) as HTMLInputElement;
  const sfxVolumeSlider = document.getElementById(
    "arcade-sfx-volume",
  ) as HTMLInputElement;

  arcadeToggle.checked = isArcadeModeEnabled();
  musicToggle.checked = getStoredFlag(STORAGE_KEY_MUSIC, true);
  sfxToggle.checked = getStoredFlag(STORAGE_KEY_SFX, true);
  musicVolumeSlider.value = String(
    getStoredPercent(STORAGE_KEY_MUSIC_VOLUME, DEFAULT_MUSIC_VOLUME_PERCENT),
  );
  sfxVolumeSlider.value = String(
    getStoredPercent(STORAGE_KEY_SFX_VOLUME, DEFAULT_SFX_VOLUME_PERCENT),
  );
  subToggles.classList.toggle("hidden", !arcadeToggle.checked);

  musicVolumeSlider.addEventListener("input", () => {
    setStoredPercent(STORAGE_KEY_MUSIC_VOLUME, Number(musicVolumeSlider.value));
    applyMusicVolume();
  });

  sfxVolumeSlider.addEventListener("input", () => {
    setStoredPercent(STORAGE_KEY_SFX_VOLUME, Number(sfxVolumeSlider.value));
    applySfxVolume();
  });

  arcadeToggle.addEventListener("change", () => {
    const turningOn = arcadeToggle.checked;
    setStoredFlag(STORAGE_KEY_ARCADE, turningOn);
    subToggles.classList.toggle("hidden", !turningOn);

    if (turningOn) {
      // Every off->on activation resets Music/SFX to on, per spec.
      musicToggle.checked = true;
      sfxToggle.checked = true;
      setStoredFlag(STORAGE_KEY_MUSIC, true);
      setStoredFlag(STORAGE_KEY_SFX, true);
    }

    onArcadeModeChanged(turningOn);
  });

  musicToggle.addEventListener("change", () => {
    setStoredFlag(STORAGE_KEY_MUSIC, musicToggle.checked);
    onMusicToggleChanged();
  });

  sfxToggle.addEventListener("change", () => {
    setStoredFlag(STORAGE_KEY_SFX, sfxToggle.checked);
    onSfxToggleChanged();
  });

  const form = document.getElementById("add-player-form") as HTMLFormElement;
  const nameInput = document.getElementById(
    "add-player-name",
  ) as HTMLInputElement;
  const submitButton = document.getElementById(
    "add-player-submit",
  ) as HTMLButtonElement;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return;

    submitButton.disabled = true;
    try {
      const response = await fetch(`${API_BASE_URL}/api/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error("Failed to add player");
      const newPlayer = await response.json();

      nameInput.value = "";
      await refreshPlayers(newPlayer.id);
      goToView(1); // back to player selection (Report), new player as player 1
    } catch (error) {
      console.error(error);
      alert("Could not add player");
    } finally {
      submitButton.disabled = false;
    }
  });
};
