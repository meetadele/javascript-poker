const newGameButton = document.querySelector(".js-new-game-button");
const playerCardsContainer = document.querySelector(
  ".js-player-cards-container"
);
const chipCountContainer = document.querySelector(".js-chip-count-container");
const potContainer = document.querySelector(".js-pot-container");

// program state
let deckId = null;
let playerCards = [];
let playerChips = 100; // chips of player
let computerChips = 100; // chips of computer
let pot = 0; // cash register

function renderPlayerCards() {
  let html = "";

  for (let card of playerCards) {
    html += `<img src="${card.image}" alt="${card.code}" />`;
  }

  playerCardsContainer.innerHTML = html;
}

function renderChips() {
  chipCountContainer.innerHTML = `
    <div class="chip-count">Player chips: ${playerChips} </div>
    <div class="chip-count">Computer chips: ${computerChips} </div>
  `;
}

function renderPot() {
  potContainer.innerHTML = `
    <div class="chip-count">Pot: ${pot} </div>
    `;
}

function render() {
  renderPlayerCards();
  renderChips();
  renderPot();
}

function drawAndRenderPlayerCards() {
  if (deckId == null) return;
  fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=2`)
    .then((data) => data.json())
    .then(function (response) {
      playerCards = response.cards;
      render();
    });
}

function startGame() {
  fetch("https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1")
    .then((data) => data.json())
    .then(function (response) {
      deckId = response.deck_id;
      drawAndRenderPlayerCards(); // TODO: refactor with async-await
    });
}

newGameButton.addEventListener("click", startGame);
render();
