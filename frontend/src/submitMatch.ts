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

export const initSubmitMatch = (): void => {
  const submitButton = document.getElementById("submit-btn") as HTMLButtonElement;

  submitButton.addEventListener("click", async () => {
    try {
      await submitMatch();
      alert("Results submitted");
    } catch (error) {
      console.error(error);
      alert("Could not save match");
    }
  });
};