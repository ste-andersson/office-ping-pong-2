import { getSelectedPlayerIds, getCurrentPlayers } from "./playerSelection";
import { getScores, resetScores } from "./scoreControls";
import { API_BASE_URL } from "./api";
import { loadResultsView } from "./results-view";
import { loadTeamStandingsView } from "./team-standings-view";
import { loadPlayerStandingsView } from "./player-standings-view";
import { setJustSubmitted } from "./viewNavigation";
import { playMatchWinAnnouncement } from "./sound";

const submitMatch = async (): Promise<void> => {
  const { topPlayerId, bottomPlayerId } = getSelectedPlayerIds();
  const { topPlayerScore, bottomPlayerScore } = getScores();
  const response = await fetch(`${API_BASE_URL}/api/matches`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topPlayerId,
      bottomPlayerId,
      topPlayerScore,
      bottomPlayerScore,
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to submit match");
  }

  if (topPlayerScore !== bottomPlayerScore) {
    const { top, bottom } = getCurrentPlayers();
    const winnerName = topPlayerScore > bottomPlayerScore ? top.name : bottom.name;
    playMatchWinAnnouncement(winnerName);
  }

  await loadResultsView();
  await loadTeamStandingsView();
  await loadPlayerStandingsView();
};

export const initSubmitMatch = (goToView: (index: number) => void): void => {
  const submitButton = document.getElementById(
    "submit-btn",
  ) as HTMLButtonElement;
  submitButton.addEventListener("click", async () => {
    if (submitButton.disabled) return;
    submitButton.disabled = true;
    submitButton.textContent = "✓";

    const list = document.getElementById("results-list") as HTMLElement;
    const resultsView = document.getElementById("results-view") as HTMLElement;
    const placeholder = document.createElement("div");
    placeholder.className = "match-card match-card--placeholder";
    list.prepend(placeholder);
    resultsView.scrollTop = 0;

    try {
      await submitMatch();
      await new Promise((resolve) => setTimeout(resolve, 500));

      setJustSubmitted(true);
      goToView(2);
      setTimeout(() => resetScores(), 350);
      setTimeout(() => {
        submitButton.disabled = false;
        submitButton.textContent = "SUBMIT SCORE";
      }, 400);

      const firstCard = document.querySelector(
        "#results-list .match-card",
      ) as HTMLElement;
      if (firstCard) {
        firstCard.classList.add("match-card--new");
        setTimeout(() => {
          firstCard.classList.remove("match-card--new");
          setJustSubmitted(false);
        }, 3000);
      }
    } catch (error) {
      placeholder.remove();
      console.error(error);
      alert("Could not save match");
    }
  });
};
