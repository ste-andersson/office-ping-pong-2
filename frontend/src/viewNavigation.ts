export const initViewNavigation = () => {

const views: HTMLElement[] = [
  document.getElementById("report-view") as HTMLElement,
  document.getElementById("results-view") as HTMLElement,
  document.getElementById("standings-view") as HTMLElement,
];

const prevButton = document.getElementById("prev-view") as HTMLButtonElement;
const nextButton = document.getElementById("next-view") as HTMLButtonElement;

let currentIndex = 0;
let isAnimating = false;

const clearViewClasses = (view: HTMLElement) => {
  view.classList.remove(
    "active",
    "offscreen-left",
    "offscreen-right",
    "exit-left",
    "exit-right"
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
  nextButton.style.pointerEvents = currentIndex === views.length - 1 ? "none" : "auto";
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
  };

  currentView.addEventListener("transitionend", onTransitionEnd);
};

nextButton.addEventListener("click", () => {
  goToView(currentIndex + 1);
});

prevButton.addEventListener("click", () => {
  goToView(currentIndex - 1);
});

positionViews();
updateNavButtons();

requestAnimationFrame(() => {
  document.body.classList.remove("app-loading");
});

return { goToView };

};