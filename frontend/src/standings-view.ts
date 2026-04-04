import { API_BASE_URL } from "./api";

type Standing = {
  playerId: number;
  playerName: string;
  playerAvatar: string;
  matchesPlayed: number;
  wins: number;
  winRate: number;
};

export const loadStandingsView = async () => {
  const container = document.getElementById("standings-list") as HTMLDivElement;

  const response = await fetch(`${API_BASE_URL}/api/matches/standings`, { cache: "no-store" });
  const standings: Standing[] = await response.json();
  console.log("standings:", standings);

  container.innerHTML = "";

  if (standings.length === 0) {
    container.innerHTML = `<div class="standings-empty">No standings yet</div>`;
    return;
  }

  standings.forEach((standing, index) => {
    const row = document.createElement("div");
    row.className = `standings-row ${index === 0 ? 'rank-gold' : index === 1 ? 'rank-silver' : index === 2 ? 'rank-bronze' : ''}`;

    row.innerHTML = `
  <div class="standings-rank">${index + 1}</div>
  <div class="standings-player-card">
    <img
      class="standings-avatar"
      src="/src/assets/${standing.playerAvatar}"
      alt="${standing.playerName}"
    />
  </div>
  <div class="standings-main">
    <div class="standings-name">${standing.playerName}</div>
    <div class="standings-meta">${standing.matchesPlayed} matches · ${standing.winRate}%</div>
  </div>
  <div class="standings-score">
    <span class="standings-score-value">${standing.wins}</span>
    <span class="standings-score-label">Wins</span>
  </div>
`;

    container.appendChild(row);
  });
};
