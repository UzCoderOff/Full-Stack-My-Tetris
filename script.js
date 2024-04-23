const gridSize = 30;
const numCols = 10;
const numRows = 20;

let grid = [];
let currentPiece;
let gameScore = 0;
let linesCleared = 0;
let currentLevel = 1;
let isPaused = false;
let isGameOver = false;
let lastMoveTime = 0;
let moveInterval = 500;
let moveDownInterval = 50;
let isMovingLeft = false;
let isMovingRight = false;
let isMovingDown = false;
let lastSideMoveTime = 0;

function setup() {
    createCanvas(numCols * gridSize + 200, numRows * gridSize);
    for (let row = 0; row < numRows; row++) {
        grid.push(Array(numCols).fill(0));
    }
    currentPiece = new Piece();
    currentPiece.spawn();
}

function draw() {
    background(0);
    drawGrid();
    currentPiece.show();

    if (!isGameOver && !isPaused) {
        let currentTime = millis();
        if (currentTime - lastMoveTime > moveInterval) {
            lastMoveTime = currentTime;
            if (!currentPiece.move(0, 1)) {
                currentPiece.lock();
                const linesClearedCount = clearLines();
                updateScore(linesClearedCount);
                currentPiece = new Piece();
                if (!currentPiece.spawn()) {
                    isGameOver = true;
                }
            }
        }
        if (isMovingDown && currentTime - lastMoveTime > moveDownInterval) {
            lastMoveTime = currentTime;
            if (!currentPiece.move(0, 1)) {
                currentPiece.lock();
                const linesClearedCount = clearLines();
                updateScore(linesClearedCount);
                currentPiece = new Piece();
                if (!currentPiece.spawn()) {
                    isGameOver = true;
                }
            }
        }
    }

    if (isGameOver) {
        textAlign(CENTER);
        textSize(36);
        fill('red');
        text("Game Over!", width / 2, height / 2);
    }

    displayGameInfo();
}

function drawGrid() {
    for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {
            const x = col * gridSize;
            const y = row * gridSize;
            stroke(150);
            fill(grid[row][col] === 0 ? 0 : grid[row][col]);
            rect(x, y, gridSize, gridSize);
        }
    }
}

function displayGameInfo() {
    textSize(24);
    textAlign(LEFT);
    fill(255);
    text(`Score: ${gameScore}`, numCols * gridSize + 20, 50);
    text(`Level: ${currentLevel}`, numCols * gridSize + 20, 100);

    fill('blue');
    noStroke();
    rect(numCols * gridSize + 20, 150, 150, 50, 10);
    rect(numCols * gridSize + 20, 220, 150, 50, 10);

    fill(255);
    textAlign(CENTER, CENTER);
    textSize(20);
    text("Restart", numCols * gridSize + 95, 175);
    text(isPaused ? "Resume" : "Pause", numCols * gridSize + 95, 245);
}

function keyPressed() {
    if (!isGameOver && !isPaused) {
        if (keyCode === LEFT_ARROW && !isMovingLeft) {
            currentPiece.move(-1, 0);
            isMovingLeft = true;
        } else if (keyCode === RIGHT_ARROW && !isMovingRight) {
            currentPiece.move(1, 0);
            isMovingRight = true;
        } else if (keyCode === DOWN_ARROW) {
            isMovingDown = true;
        } else if (keyCode === UP_ARROW) {
            currentPiece.rotate();
        }
    }
}

function keyReleased() {
    if (keyCode === LEFT_ARROW) {
        isMovingLeft = false;
    } else if (keyCode === RIGHT_ARROW) {
        isMovingRight = false;
    } else if (keyCode === DOWN_ARROW) {
        isMovingDown = false;
    }
}

function updateScore(linesClearedCount) {
    if (linesClearedCount > 0) {
        gameScore += 50 * linesClearedCount;
        linesCleared += linesClearedCount;
        if (linesCleared % 10 === 0) {
            currentLevel++;
            moveInterval = 500 - (currentLevel - 1) * 50;
        }
    }
}

