import { API_BASE_URL } from "./api";
import { TEAM_LABELS } from "./teams";

type PlayerMatchInfo = {
  playerId: number;
  name: string;
  avatar: string;
  team: string;
  rank: number;
  form: string[];
};

type HeadToHeadMatch = {
  id: number;
  playedAt: string;
  topPlayerScore: number;
  bottomPlayerScore: number;
};

type HeadToHead = {
  topPlayerWins: number;
  bottomPlayerWins: number;
  previousMatches: HeadToHeadMatch[];
};

type MatchDetails = {
  id: number;
  playedAt: string;
  topPlayer: PlayerMatchInfo;
  bottomPlayer: PlayerMatchInfo;
  topPlayerScore: number;
  bottomPlayerScore: number;
  headToHead: HeadToHead;
  deletable: boolean;
};

let currentMatchId: number | null = null;
let onMatchDeleted: () => void = () => {};

const formatPlayedAt = (dateString: string): string =>
  new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const renderPlayerSection = (info: PlayerMatchInfo): string => `
  <div class="match-details-player">
    <div class="match-details-avatar team-${info.team}">
      <img src="/assets/${info.avatar}" alt="${info.name}" />
    </div>
    <div class="match-details-name">${info.name}</div>
    <div class="match-details-team-card team-${info.team}">
      <div class="match-details-team-logo team-${info.team}"></div>
      <span class="match-details-team-name">${TEAM_LABELS[info.team]}</span>
    </div>
    <div class="match-details-rank">Rank #${info.rank}</div>
    <div class="match-details-form">
      ${info.form
        .map(
          (result) =>
            `<span class="match-details-form-dot ${result === "W" ? "win" : "loss"}"></span>`,
        )
        .join("")}
    </div>
  </div>
`;

const renderHeadToHead = (headToHead: HeadToHead): string => {
  const list = headToHead.previousMatches.length
    ? headToHead.previousMatches
        .map(
          (match) => `
        <div class="match-details-h2h-row">
          <span>${formatPlayedAt(match.playedAt)}</span>
          <span class="match-details-h2h-row-score">${match.topPlayerScore} - ${match.bottomPlayerScore}</span>
        </div>
      `,
        )
        .join("")
    : `<div class="match-details-h2h-empty">No previous meetings</div>`;

  return `
    <div class="match-details-h2h">
      <h3>Head-to-head</h3>
      <div class="match-details-h2h-summary">${headToHead.topPlayerWins} - ${headToHead.bottomPlayerWins}</div>
      <div class="match-details-h2h-list">${list}</div>
    </div>
  `;
};

const renderMatchDetails = (details: MatchDetails) => {
  const body = document.getElementById("match-details-body")!;

  body.innerHTML = `
    <div class="match-details-played-at">${formatPlayedAt(details.playedAt)}</div>
    <div class="match-details-matchup">
      ${renderPlayerSection(details.topPlayer)}
      <div class="match-details-score">
        <span>${details.topPlayerScore}</span>
        <span class="match-details-score-sep">-</span>
        <span>${details.bottomPlayerScore}</span>
      </div>
      ${renderPlayerSection(details.bottomPlayer)}
    </div>
    ${renderHeadToHead(details.headToHead)}
  `;

  const deleteBtn = document.getElementById(
    "match-details-delete",
  ) as HTMLButtonElement;
  deleteBtn.classList.toggle("hidden", !details.deletable);
};

const closeMatchDetails = () => {
  document.getElementById("match-details-modal")!.classList.add("hidden");
  currentMatchId = null;
};

export const openMatchDetails = async (matchId: number) => {
  currentMatchId = matchId;
  document.getElementById("match-details-modal")!.classList.remove("hidden");

  const response = await fetch(`${API_BASE_URL}/api/matches/${matchId}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    closeMatchDetails();
    return;
  }

  const details: MatchDetails = await response.json();
  if (matchId === currentMatchId) {
    renderMatchDetails(details);
  }
};

const handleDelete = async () => {
  if (currentMatchId === null) return;
  if (!confirm("Delete this match? This cannot be undone.")) return;

  const matchId = currentMatchId;
  const response = await fetch(`${API_BASE_URL}/api/matches/${matchId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    alert("Could not delete match");
    return;
  }

  closeMatchDetails();
  onMatchDeleted();
};

export const initMatchDetails = (onDeleted: () => void) => {
  onMatchDeleted = onDeleted;

  document
    .getElementById("match-details-close")!
    .addEventListener("click", closeMatchDetails);

  document
    .getElementById("match-details-delete")!
    .addEventListener("click", handleDelete);

  document
    .getElementById("match-details-modal")!
    .addEventListener("click", (event) => {
      if (event.target === event.currentTarget) {
        closeMatchDetails();
      }
    });
};
