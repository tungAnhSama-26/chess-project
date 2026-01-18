const gameBoard = document.querySelector("#gameBoard");
const playerDisplay = document.querySelector("#player");
const infoDisplay = document.querySelector("#info-display");
// hàng và cột của bàn cờ
const width = 8;
let board = new Array(64).fill(null);
let currentPlayer = "white";
let draggedElement = null;
let startPositionId = null;
let moved = {
  white: { king: false, rookA: false, rookH: false },
  black: { king: false, rookA: false, rookH: false },
};
// vị trí bắt đầu của bàn cờ
const startPieces = [
  rook,
  knight,
  bishop,
  queen,
  king,
  bishop,
  knight,
  rook,
  pawn,
  pawn,
  pawn,
  pawn,
  pawn,
  pawn,
  pawn,
  pawn,
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  pawn,
  pawn,
  pawn,
  pawn,
  pawn,
  pawn,
  pawn,
  pawn,
  rook,
  knight,
  bishop,
  queen,
  king,
  bishop,
  knight,
  rook,
];
// hàng ngang
function getRow(id) {
  return Math.floor(id / 8);
}

// hàng dọc
function getColumn(id) {
  return id % 8;
}

function getPieceType(pieceChar) {
  return pieceChar.toLowerCase();
}

// màu quân cờ: trắng và đen
function getPieceColor(pieceChar) {
  return pieceChar === pieceChar.toUpperCase() ? "white" : "black";
}

// kiểm tra hướng đi của các quân có khả năng đi chéo hoặc thẳng nhưng nhiều ô
function pathClear(startId, targetId, board) {
  const row1 = getRow(startId);
  const column1 = getColumn(startId);
  const row2 = getRow(targetId);
  const column2 = getColumn(targetId);

  const deltaRow = row2 - row1;
  const deltaColumn = column2 - column1;
  const dr = deltaRow > 0 ? 1 : deltaRow < 0 ? -1 : 0;
  const dc = deltaColumn > 0 ? 1 : deltaColumn < 0 ? -1 : 0;

  let currentRow = row1 + dr;
  let currentColumn = column1 + dc;

  while (currentRow !== row2 || currentColumn !== column2) {
    const position = currentRow * 8 + currentColumn;
    if (board[position]) return false;
    currentRow += dr;
    currentColumn += dc;
  }
  return true;
}

// cách di chuyển của các quân cờ
function validMove(startId, targetId, currentPlayer, boardState) {
  if (startId === targetId) return false;

  const piece = boardState[startId];
  if (!piece) return false;

  const type = getPieceType(piece);
  const color = getPieceColor(piece);
  if (color !== currentPlayer) return false;

  const targetPiece = boardState[targetId];
  if (targetPiece && getPieceColor(targetPiece) === color) return false;

  const row = getRow(startId);
  const col = getColumn(startId);
  const tRow = getRow(targetId);
  const tCol = getColumn(targetId);
  const dRow = tRow - row;
  const dCol = tCol - col;
  const absDRow = Math.abs(dRow);
  const absDCol = Math.abs(dCol);

  // quân trắng đi
  const direction = color === "white" ? -1 : 1;
  const startRow = color === "white" ? 6 : 1;
  // các quân cờ
  switch (type) {
    case "k":
      // quân vua di chuyển bthg
      if (absDRow <= 1 && absDCol <= 1) return true;

      // nhập thành
      if (!moved[color].king && dRow === 0 && absDCol === 2) {
        const homeRow = color === "white" ? 7 : 0;
        if (row !== homeRow) return false;

        // nhập thành cánh vua 0-0
        if (dCol === 2 && !moved[color].rookH) {
          const path = [startId + 1, startId + 2];
          return path.every((id) => !boardState[id]);
        }

        // nhập thành cánh hậu 0-0-0
        if (dCol === -2 && !moved[color].rookA) {
          const path = [startId - 1, startId - 2, startId - 3];
          return path.every((id) => !boardState[id]);
        }
      }
      return false;

    case "n":
      return (
        (absDRow === 2 && absDCol === 1) || (absDRow === 1 && absDCol === 2)
      );
    case "p":
      if (dCol === 0) {
        if (dRow === direction) return !targetPiece;
        if (dRow === 2 * direction && row === startRow) {
          const midId = (row + direction) * 8 + col;
          return !boardState[midId] && !targetPiece;
        }
      } else if (absDCol === 1 && dRow === direction) {
        return !!targetPiece;
      }
      return false;
    case "r":
      if (dRow !== 0 && dCol !== 0) return false;
      return pathClear(startId, targetId, boardState);
    case "b":
      if (absDRow !== absDCol) return false;
      return pathClear(startId, targetId, boardState);
    case "q":
      if (absDRow !== absDCol && dRow !== 0 && dCol !== 0) return false;
      return pathClear(startId, targetId, boardState);
    default:
      return false;
  }
}