function clearLines() {
    let linesClearedCount = 0;
    for (let row = numRows - 1; row >= 0; row--) {
        if (grid[row].every(cell => cell !== 0)) {
            grid.splice(row, 1);
            grid.unshift(Array(numCols).fill(0));
            linesClearedCount++;
            row++;
        }
    }
    return linesClearedCount;
}

function restartGame() {
    grid = [];
    gameScore = 0;
    linesCleared = 0;
    currentLevel = 1;
    isPaused = false;
    isGameOver = false;
    lastMoveTime = 0;
    moveInterval = 500;
    lastSideMoveTime = 0;

    for (let row = 0; row < numRows; row++) {
        grid.push(Array(numCols).fill(0));
    }

    currentPiece = new Piece();
    currentPiece.spawn();
}

class Piece {
    constructor() {
        this.type = Math.floor(random(tetrominoes.length));
        this.shape = tetrominoes[this.type];
        this.color = colors[this.type];
        this.x = Math.floor(numCols / 2) - Math.floor(this.shape[0].length / 2);
        this.y = 0;
    }

    show() {
        fill(this.color);
        for (let row = 0; row < this.shape.length; row++) {
            for (let col = 0; col < this.shape[row].length; col++) {
                if (this.shape[row][col] === 1) {
                    const x = (this.x + col) * gridSize;
                    const y = (this.y + row) * gridSize;
                    rect(x, y, gridSize, gridSize);
                }
            }
        }
    }

    move(dx, dy) {
        if (!this.collides(dx, dy)) {
            this.x += dx;
            this.y += dy;
            return true;
        }
        return false;
    }

    rotate() {
        const originalShape = this.shape;
        this.shape = this.rotateMatrix(this.shape);
        if (this.collides(0, 0)) {
            this.shape = originalShape;
        }
    }

    collides(dx, dy) {
        for (let row = 0; row < this.shape.length; row++) {
            for (let col = 0; col < this.shape[row].length; col++) {
                if (this.shape[row][col] === 1) {
                    let nextX = this.x + col + dx;
                    let nextY = this.y + row + dy;
                    if (nextX < 0 || nextX >= numCols || nextY >= numRows || grid[nextY][nextX] !== 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    lock() {
        for (let row = 0; row < this.shape.length; row++) {
            for (let col = 0; col < this.shape[row].length; col++) {
                if (this.shape[row][col] === 1) {
                    grid[this.y + row][this.x + col] = this.color;
                }
            }
        }
    }

    rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        let rotated = [];
        for (let col = 0; col < cols; col++) {
            let newRow = [];
            for (let row = rows - 1; row >= 0; row--) {
                newRow.push(matrix[row][col]);
            }
            rotated.push(newRow);
        }
        return rotated;
    }

    spawn() {
        this.x = Math.floor(numCols / 2) - Math.floor(this.shape[0].length / 2);
        this.y = 0;
        return !this.collides(0, 0);
    }
}

const tetrominoes = [
    [[1, 1, 1, 1]],
    [[1, 1, 1], [0, 1, 0]],
    [[1, 1, 0], [0, 1, 1]],
    [[0, 1, 1], [1, 1, 0]],
    [[1, 1], [1, 1]],
    [[1, 1, 1], [0, 0, 1]],
    [[1, 1, 1], [1, 0, 0]]
];

const colors = [
    'cyan', 'purple', 'red', 'green', 'yellow', 'orange', 'blue'
];

function mouseClicked() {
    if (mouseX >= numCols * gridSize + 20 && mouseX <= numCols * gridSize + 170 &&
        mouseY >= 150 && mouseY <= 200) {
        restartGame();
    } else if (!isGameOver) {
        if (mouseX >= numCols * gridSize + 20 && mouseX <= numCols * gridSize + 170 &&
            mouseY >= 220 && mouseY <= 270) {
            isPaused = !isPaused;
        }
    }
}
