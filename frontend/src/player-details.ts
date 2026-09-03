import { API_BASE_URL } from "./api";
import { openMatchDetails } from "./match-details";

type PlayerMatchSummary = {
  matchId: number;
  playedAt: string;
  opponentId: number;
  opponentName: string;
  opponentAvatar: string;
  opponentTeam: string;
  playerScore: number;
  opponentScore: number;
};

type PlayerDetails = {
  playerId: number;
  name: string;
  avatar: string;
  team: string;
  rank: number;
  matchesPlayed: number;
  wins: number;
  winRate: number;
  totalPoints: number;
  form: string[];
  matches: PlayerMatchSummary[];
};

const TEAM_LABELS: Record<string, string> = {
  java: "Java",
  core: "SALT Core",
  "data-ai": "Data & AI",
};

let currentPlayerId: number | null = null;

const formatPlayedAt = (dateString: string): string =>
  new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const renderMatchesList = (matches: PlayerMatchSummary[]): string => {
  if (matches.length === 0) {
    return `<div class="player-details-matches-empty">No matches yet</div>`;
  }

  return matches
    .map(
      (match) => `
      <div class="player-details-match-row" data-match-id="${match.matchId}">
        <img
          class="player-details-match-avatar"
          src="/assets/${match.opponentAvatar}"
          alt="${match.opponentName}"
        />
        <div class="player-details-match-info">
          <span class="player-details-match-opponent">${match.opponentName}</span>
          <span class="player-details-match-date">${formatPlayedAt(match.playedAt)}</span>
        </div>
        <span class="player-details-match-score">${match.playerScore} - ${match.opponentScore}</span>
      </div>
    `,
    )
    .join("");
};

const renderPlayerDetails = (details: PlayerDetails) => {
  const body = document.getElementById("player-details-body")!;

  body.innerHTML = `
    <div class="player-details-header">
      <div class="player-details-avatar team-${details.team}">
        <img src="/assets/${details.avatar}" alt="${details.name}" />
      </div>
      <div class="player-details-name">${details.name}</div>
      <div class="player-details-team-card team-${details.team}">
        <div class="player-details-team-logo team-${details.team}"></div>
        <span class="player-details-team-name">${TEAM_LABELS[details.team]}</span>
      </div>
      <div class="player-details-rank">Rank #${details.rank}</div>
      <div class="player-details-form">
        ${details.form
          .map(
            (result) =>
              `<span class="player-details-form-dot ${result === "W" ? "win" : "loss"}"></span>`,
          )
          .join("")}
      </div>
    </div>

    <div class="player-details-stats">
      <div class="player-details-stat">
        <span class="player-details-stat-value">${details.wins}</span>
        <span class="player-details-stat-label">Wins</span>
      </div>
      <div class="player-details-stat">
        <span class="player-details-stat-value">${details.matchesPlayed}</span>
        <span class="player-details-stat-label">Matches</span>
      </div>
      <div class="player-details-stat">
        <span class="player-details-stat-value">${details.winRate}%</span>
        <span class="player-details-stat-label">Win rate</span>
      </div>
      <div class="player-details-stat">
        <span class="player-details-stat-value">${details.totalPoints}</span>
        <span class="player-details-stat-label">Total points</span>
      </div>
    </div>

    <div class="player-details-matches">
      <h3>Matches</h3>
      <div class="player-details-matches-list">
        ${renderMatchesList(details.matches)}
      </div>
    </div>
  `;

  body.querySelectorAll<HTMLElement>(".player-details-match-row").forEach((row) => {
    row.addEventListener("click", () => {
      const matchId = Number(row.dataset.matchId);
      closePlayerDetails();
      openMatchDetails(matchId);
    });
  });
};

const fetchAndRenderPlayerDetails = async (playerId: number) => {
  const response = await fetch(`${API_BASE_URL}/api/matches/players/${playerId}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    closePlayerDetails();
    return;
  }

  const details: PlayerDetails = await response.json();
  if (playerId === currentPlayerId) {
    renderPlayerDetails(details);
  }
};

const closePlayerDetails = () => {
  document.getElementById("player-details-modal")!.classList.add("hidden");
  currentPlayerId = null;
};

export const openPlayerDetails = async (playerId: number) => {
  currentPlayerId = playerId;
  document.getElementById("player-details-modal")!.classList.remove("hidden");
  await fetchAndRenderPlayerDetails(playerId);
};

export const refreshPlayerDetailsIfOpen = () => {
  if (currentPlayerId !== null) {
    fetchAndRenderPlayerDetails(currentPlayerId);
  }
};

export const initPlayerDetails = () => {
  document
    .getElementById("player-details-close")!
    .addEventListener("click", closePlayerDetails);

  document
    .getElementById("player-details-modal")!
    .addEventListener("click", (event) => {
      if (event.target === event.currentTarget) {
        closePlayerDetails();
      }
    });
};
