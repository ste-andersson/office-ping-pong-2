import "./style.css";
import "./view-transition.css";
import "./report-view.css";
import "./player-picker.css";
import "./results-view.css";
import "./team-standings-view.css";
import "./player-standings-view.css";
import "./match-details.css";
import "./player-details.css";
import "./team-details.css";

import { initViewNavigation } from "./viewNavigation";
import { initScoreControls } from "./scoreControls";
import { initPlayerSelection } from "./playerSelection";
import { initSubmitMatch } from "./submitMatch";
import { loadResultsView } from "./results-view";
import { loadTeamStandingsView } from "./team-standings-view";
import { loadPlayerStandingsView } from "./player-standings-view";
import { initMatchDetails } from "./match-details";
import { initPlayerDetails, refreshPlayerDetailsIfOpen } from "./player-details";
import { initTeamDetails, refreshTeamDetailsIfOpen } from "./team-details";

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

const initApp = async () => {
  initScoreControls();
  const { goToView } = initViewNavigation();
  await initPlayerSelection();
  initSubmitMatch(goToView);
  initPlayerDetails();
  initTeamDetails();
  initMatchDetails(() => {
    loadResultsView();
    loadTeamStandingsView();
    loadPlayerStandingsView();
    refreshPlayerDetailsIfOpen();
    refreshTeamDetailsIfOpen();
  });
  loadResultsView();
  loadTeamStandingsView();
  loadPlayerStandingsView();
};

document
  .querySelectorAll(".btn-minus, .btn-plus, #submit-btn")
  .forEach((btn) => {
    btn.addEventListener("touchstart", () => btn.classList.add("pressed"), {
      passive: true,
    });
    btn.addEventListener("touchend", () => btn.classList.remove("pressed"));
    btn.addEventListener("touchcancel", () => btn.classList.remove("pressed"));
  });

initApp();
