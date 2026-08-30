import { API_BASE_URL } from "./api";

type Match = {
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

const formatDateHeading = (dateString: string): string => {
  const date = new Date(dateString);

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const groupMatchesByDate = (matches: Match[]) => {
  const grouped = new Map<string, Match[]>();

  matches.forEach((match) => {
    const dateKey = match.playedAt.split("T")[0];

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }

    grouped.get(dateKey)!.push(match);
  });

  return grouped;
};

export const loadResultsView = async () => {
  const container = document.getElementById("results-list") as HTMLDivElement;

  const response = await fetch(`${API_BASE_URL}/api/matches`, {
    cache: "no-store",
  });
  const matches: Match[] = await response.json();

  container.innerHTML = "";

  if (matches.length === 0) {
    container.innerHTML = `<div class="match-empty">No matches reported yet</div>`;
    return;
  }

  const groupedMatches = groupMatchesByDate(matches);

  groupedMatches.forEach((matchesForDate, dateKey) => {
    const dateHeading = document.createElement("h3");
    dateHeading.className = "results-date-heading";
    dateHeading.textContent = formatDateHeading(dateKey);
    container.appendChild(dateHeading);

    matchesForDate.forEach((match) => {
      const card = document.createElement("div");
      card.className = "match-card";

      card.innerHTML = `
        <div class="match-player team-${match.topPlayerTeam}">
          <img
            class="match-avatar"
            src="/assets/${match.topPlayerAvatar}"
            alt="${match.topPlayerName}"
          />
          <span class="match-player-name">${match.topPlayerName}</span>
        </div>

        <div class="match-score">
          <span>${match.topPlayerScore}</span>
          <span class="match-score-separator">-</span>
          <span>${match.bottomPlayerScore}</span>
        </div>

        <div class="match-player team-${match.bottomPlayerTeam}">
          <img
            class="match-avatar"
            src="/assets/${match.bottomPlayerAvatar}"
            alt="${match.bottomPlayerName}"
          />
          <span class="match-player-name">${match.bottomPlayerName}</span>
        </div>
      `;

      container.appendChild(card);
    });
  });
};