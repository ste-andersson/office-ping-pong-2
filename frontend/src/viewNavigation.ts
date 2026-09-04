import { loadResultsView } from "./results-view";
import { loadTeamStandingsView } from "./team-standings-view";
import { loadPlayerStandingsView } from "./player-standings-view";
import { playSfx } from "./sound";

let justSubmitted = false;

export const setJustSubmitted = (value: boolean) => {
  justSubmitted = value;
};

export const initViewNavigation = () => {
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

  const clearViewClasses = (view: HTMLElement) => {
    view.classList.remove(
      "active",
      "offscreen-left",
      "offscreen-right",
      "exit-left",
      "exit-right",
    );
  };

  const positionViews = () => {
    views.forEach((view, index) => {
      clearViewClasses(view);

      if (index < currentIndex) {
        view.classList.add("offscreen-left");
      } else if (index > currentIndex) {
        view.classList.add("offscreen-right");
      } else {
        view.classList.add("active");
      }
    });
  };

  const updateNavButtons = () => {
    prevButton.style.opacity = currentIndex === 0 ? "0" : "1";
    prevButton.style.pointerEvents = currentIndex === 0 ? "none" : "auto";
    nextButton.style.opacity = currentIndex === views.length - 1 ? "0" : "1";
    nextButton.style.pointerEvents =
      currentIndex === views.length - 1 ? "none" : "auto";
  };

  const goToView = (nextIndex: number) => {
    if (isAnimating) return;
    if (nextIndex < 0 || nextIndex >= views.length) return;
    if (nextIndex === currentIndex) return;

    isAnimating = true;

    const currentView = views[currentIndex];
    const nextView = views[nextIndex];
    const goingForward = nextIndex > currentIndex;

    positionViews();

    if (goingForward) {
      nextView.classList.remove("offscreen-right");
    } else {
      nextView.classList.remove("offscreen-left");
    }

    void nextView.offsetWidth;

    nextView.classList.add("active");

    if (goingForward) {
      currentView.classList.add("exit-left");
    } else {
      currentView.classList.add("exit-right");
    }

    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.propertyName !== "transform") return;
      currentView.removeEventListener("transitionend", onTransitionEnd);
      currentIndex = nextIndex;
      positionViews();
      updateNavButtons();
      isAnimating = false;

      if (nextIndex === 2 && !justSubmitted) loadResultsView();
      if (nextIndex === 3) loadTeamStandingsView();
      if (nextIndex === 4) loadPlayerStandingsView();
    };

    currentView.addEventListener("transitionend", onTransitionEnd);
  };

  nextButton.addEventListener("click", () => {
    playSfx("swish");
    goToView(currentIndex + 1);
  });

  prevButton.addEventListener("click", () => {
    playSfx("swish");
    goToView(currentIndex - 1);
  });

  positionViews();
  updateNavButtons();

  requestAnimationFrame(() => {
    document.body.classList.remove("app-loading");
  });

  return { goToView };
};