function createBoard() {
  startPieces.forEach((pieceHTML, index) => {
    const square = document.createElement("div");
    square.classList.add("square");
    square.setAttribute("square-id", index);

    const row = Math.floor((63 - index) / 8) + 1;
    if (row % 2 === 0) {
      square.classList.add(index % 2 === 0 ? "beige" : "brown");
    } else {
      square.classList.add(index % 2 === 0 ? "brown" : "beige");
    }

    square.innerHTML = pieceHTML;

    const pieceDiv = square.querySelector(".piece");
    if (pieceDiv) {
      pieceDiv.setAttribute("draggable", "true");
      const pieceName = pieceDiv.getAttribute("data-piece");
      const pieceMap = {
        king: "k",
        queen: "q",
        rook: "r",
        bishop: "b",
        knight: "n",
        pawn: "p",
      };
      const pType = pieceMap[pieceName];
      let pieceChar = pType;
      // Nếu như index nhỏ hơn hoặc bằng 15 thì bên đó là quân đen và index từ 48 trở đi thì đó là bên trắng
      if (index <= 15) {
        // quân đen
        pieceDiv.classList.add("black");
      } else if (index >= 48) {
        // quân trắng
        pieceDiv.classList.add("white");
        pieceChar = pType.toUpperCase();
      }
      board[index] = pieceChar;
    }

    gameBoard.appendChild(square);
  });
}

createBoard();

const allSquares = document.querySelectorAll("#gameBoard .square");

allSquares.forEach((square) => {
  square.addEventListener("dragstart", dragStart);
  square.addEventListener("dragover", dragOver);
  square.addEventListener("drop", dragDrop);
  square.addEventListener("dragenter", dragEnter);
  square.addEventListener("dragleave", dragLeave);
});
// nhấc quân để di chuyển
function dragStart(e) {
  const piece = e.target.closest(".piece");
  if (!piece) return;

  startPositionId = parseInt(e.currentTarget.getAttribute("square-id"));

  const pieceChar = board[startPositionId];
  if (!pieceChar || getPieceColor(pieceChar) !== currentPlayer) {
    return;
  }

  draggedElement = piece;
  setTimeout(() => {
    if (draggedElement) draggedElement.style.opacity = "0.5";
  }, 0);
  e.dataTransfer.effectAllowed = "move";
}
// đặt quân vào ô cờ mong muốn chọn
function dragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
}

