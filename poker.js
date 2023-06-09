const newGameButton = document.querySelector(".js-new-game-button");
const potContainer = document.querySelector(".js-pot-container");

const playerCardsContainer = document.querySelector(
  ".js-player-cards-container"
);
const playerChipContainer = document.querySelector(".js-player-chip-container");
const playerStatusContainer = document.querySelector(
  ".js-player-status-container"
);
const betArea = document.querySelector(".js-bet-area");
const betSlider = document.querySelector("#bet-amount");
const betSliderValue = document.querySelector(".js-slider-value");
const betButton = document.querySelector(".js-bet-button");
const betPotButton = document.querySelector(".js-betpot");
const bet25Button = document.querySelector(".js-bet25");
const bet50Button = document.querySelector(".js-bet50");

const computerCardsContainer = document.querySelector(
  ".js-computer-cards-container"
);
const computerChipContainer = document.querySelector(
  ".js-computer-chip-container"
);
const computerStatusContainer = document.querySelector(
  ".js-computer-status-container"
);
const computerActionContainer = document.querySelector(".js-computer-action");

const communityCardsContainer = document.querySelector(".js-community-cards");

// program state
let {
  deckId,
  playerCards, // cards of player
  computerCards, // cards of the computer
  communityCards, // common cards
  computerAction, // computer action (call, fold)
  playerChips, // chips of player
  playerBets, // player bet in this round
  playerStatus, // info about status of player (won, lost, its a draw, fold)
  computerChips, // chips of computer
  computerBets, //  computer bet in this round
  computerStatus, // info about status of computer (won, lost, its a draw, fold)
  playerBetPlaced, // player already bet
  timeoutIds, // setTimeout ID list
} = getInitialState();

function getPot() {
  return playerBets + computerBets;
}

function getInitialState() {
  return {
    deckId: null,
    playerCards: [],
    computerCards: [],
    communityCards: [],
    computerAction: null,
    playerChips: 100,
    playerBets: 0,
    playerStatus: "",
    computerChips: 50,
    computerBets: 0,
    computerStatus: "",
    playerBetPlaced: false,
    timeoutIds: [],
  };
}

// Status management TODO: Starting new hand we need to refresh these values
// deckID = null;
// playerBets = 0;
// computerBets = 0;
// playerCards = [];
// computerCards = [];
// computerAction = null;
// playerBetPlaced = false;
// playerStatus = "";
// computerStatus = "";
// computerAction = "";
// We reset everything except the status of chips

function initialize() {
  for (let id of timeoutIds) {
    clearTimeoutId(id);
  }
  ({
    deckId,
    playerCards,
    computerCards,
    communityCards,
    computerAction,
    playerChips,
    playerBets,
    playerStatus,
    computerChips,
    computerBets,
    computerStatus,
    playerBetPlaced,
    timeoutIds,
  } = getInitialState());
  // State of the Bet slider only fixed in DOM. Let's put it in default state.
  betSlider.value = 1;
  // we assume that we are going to render the default values elsewhere
  // that is why we do not need to render the Slider value here.
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
    html += `<img src="${card.image}" alt="${card.code}" class="card-image"/>`;
  }

  container.innerHTML = html;
}

