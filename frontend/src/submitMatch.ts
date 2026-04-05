import { getSelectedPlayerIds } from "./playerSelection";
import { getScores, resetScores } from "./scoreControls";
import { API_BASE_URL } from "./api";
import { loadResultsView } from "./results-view";
import { loadStandingsView } from "./standings-view";

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

  await loadResultsView();
  await loadStandingsView();
  resetScores();
};

export const initSubmitMatch = (goToView: (index: number) => void): void => {
  const submitButton = document.getElementById("submit-btn") as HTMLButtonElement;
  submitButton.addEventListener("click", async () => {
    try {
      await submitMatch();

      // Scrolla och highlighta innan vyn glider in
      const resultsView = document.getElementById("results-view") as HTMLElement;
      resultsView.scrollTop = 0;
      const firstCard = document.querySelector("#results-list .match-card") as HTMLElement;
      if (firstCard) {
        firstCard.classList.add("match-card--new");
        setTimeout(() => firstCard.classList.remove("match-card--new"), 2000);
      }

      goToView(1);
    } catch (error) {
      console.error(error);
      alert("Could not save match");
    }
  });
};
