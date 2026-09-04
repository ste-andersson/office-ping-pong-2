import { API_BASE_URL } from "./api";
import { openTeamDetails } from "./team-details";
import { TEAM_LABELS } from "./teams";

type TeamStanding = {
  team: string;
  matchesPlayed: number;
  wins: number;
  winRate: number;
};

export const loadTeamStandingsView = async () => {
  const container = document.getElementById(
    "team-standings-list",
  ) as HTMLDivElement;

  const response = await fetch(`${API_BASE_URL}/api/matches/team-standings`, {
    cache: "no-store",
  });
  const standings: TeamStanding[] = await response.json();

  container.innerHTML = "";

  standings.forEach((standing, index) => {
    const rankClass =
      index === 0 ? "rank-gold" : index === 1 ? "rank-silver" : "rank-bronze";

    const row = document.createElement("div");
    row.className = `team-standing-row ${rankClass}`;

    row.innerHTML = `
  <div class="team-standing-rank">${index + 1}</div>
  <div class="team-standing-card">
    <div
      class="team-standing-logo team-${standing.team}"
      role="img"
      aria-label="${TEAM_LABELS[standing.team]}"
    ></div>
  </div>
  <div class="team-standing-main">
    <div class="team-standing-name">${TEAM_LABELS[standing.team]}</div>
    <div class="team-standing-meta">${standing.matchesPlayed} matches · ${standing.winRate}%</div>
  </div>
  <div class="team-standing-score">
    <span class="team-standing-score-value">${standing.wins}</span>
    <span class="team-standing-score-label">Wins</span>
  </div>
`;

    row.addEventListener("click", () => openTeamDetails(standing.team));

    container.appendChild(row);
  });
};
