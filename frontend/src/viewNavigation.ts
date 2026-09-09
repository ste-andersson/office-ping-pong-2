import { loadResultsView } from "./results-view";
import { loadTeamStandingsView } from "./team-standings-view";
import { loadPlayerStandingsView } from "./player-standings-view";
import { playSfx } from "./sound";

let justSubmitted = false;

export const setJustSubmitted = (value: boolean) => {
  justSubmitted = value;
};

export const initViewNavigation = () => {
  const track = document.getElementById("view-track") as HTMLElement;

  const views: HTMLElement[] = [
    document.getElementById("arcade-view") as HTMLElement,
    document.getElementById("report-view") as HTMLElement,
    document.getElementById("results-view") as HTMLElement,
    document.getElementById("team-standings-view") as HTMLElement,
    document.getElementById("player-standings-view") as HTMLElement,
  ];

  const prevButton = document.getElementById("prev-view") as HTMLButtonElement;
  const nextButton = document.getElementById("next-view") as HTMLButtonElement;

  // Report (index 1) stays the screen the app opens on; Arcade Mode (index 0)
  // is reached only by going left from Report, not by default.
  let currentIndex = 1;
  let isAnimating = false;

  const updateNavButtons = () => {
    prevButton.style.opacity = currentIndex === 0 ? "0" : "1";
    prevButton.style.pointerEvents = currentIndex === 0 ? "none" : "auto";
    nextButton.style.opacity = currentIndex === views.length - 1 ? "0" : "1";
    nextButton.style.pointerEvents =
      currentIndex === views.length - 1 ? "none" : "auto";
  };

  // All views ride on the single #view-track element (see
  // view-transition.css) — sliding just moves that one shared transform, so
  // the outgoing and incoming views can never drift out of sync with each
  // other the way two independently-animated elements could.
  const goToView = (nextIndex: number) => {
    if (isAnimating) return;
    if (nextIndex < 0 || nextIndex >= views.length) return;
    if (nextIndex === currentIndex) return;

    isAnimating = true;

    const previousView = views[currentIndex];
    currentIndex = nextIndex;
    const nextView = views[currentIndex];

    // The outgoing view keeps rendering (via "exiting") for the full slide
    // so it's visibly still there mid-transition, but loses interactivity
    // immediately rather than staying clickable until the animation ends.
    previousView.classList.remove("active");
    previousView.classList.add("exiting");
    nextView.classList.add("active");

    track.style.transform = `translateX(-${currentIndex * 100}%)`;

    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.propertyName !== "transform") return;
      track.removeEventListener("transitionend", onTransitionEnd);
      previousView.classList.remove("exiting");
      updateNavButtons();
      isAnimating = false;

      if (currentIndex === 2 && !justSubmitted) loadResultsView();
      if (currentIndex === 3) loadTeamStandingsView();
      if (currentIndex === 4) loadPlayerStandingsView();
    };

    track.addEventListener("transitionend", onTransitionEnd);
  };

  nextButton.addEventListener("click", () => {
    playSfx("swish");
    goToView(currentIndex + 1);
  });

  prevButton.addEventListener("click", () => {
    playSfx("swish");
    goToView(currentIndex - 1);
  });

  views[currentIndex].classList.add("active");
  track.style.transform = `translateX(-${currentIndex * 100}%)`;
  updateNavButtons();

  requestAnimationFrame(() => {
    document.body.classList.remove("app-loading");
  });

  return { goToView };
};
