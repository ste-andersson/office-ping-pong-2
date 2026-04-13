let topPlayerScore = 0;
let bottomPlayerScore = 0;

const scoreP1 = document.getElementById("score-p1") as HTMLSpanElement;
const scoreP2 = document.getElementById("score-p2") as HTMLSpanElement;

const renderScores = (): void => {
  scoreP1.textContent = String(topPlayerScore);
  scoreP2.textContent = String(bottomPlayerScore);
};

export const initScoreControls = () => {
  const p1Plus = document.getElementById("p1-plus") as HTMLButtonElement;
  const p1Minus = document.getElementById("p1-minus") as HTMLButtonElement;
  const p2Plus = document.getElementById("p2-plus") as HTMLButtonElement;
  const p2Minus = document.getElementById("p2-minus") as HTMLButtonElement;

  p1Plus.addEventListener("click", () => {
    topPlayerScore += 1;
    renderScores();
  });

  p1Minus.addEventListener("click", () => {
    if (topPlayerScore > 0) {
      topPlayerScore -= 1;
      renderScores();
    }
  });

  p2Plus.addEventListener("click", () => {
    bottomPlayerScore += 1;
    renderScores();
  });

  p2Minus.addEventListener("click", () => {
    if (bottomPlayerScore > 0) {
      bottomPlayerScore -= 1;
      renderScores();
    }
  });

  scoreP1.addEventListener("click", () => {
    topPlayerScore = topPlayerScore === 11 ? 0 : 11;
    renderScores();
  });

  scoreP2.addEventListener("click", () => {
    bottomPlayerScore = bottomPlayerScore === 11 ? 0 : 11;
    renderScores();
  });

  renderScores();
};

export const getScores = () => {
  return {
    topPlayerScore: topPlayerScore,
    bottomPlayerScore: bottomPlayerScore,
  };
};

export const resetScores = () => {
  topPlayerScore = 0;
  bottomPlayerScore = 0;
  renderScores();
};
