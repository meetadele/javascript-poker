const newGameButton = document.querySelector(".js-new-game-button");
const potContainer = document.querySelector(".js-pot-container");
const betArea = document.querySelector(".js-bet-area");
const betSlider = document.querySelector("#bet-amount");
const betSliderValue = document.querySelector(".js-slider-value");
const betButton = document.querySelector(".js-bet-button");

const playerCardsContainer = document.querySelector(
  ".js-player-cards-container"
);
const playerChipContainer = document.querySelector(".js-player-chip-container");

const computerCardsContainer = document.querySelector(
  ".js-computer-cards-container"
);
const computerChipContainer = document.querySelector(
  ".js-computer-chip-container"
);
const computerActionContainer = document.querySelector(".js-computer-action");

// program state
let {
  deckId,
  playerCards, // cards of player
  computerCards, // cards of the computer (TODO: private? OOP?)
  computerAction, // computer action (call, fold)
  playerChips, // chips of player
  computerChips, // chips of computer
  playerBetPlaced, // player already bet
  pot, // cash register
} = getInitialState();

function getInitialState() {
  return {
    deckId: null,
    playerCards: [],
    computerCards: [],
    computerAction: null,
    playerChips: 100,
    computerChips: 100,
    playerBetPlaced: false,
    pot: 0,
  };
}

function initialize() {
  ({
    deckId,
    playerCards,
    computerCards,
    computerAction,
    playerChips,
    computerChips,
    playerBetPlaced,
    pot,
  } = getInitialState());
}

function canBet() {
  return (
    playerCards.length === 2 && playerChips > 0 && playerBetPlaced === false
  );
}

function renderSlider() {
  if (canBet()) {
    betArea.classList.remove("invisible");
    betSlider.setAttribute("max", playerChips);
    betSliderValue.innerText = betSlider.value;
  } else {
    betArea.classList.add("invisible");
  }
}

function renderCardsInContainer(cards, container) {
  let html = "";

  for (let card of cards) {
    html += `<img src="${card.image}" alt="${card.code}" />`;
  }

  container.innerHTML = html;
}

function renderAllCards() {
  renderCardsInContainer(playerCards, playerCardsContainer);
  renderCardsInContainer(computerCards, computerCardsContainer);
}

function renderChips() {
  playerChipContainer.innerHTML = `
    <div class="chip-count">Player: ${playerChips} chip</div>
  `;
  computerChipContainer.innerHTML = `
    <div class="chip-count">Computer: ${computerChips} chip</div>
  `;
}

function renderPot() {
  potContainer.innerHTML = `
    <div class="chip-count">Pot: ${pot} </div>
    `;
}

function renderActions() {
  computerActionContainer.innerHTML = computerAction ?? "";
}

function render() {
  renderAllCards();
  renderChips();
  renderPot();
  renderSlider();
  renderActions();
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

function postBlinds() {
  playerChips -= 1;
  computerChips -= 2;
  pot += 3;
  render();
}

// Starting 1 Hand
function startHand() {
  postBlinds(); // administration of Blind
  fetch("https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1")
    .then((data) => data.json())
    .then(function (response) {
      deckId = response.deck_id;
      drawAndRenderPlayerCards(); // TODO: refactor with async-await
    });
}

// One game consists of 1 or 2 Hands
function startGame() {
  initialize();
  startHand();
}

function shouldComputerCall(computerCards) {
  if (computerCards.length !== 2) return false; // extra security
  const card1Code = computerCards[0].code; // e.g. 8H, AC, 4H, 9D, 0H (10: 0)
  const card2Code = computerCards[1].code; // e.g. QH
  const card1Value = card1Code[0];
  const card2Value = card2Code[0];
  const card1Suit = card1Code[1];
  const card2Suit = card2Code[1];

  return (
    card1Value === card2Value ||
    ["0", "J", "Q", "K", "A"].includes(card1Value) ||
    ["0", "J", "Q", "K", "A"].includes(card2Value) ||
    (card1Suit === card2Suit &&
      Math.abs(Number(card1Value) - Number(card2Value)) <= 2)
  );
}

function computerMoveAfterBet() {
  fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=2`)
    .then((data) => data.json())
    .then(function (response) {
      if (shouldComputerCall(response.cards)) {
        computerAction = "Call";
        computerCards = response.cards;
      } else {
        computerAction = "Fold";
      }
      render();
    });
}

function bet() {
  const betValue = Number(betSlider.value);
  // add betValue to the value of pot
  pot += betValue;
  // deduct playerchips with betValue
  playerChips -= betValue;
  // state of the game: player did her bet
  playerBetPlaced = true;
  // re-render
  render();
  // reaction of opponent gamer, that is the computer now
  computerMoveAfterBet();
}

newGameButton.addEventListener("click", startGame);
betSlider.addEventListener("change", render);
betButton.addEventListener("click", bet);

initialize();

render();