function renderAllCards() {
  renderCardsInContainer(playerCards, playerCardsContainer);
  renderCardsInContainer(computerCards, computerCardsContainer);
  renderCardsInContainer(communityCards, communityCardsContainer);
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
    <div class="chip-count">Pot: ${getPot()} </div>
    `;
}

function renderActions() {
  computerActionContainer.innerHTML = computerAction ?? "";
}

function renderStatusInfo() {
  playerStatusContainer.innerHTML = playerStatus;
  computerStatusContainer.innerHTML = computerStatus;
}

function render() {
  renderAllCards();
  renderChips();
  renderPot();
  renderSlider();
  renderActions();
  renderStatusInfo();
}

async function drawPlayerCards() {
  if (deckId == null) return;
  const data = await fetch(
    `https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=2`
  );
  const response = await data.json();
  playerCards = response.cards;
}

function postBlinds() {
  playerChips -= 1;
  playerBets += 1;
  computerChips -= 2;
  computerBets += 2;
  render();
}

// Starting 1 Hand
async function startHand() {
  postBlinds(); // administration of Blinds
  const data = await fetch(
    "https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1"
  );
  const response = await data.json();
  deckId = response.deck_id;
  await drawPlayerCards();
  render();
}

// One game consists of 1 or 2 Hands
function startGame() {
  initialize();
  startHand();
}

function endHand(winner = null) {
  const id = setTimeout(() => {
    if (computerAction === ACTIONS.Fold || winner === STATUS.Player) {
      playerChips += getPot();
    } else if (winner === STATUS.Computer) {
      computerChips += getPot();
    } /*if (winner === STATUS.Draw) */ else {
      playerChips += playerBets;
      computerChips += computerBets;
    } // no other options here
    playerBets = 0;
    computerBets = 0;
    render();
  }, 2000);
  timeoutIds.push(id);
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

const SHOWDOWN_API_PREFIX = "https://api.pokerapi.dev/v1/winner/texas_holdem";
function cardsToString(cards) {
  return cards
    .map((x) => (x.code[0] === "0" ? "1" + x.code : x.code))
    .toString();
}
async function getWinner() {
  // https://api.pokerapi.dev/v1/winner/texas_holdem?cc=AC,KD,QH,JS,7C&pc[]=10S,8C&pc[]=3S,2C&pc[]=QS,JH
  const cc = cardsToString(communityCards);
  const pc0 = cardsToString(playerCards);
  const pc1 = cardsToString(computerCards);
  const data = await fetch(
    `${SHOWDOWN_API_PREFIX}?cc=${cc}&pc[]=${pc0}&pc[]=${pc1}`
  );
  const response = await data.json();
  const winners = response.winners;
  if (winners.length === 2) {
    return STATUS.Draw;
  } else if (winners[0].cards === pc0) {
    //Player is the winner
    return STATUS.Player;
  } else {
    return STATUS.Computer;
  }
}

async function showdown() {
  const data = await fetch(
    `https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=5`
  );
  const response = await data.json();
  communityCards = response.cards;
  render();
  const winner = await getWinner();
  return winner;
}

async function computerMoveAfterBet() {
  const data = await fetch(
    `https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=2`
  );
  const response = await data.json();

  if (getPot() === 4) {
    computerAction = ACTIONS.Check;
  } else if (shouldComputerCall(response.cards)) {
    computerAction = ACTIONS.Call;
  } else {
    computerAction = ACTIONS.Fold;
  }

  if (computerAction === ACTIONS.Call) {
    // player: Bet (Blindbet and PlayerBet)
    // computer: 2
    // cash register: Pot
    // Bet + 2 = Pot
    // computer already put in 2 chips as BlindBet so it has to put in Bet - 2
    // Bet - 2 = Pot - 4
    if (playerBets > computerChips + computerBets) {
      let chipsToReturnToPlayer = playerBets - computerChips - computerBets;
      playerBets -= chipsToReturnToPlayer;
      playerChips += chipsToReturnToPlayer;
    }
    const difference = playerBets - computerBets;
    computerChips -= difference;
    computerBets += difference;
  }

  if (computerAction === ACTIONS.Check || computerAction == ACTIONS.Call) {
    computerCards = response.cards;
    render();
    const winner = await showdown();
    if (winner === STATUS.Player) {
      playerStatus = STATUS.Player;
    } else if (winner === STATUS.Computer) {
      computerStatus = STATUS.Computer;
    } else if (winner === STATUS.Draw) {
      playerStatus = STATUS.Draw;
      computerStatus = STATUS.Draw;
    }
    endHand(winner);
  } else {
    // Computer Folded
    playerStatus = STATUS.Player;
    render();
    endHand();
  }
}

function bet() {
  const betValue = Number(betSlider.value);
  // deduct playerchips with betValue
  playerChips -= betValue;
  // state of the game: player did her bet
  playerBetPlaced = true;
  playerBets += betValue;
  // re-render
  render();
  // reaction of opponent gamer, that is the computer now
  computerMoveAfterBet();
}

function getPlayerPotBet() {
  let difference = computerBets - playerBets;
  return Math.min(playerChips, getPot() + 2 * difference);
}

function setSliderValue(percentage) {
  let betSize = null;
  if (typeof percentage === "number") {
    betSize = Math.floor((playerChips * percentage) / 100);
  } else {
    betSize = getPlayerPotBet();
  }

  betSlider.value = betSize;
  render();
}

newGameButton.addEventListener("click", startGame);

betSlider.addEventListener("change", render);
betSlider.addEventListener("input", render);
betPotButton.addEventListener("click", () => setSliderValue());
bet25Button.addEventListener("click", () => setSliderValue(25));
bet50Button.addEventListener("click", () => setSliderValue(50));

betButton.addEventListener("click", bet);
initialize();
render();
