import "./style.css";
import "./view-transition.css";
import "./report-view.css";
import "./player-picker.css";
import "./results-view.css";
import "./standings-view.css";

import { initViewNavigation } from "./viewNavigation";
import { initScoreControls } from "./scoreControls"
import { initPlayerSelection } from "./playerSelection";
import { initSubmitMatch } from "./submitMatch";
import { loadResultsView } from "./results-view";
import { loadStandingsView } from "./standings-view";

const initApp = async () => {
initScoreControls();
initViewNavigation();
await initPlayerSelection();
initSubmitMatch();
loadResultsView();
loadStandingsView();
};

initApp();