// tiếp nhận quân cờ đó nếu như nước đi đó được cho là di chuyển đúng
function dragEnter(e) {
  e.preventDefault();
  const targetId = parseInt(e.currentTarget.getAttribute("square-id"));
  if (
    draggedElement &&
    startPositionId !== targetId &&
    validMove(startPositionId, targetId, currentPlayer, board)
  ) {
    e.currentTarget.classList.add("highlight");
  }
}
// có thể là ko muốn đi quân đó nữa mà đi quân khác
function dragLeave(e) {
  e.currentTarget.classList.remove("highlight");
}
// ăn quân, nhập thành và đổi sang lượt khác, phong cấp khi ở hàng cuối
function dragDrop(e) {

  e.preventDefault();
  const targetSquare = e.currentTarget;
  const targetId = parseInt(targetSquare.getAttribute("square-id"));
  targetSquare.classList.remove("highlight");
  /* trường hợp nếu như di chuyển sai thì quân đó không thể đi được mà cần phải di
 chuyển đúng theo logic */
  if (
    !draggedElement ||
    startPositionId === targetId ||
    !validMove(startPositionId, targetId, currentPlayer, board)
  ) {
    resetDrag();
    return;
  }

  
  // không cho di chuyển các quân khác nếu như không phải là để bảo vệ vua
  const testBoard = [...board];
  testBoard[targetId] = board[startPositionId];
  testBoard[startPositionId] = null;
  if(check(currentPlayer,testBoard)) {
    resetDrag();
    return;
  }

  const movingPiece = board[startPositionId];

  // capture
  const targetPieceDom = targetSquare.querySelector(".piece");
  if (targetPieceDom) targetSquare.removeChild(targetPieceDom);

  targetSquare.appendChild(draggedElement);

  board[targetId] = movingPiece;
  board[startPositionId] = null;

  // quân xe di chuyển khi nhập thành
  if (
    getPieceType(movingPiece) === "k" &&
    Math.abs(targetId - startPositionId) === 2
  ) {
    const rookFrom = targetId > startPositionId ? targetId + 1 : targetId - 2;
    const rookTo = targetId > startPositionId ? targetId - 1 : targetId + 1;

    const rookFromSquare = document.querySelector(`[square-id="${rookFrom}"]`);
    const rookToSquare = document.querySelector(`[square-id="${rookTo}"]`);
    const rookPiece = rookFromSquare.querySelector(".piece");

    rookFromSquare.removeChild(rookPiece);
    rookToSquare.appendChild(rookPiece);

    board[rookTo] = board[rookFrom];
    board[rookFrom] = null;
  }

  // update moved flags
  const color = currentPlayer;
  if (getPieceType(movingPiece) === "k") moved[color].king = true;
  if (getPieceType(movingPiece) === "r") {
    if (startPositionId % 8 === 0) moved[color].rookA = true;
    if (startPositionId % 8 === 7) moved[color].rookH = true;
  }

  // tốt phong cấp
  if (getPieceType(movingPiece) === "p") {
    const row = getRow(targetId);
    if (
      (movingPiece === "P" && row === 0) ||
      (movingPiece === "p" && row === 7)
    ) {
      promotePawn(targetId, movingPiece);
    }
  }

  // switch player
  currentPlayer = currentPlayer === "white" ? "black" : "white";

  resetDrag();
}

function resetDrag() {
  if (draggedElement) {
    draggedElement.style.opacity = "1";
  }
  draggedElement = null;
  startPositionId = null;
}

function check(color, boardState) {
  const kingChar = color === "white" ? "k" : "k";
  const kingPosition = boardState.indexOf(kingChar);
  if (kingPosition === -1) return false;
  return boardState.some((piece, index) => {
    if (!piece) return false;

    if (!piece || getPieceColor(piece) === color) return false;
    return validMove(index, kingPosition, getPieceColor(piece), boardState);
  });
}

function checkmate(color, boardState) {
  if (!check(color, boardState)) return false;

  for (let i = 0; i < 64; i++) {
    if (!boardState[i]) continue;
    if (getPieceColor(board[i]) !== color) continue;

    for (let j = 0; j < 64; j++) {
      if (!validMove(i, j, color, boardState)) continue;

      const copy = [...boardState];
      copy[j] = copy[i];
      copy[i] = null;

      if (!check(color, copy)) {
        return false;
      }
    }
  }
  return true;
}

function promotePawn(squareId, pawnChar) {
  const choice = prompt("Promote to: queen, rook, bishop, knight", "q");

  const color = getPieceColor(pawnChar);
  const map = {
    q: queen,
    r: rook,
    b: bishop,
    n: knight,
  };

  if (!map[choice]) return;

  const square = document.querySelector(`[square-id="${squareId}"]`);
  square.innerHTML = map[choice];
  const pieceDiv = square.querySelector(".piece");
  pieceDiv.classList.add(color);
  pieceDiv.setAttribute("draggable", "true");

  board[squareId] = color === "white" ? choice.toUpperCase() : choice;
}
