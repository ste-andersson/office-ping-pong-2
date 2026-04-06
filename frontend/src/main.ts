import "./style.css";
import "./view-transition.css";
import "./report-view.css";
import "./player-picker.css";
import "./results-view.css";
import "./standings-view.css";

import { initViewNavigation } from "./viewNavigation";
import { initScoreControls } from "./scoreControls";
import { initPlayerSelection } from "./playerSelection";
import { initSubmitMatch } from "./submitMatch";
import { loadResultsView } from "./results-view";
import { loadStandingsView } from "./standings-view";

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

const initApp = async () => {
  initScoreControls();
  const { goToView } = initViewNavigation();
  await initPlayerSelection();
  initSubmitMatch(goToView);
  loadResultsView();
  loadStandingsView();
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
