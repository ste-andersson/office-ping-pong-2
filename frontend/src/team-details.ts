import { API_BASE_URL } from "./api";
import { openMatchDetails } from "./match-details";

type TeamMatchup = {
  opponentTeam: string;
  matchesPlayed: number;
  wins: number;
  winRate: number;
};

type TeamMatch = {
  id: number;
  topPlayerName: string;
  bottomPlayerName: string;
  topPlayerAvatar: string;
  bottomPlayerAvatar: string;
  topPlayerTeam: string;
  bottomPlayerTeam: string;
  topPlayerScore: number;
  bottomPlayerScore: number;
  playedAt: string;
};

type TeamDetails = {
  team: string;
  rank: number;
  matchesPlayed: number;
  wins: number;
  winRate: number;
  totalPoints: number;
  form: string[];
  matchups: TeamMatchup[];
  matches: TeamMatch[];
};

const TEAM_LABELS: Record<string, string> = {
  java: "Java",
  core: "SALT Core",
  "data-ai": "Data & AI",
};

let currentTeam: string | null = null;

const formatPlayedAt = (dateString: string): string =>
  new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const renderMatchups = (matchups: TeamMatchup[]): string => `
  <div class="team-details-matchups">
    <h3>Matchups</h3>
    ${matchups
      .map(
        (matchup) => `
      <div class="team-details-matchup-row">
        <div class="team-details-matchup-logo team-${matchup.opponentTeam}"></div>
        <span class="team-details-matchup-name">${TEAM_LABELS[matchup.opponentTeam]}</span>
        <span class="team-details-matchup-record">${matchup.wins}-${matchup.matchesPlayed - matchup.wins}</span>
        <span class="team-details-matchup-rate">${matchup.winRate}%</span>
      </div>
    `,
      )
      .join("")}
  </div>
`;

const renderMatchesList = (matches: TeamMatch[]): string => {
  if (matches.length === 0) {
    return `<div class="team-details-matches-empty">No matches yet</div>`;
  }

  return matches
    .map(
      (match) => `
      <div class="team-details-match-row" data-match-id="${match.id}">
        <div class="team-details-match-date">${formatPlayedAt(match.playedAt)}</div>
        <div class="team-details-match-matchup">
          <div class="team-details-match-player">
            <img src="/assets/${match.topPlayerAvatar}" alt="${match.topPlayerName}" />
            <span>${match.topPlayerName}</span>
          </div>
          <span class="team-details-match-score">${match.topPlayerScore} - ${match.bottomPlayerScore}</span>
          <div class="team-details-match-player">
            <img src="/assets/${match.bottomPlayerAvatar}" alt="${match.bottomPlayerName}" />
            <span>${match.bottomPlayerName}</span>
          </div>
        </div>
      </div>
    `,
    )
    .join("");
};

const renderTeamDetails = (details: TeamDetails) => {
  const body = document.getElementById("team-details-body")!;

  body.innerHTML = `
    <div class="team-details-header">
      <div class="team-details-avatar team-${details.team}">
        <div class="team-details-avatar-logo team-${details.team}"></div>
      </div>
      <div class="team-details-name">${TEAM_LABELS[details.team]}</div>
      <div class="team-details-rank">Rank #${details.rank}</div>
      <div class="team-details-form">
        ${details.form
          .map(
            (result) =>
              `<span class="team-details-form-dot ${result === "W" ? "win" : "loss"}"></span>`,
          )
          .join("")}
      </div>
    </div>

    <div class="team-details-stats">
      <div class="team-details-stat">
        <span class="team-details-stat-value">${details.wins}</span>
        <span class="team-details-stat-label">Wins</span>
      </div>
      <div class="team-details-stat">
        <span class="team-details-stat-value">${details.matchesPlayed}</span>
        <span class="team-details-stat-label">Matches</span>
      </div>
      <div class="team-details-stat">
        <span class="team-details-stat-value">${details.winRate}%</span>
        <span class="team-details-stat-label">Win rate</span>
      </div>
      <div class="team-details-stat">
        <span class="team-details-stat-value">${details.totalPoints}</span>
        <span class="team-details-stat-label">Total points</span>
      </div>
    </div>

    ${renderMatchups(details.matchups)}

    <div class="team-details-matches">
      <h3>Matches</h3>
      <div class="team-details-matches-list">
        ${renderMatchesList(details.matches)}
      </div>
    </div>
  `;

  body.querySelectorAll<HTMLElement>(".team-details-match-row").forEach((row) => {
    row.addEventListener("click", () => {
      const matchId = Number(row.dataset.matchId);
      closeTeamDetails();
      openMatchDetails(matchId);
    });
  });
};

const fetchAndRenderTeamDetails = async (team: string) => {
  const response = await fetch(`${API_BASE_URL}/api/matches/teams/${team}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    closeTeamDetails();
    return;
  }

  const details: TeamDetails = await response.json();
  if (team === currentTeam) {
    renderTeamDetails(details);
  }
};

const closeTeamDetails = () => {
  document.getElementById("team-details-modal")!.classList.add("hidden");
  currentTeam = null;
};

export const openTeamDetails = async (team: string) => {
  currentTeam = team;
  document.getElementById("team-details-modal")!.classList.remove("hidden");
  await fetchAndRenderTeamDetails(team);
};

export const refreshTeamDetailsIfOpen = () => {
  if (currentTeam !== null) {
    fetchAndRenderTeamDetails(currentTeam);
  }
};

export const initTeamDetails = () => {
  document
    .getElementById("team-details-close")!
    .addEventListener("click", closeTeamDetails);

  document
    .getElementById("team-details-modal")!
    .addEventListener("click", (event) => {
      if (event.target === event.currentTarget) {
        closeTeamDetails();
      }
    });
};
