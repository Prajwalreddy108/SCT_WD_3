const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const xWinsEl = document.getElementById('xWins');
const oWinsEl = document.getElementById('oWins');
const drawsEl = document.getElementById('draws');
const modeEl = document.getElementById('mode');
const newRoundBtn = document.getElementById('newRound');
const undoBtn = document.getElementById('undo');
const resetScoresBtn = document.getElementById('resetScores');

const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

let board, current, over, scores, history, mode;

function init() {
  board = Array(9).fill('');
  current = 'X';
  over = false;
  history = [];
  mode = modeEl.value;
  renderBoard();
  updateStatus();
  enableBoard(true);
}

function renderBoard() {
  boardEl.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const btn = document.createElement('button');
    btn.className = `cell ${board[i]}`.trim();
    btn.dataset.index = i;
    btn.textContent = board[i];
    btn.addEventListener('click', onCellClick);
    boardEl.appendChild(btn);
  }
}

function onCellClick(e) {
  const i = +e.currentTarget.dataset.index;
  if (over || board[i]) return;
  makeMove(i, current);
  const res = evaluate();
  if (res.done) { endRound(res); return; }
  swapTurn();
  if (mode === 'cpu' && current === 'O' && !over) {
    setTimeout(() => {
      const aiIndex = bestMove('O');
      makeMove(aiIndex, 'O');
      const res2 = evaluate();
      if (res2.done) { endRound(res2); return; }
      swapTurn();
    }, 350);
  }
}

function makeMove(i, player) {
  board[i] = player;
  history.push({ index: i, player });
  const cell = boardEl.children[i];
  cell.textContent = player;
  cell.classList.add(player);
}

function swapTurn() {
  current = current === 'X' ? 'O' : 'X';
  updateStatus();
}

function updateStatus(message) {
  if (message) { statusEl.textContent = message; return; }
  if (over) return;
  statusEl.textContent = `${current} to move`;
}

function evaluate() {
  for (const [a,b,c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { done: true, winner: board[a], line: [a,b,c] };
    }
  }
  if (board.every(v => v)) return { done: true, winner: null };
  return { done: false };
}

function endRound(res) {
  over = true;
  enableBoard(false);
  if (res.winner) {
    highlight(res.line);
    updateStatus(`${res.winner} wins!`);
    if (res.winner === 'X') scores.x++; else scores.o++;
  } else {
    updateStatus("It's a draw.");
    scores.d++;
  }
  syncScores();
}

function highlight(indices) {
  indices.forEach(i => boardEl.children[i].classList.add('win'));
}

function enableBoard(flag) {
  [...boardEl.children].forEach(el => el.classList.toggle('disabled', !flag));
}

function newRound() {
  board = Array(9).fill('');
  current = 'X';
  over = false;
  history = [];
  renderBoard();
  updateStatus();
  enableBoard(true);
}

function resetScores() {
  scores = { x: 0, o: 0, d: 0 };
  syncScores();
  newRound();
}

function syncScores() {
  xWinsEl.textContent = scores.x;
  oWinsEl.textContent = scores.o;
  drawsEl.textContent = scores.d;
}

function undo() {
  if (history.length === 0) return;
  const steps = (mode === 'cpu') ? 2 : 1;
  for (let k = 0; k < steps; k++) {
    const last = history.pop();
    if (!last) break;
    board[last.index] = '';
  }
  over = false;
  renderBoard();
  current = 'X';
  updateStatus();
  enableBoard(true);
}

function bestMove(ai) {
  const human = ai === 'X' ? 'O' : 'X';
  let bestScore = -Infinity, move = -1;
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = ai;
      const score = minimax(false, ai, human);
      board[i] = '';
      if (score > bestScore) { bestScore = score; move = i; }
    }
  }
  return move;
}

function minimax(isMax, ai, human) {
  const res = evaluate();
  if (res.done) {
    if (res.winner === ai) return 10;
    if (res.winner === human) return -10;
    return 0;
  }
  if (isMax) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) if (!board[i]) { board[i] = ai; best = Math.max(best, minimax(false, ai, human)); board[i] = ''; }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) if (!board[i]) { board[i] = human; best = Math.min(best, minimax(true, ai, human)); board[i] = ''; }
    return best;
  }
}

newRoundBtn.addEventListener('click', newRound);
resetScoresBtn.addEventListener('click', resetScores);
undoBtn.addEventListener('click', undo);
modeEl.addEventListener('change', init);

scores = { x: 0, o: 0, d: 0 };
init();
function endRound(res) {
  over = true;
  enableBoard(false);
  let message = '';
  if (res.winner) {
    highlight(res.line);
    message = `${res.winner} wins!`;
    if (res.winner === 'X') scores.x++; else scores.o++;
  } else {
    message = "It's a draw!";
    scores.d++;
  }
  syncScores();
  showPopup(message);
}
const popup = document.getElementById('popup');
const popupMessage = document.getElementById('popup-message');
const popupClose = document.getElementById('popup-close');

function showPopup(msg) {
  popupMessage.textContent = msg;
  popup.classList.add('show');
}

popupClose.addEventListener('click', () => {
  popup.classList.remove('show');
  newRound();
});
