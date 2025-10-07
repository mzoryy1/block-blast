type PieceType = number[][];
type BoardType = number[][];

interface GameState {
    board: BoardType;
    score: number;
    currentPieces: PieceType[];
    pieceColors: number[];
    usedPieces: boolean[];
    selectedPiece: number | null;
    gameOver: boolean;
    rewardedAdLoaded: boolean;
}

declare const AdMob: any;

const BOARD_SIZE = 8;
const COLORS = [
    '#3b82f6', '#8b5cf6', '#ec4899', 
    '#f59e0b', '#10b981', '#06b6d4'
];

const PIECE_TEMPLATES: PieceType[] = [
    [[1]],
    [[1, 1]],
    [[1], [1]],
    [[1, 1], [1, 1]],
    [[1, 1, 1]],
    [[1], [1], [1]],
    [[1, 1, 1], [1, 0, 0]],
    [[1, 1, 1], [0, 0, 1]],
    [[1, 0], [1, 1]],
    [[0, 1], [1, 1]],
    [[1, 1, 1, 1]],
    [[1], [1], [1], [1]],
    [[1, 1, 1], [0, 1, 0]],
    [[0, 1, 0], [1, 1, 1]],
    [[1, 0, 0], [1, 1, 1]],
    [[0, 0, 1], [1, 1, 1]],
];

let gameState: GameState;

function initializeAdMob(testing: boolean): Promise<void> {
    return new Promise((resolve) => {
        if (typeof AdMob !== 'undefined') {
            const admobConfig = {
                isTesting: testing,
                autoShow: false
            };
            AdMob.setOptions(admobConfig);
            console.log('AdMob initialized');
        } else {
            console.log('AdMob not available (web version)');
        }
        resolve();
    });
}

function showBannerAd(adUnitId: string): void {
    const banner = document.getElementById('adBanner');
    if (banner) {
        banner.classList.add('show');
    }
    
    if (typeof AdMob !== 'undefined') {
        AdMob.createBanner({
            adId: adUnitId,
            position: AdMob.AD_POSITION.BOTTOM_CENTER,
            autoShow: true
        });
    }
}

function hideBannerAd(): void {
    const banner = document.getElementById('adBanner');
    if (banner) {
        banner.classList.remove('show');
    }
    
    if (typeof AdMob !== 'undefined') {
        AdMob.removeBanner();
    }
}

function preloadRewardedAd(adUnitId: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (typeof AdMob !== 'undefined') {
            AdMob.prepareRewardVideoAd({
                adId: adUnitId,
                autoShow: false
            }, () => {
                gameState.rewardedAdLoaded = true;
                resolve();
            }, () => {
                gameState.rewardedAdLoaded = false;
                reject();
            });
        } else {
            gameState.rewardedAdLoaded = true;
            resolve();
        }
    });
}

function showRewardedAd(onReward: () => void, onFailure: () => void): void {
    if (typeof AdMob !== 'undefined' && gameState.rewardedAdLoaded) {
        AdMob.showRewardVideoAd();
        
        document.addEventListener('onRewardedVideoAdCompleted', () => {
            onReward();
            gameState.rewardedAdLoaded = false;
            preloadRewardedAd('ca-app-pub-3940256099942544/5224354917');
        });
        
        document.addEventListener('onRewardedVideoAdClosed', () => {
            gameState.rewardedAdLoaded = false;
            preloadRewardedAd('ca-app-pub-3940256099942544/5224354917');
        });
    } else {
        onReward();
    }
}

function initializeGame(): void {
    const { pieces, colors } = generateNewPieces();
    gameState = {
        board: Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0)),
        score: 0,
        currentPieces: pieces,
        pieceColors: colors,
        usedPieces: [false, false, false],
        selectedPiece: null,
        gameOver: false,
        rewardedAdLoaded: false
    };
    
    renderBoard();
    renderPieces();
    updateScore();
    
    initializeAdMob(true).then(() => {
        showBannerAd('ca-app-pub-3940256099942544/6300978111');
        preloadRewardedAd('ca-app-pub-3940256099942544/5224354917');
    });
}

function generateNewPieces(): { pieces: PieceType[], colors: number[] } {
    const pieces: PieceType[] = [];
    const colors: number[] = [];
    for (let i = 0; i < 3; i++) {
        const randomIndex = Math.floor(Math.random() * PIECE_TEMPLATES.length);
        const colorIndex = Math.floor(Math.random() * COLORS.length);
        pieces.push(PIECE_TEMPLATES[randomIndex]);
        colors.push(colorIndex);
    }
    return { pieces, colors };
}

function renderBoard(): void {
    const boardElement = document.getElementById('gameBoard');
    if (!boardElement) return;
    
    boardElement.innerHTML = '';
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row.toString();
            cell.dataset.col = col.toString();
            
            if (gameState.board[row][col] > 0) {
                cell.classList.add('filled');
                cell.style.background = COLORS[gameState.board[row][col] - 1];
            }
            
            cell.addEventListener('click', () => handleCellClick(row, col));
            cell.addEventListener('mouseenter', () => handleCellHover(row, col));
            cell.addEventListener('mouseleave', clearHighlight);
            
            boardElement.appendChild(cell);
        }
    }
}

function renderPieces(): void {
    gameState.currentPieces.forEach((piece, index) => {
        const slotElement = document.getElementById(`piece${index}`);
        if (!slotElement) return;
        
        slotElement.innerHTML = '';
        
        if (gameState.usedPieces[index]) {
            slotElement.classList.add('used');
            return;
        }
        
        slotElement.classList.remove('used');
        
        const preview = document.createElement('div');
        preview.className = 'piece-preview';
        preview.style.gridTemplateColumns = `repeat(${piece[0].length}, 20px)`;
        
        const colorIndex = gameState.pieceColors[index];
        
        piece.forEach(row => {
            row.forEach(cell => {
                const block = document.createElement('div');
                block.className = 'piece-block';
                if (cell === 1) {
                    block.style.background = COLORS[colorIndex];
                } else {
                    block.style.background = 'transparent';
                }
                preview.appendChild(block);
            });
        });
        
        slotElement.appendChild(preview);
        slotElement.onclick = () => selectPiece(index);
    });
}

function selectPiece(index: number): void {
    if (gameState.usedPieces[index]) return;
    
    document.querySelectorAll('.piece-slot').forEach(slot => {
        slot.classList.remove('selected');
    });
    
    const slotElement = document.getElementById(`piece${index}`);
    if (slotElement) {
        slotElement.classList.add('selected');
    }
    
    gameState.selectedPiece = index;
}

function handleCellClick(row: number, col: number): void {
    if (gameState.selectedPiece === null) return;
    
    const piece = gameState.currentPieces[gameState.selectedPiece];
    
    if (isValidPlacement(row, col, piece)) {
        placePiece(row, col, piece, gameState.selectedPiece);
        gameState.usedPieces[gameState.selectedPiece] = true;
        gameState.selectedPiece = null;
        
        document.querySelectorAll('.piece-slot').forEach(slot => {
            slot.classList.remove('selected');
        });
        
        checkAndClearLines();
        renderBoard();
        renderPieces();
        updateScore();
        
        if (gameState.usedPieces.every(used => used)) {
            const { pieces, colors } = generateNewPieces();
            gameState.currentPieces = pieces;
            gameState.pieceColors = colors;
            gameState.usedPieces = [false, false, false];
            renderPieces();
        }
        
        if (checkGameOver()) {
            handleGameOver();
        }
    }
}

function handleCellHover(row: number, col: number): void {
    if (gameState.selectedPiece === null) return;
    
    const piece = gameState.currentPieces[gameState.selectedPiece];
    const valid = isValidPlacement(row, col, piece);
    
    for (let r = 0; r < piece.length; r++) {
        for (let c = 0; c < piece[r].length; c++) {
            if (piece[r][c] === 1) {
                const targetRow = row + r;
                const targetCol = col + c;
                const cell = document.querySelector(`[data-row="${targetRow}"][data-col="${targetCol}"]`);
                if (cell) {
                    cell.classList.add(valid ? 'highlight' : 'invalid');
                }
            }
        }
    }
}

function clearHighlight(): void {
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('highlight', 'invalid');
    });
}

function isValidPlacement(row: number, col: number, piece: PieceType): boolean {
    for (let r = 0; r < piece.length; r++) {
        for (let c = 0; c < piece[r].length; c++) {
            if (piece[r][c] === 1) {
                const targetRow = row + r;
                const targetCol = col + c;
                
                if (targetRow >= BOARD_SIZE || targetCol >= BOARD_SIZE) {
                    return false;
                }
                
                if (gameState.board[targetRow][targetCol] !== 0) {
                    return false;
                }
            }
        }
    }
    return true;
}

function placePiece(row: number, col: number, piece: PieceType, pieceIndex: number): void {
    const storedColorIndex = gameState.pieceColors[pieceIndex];
    const boardColorValue = storedColorIndex + 1;
    for (let r = 0; r < piece.length; r++) {
        for (let c = 0; c < piece[r].length; c++) {
            if (piece[r][c] === 1) {
                gameState.board[row + r][col + c] = boardColorValue;
            }
        }
    }
}

function checkAndClearLines(): void {
    const linesToClear: number[] = [];
    const colsToClear: number[] = [];
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        if (gameState.board[row].every(cell => cell !== 0)) {
            linesToClear.push(row);
        }
    }
    
    for (let col = 0; col < BOARD_SIZE; col++) {
        if (gameState.board.every(row => row[col] !== 0)) {
            colsToClear.push(col);
        }
    }
    
    if (linesToClear.length > 0 || colsToClear.length > 0) {
        linesToClear.forEach(row => {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                cell?.classList.add('clearing');
            }
        });
        
        colsToClear.forEach(col => {
            for (let row = 0; row < BOARD_SIZE; row++) {
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                cell?.classList.add('clearing');
            }
        });
        
        setTimeout(() => {
            linesToClear.forEach(row => {
                for (let col = 0; col < BOARD_SIZE; col++) {
                    gameState.board[row][col] = 0;
                }
            });
            
            colsToClear.forEach(col => {
                for (let row = 0; row < BOARD_SIZE; row++) {
                    gameState.board[row][col] = 0;
                }
            });
            
            const points = (linesToClear.length + colsToClear.length) * 100;
            gameState.score += points;
            
            renderBoard();
            updateScore();
        }, 500);
    }
}

function checkGameOver(): boolean {
    for (let i = 0; i < gameState.currentPieces.length; i++) {
        if (gameState.usedPieces[i]) continue;
        
        const piece = gameState.currentPieces[i];
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (isValidPlacement(row, col, piece)) {
                    return false;
                }
            }
        }
    }
    return true;
}

function handleGameOver(): void {
    gameState.gameOver = true;
    const modal = document.getElementById('gameOverModal');
    const finalScoreElement = document.getElementById('finalScore');
    const watchAdBtn = document.getElementById('watchAdBtn');
    
    if (finalScoreElement) {
        finalScoreElement.textContent = gameState.score.toString();
    }
    
    if (modal) {
        modal.classList.add('show');
    }
    
    if (watchAdBtn) {
        if (gameState.rewardedAdLoaded) {
            watchAdBtn.style.display = 'flex';
        } else {
            watchAdBtn.style.display = 'none';
        }
    }
}

function grantSecondChance(): void {
    const emptyCells: [number, number][] = [];
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (gameState.board[row][col] === 0) {
                emptyCells.push([row, col]);
            }
        }
    }
    
    const cellsToRemove = Math.min(8, gameState.board.flat().filter(cell => cell !== 0).length);
    
    for (let i = 0; i < cellsToRemove; i++) {
        let row, col;
        do {
            row = Math.floor(Math.random() * BOARD_SIZE);
            col = Math.floor(Math.random() * BOARD_SIZE);
        } while (gameState.board[row][col] === 0);
        
        gameState.board[row][col] = 0;
    }
    
    gameState.gameOver = false;
    const modal = document.getElementById('gameOverModal');
    if (modal) {
        modal.classList.remove('show');
    }
    
    renderBoard();
}

function updateScore(): void {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.textContent = gameState.score.toString();
    }
}

function restartGame(): void {
    const modal = document.getElementById('gameOverModal');
    if (modal) {
        modal.classList.remove('show');
    }
    
    initializeGame();
}

document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
    
    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) {
        restartBtn.onclick = restartGame;
    }
    
    const watchAdBtn = document.getElementById('watchAdBtn');
    if (watchAdBtn) {
        watchAdBtn.onclick = () => {
            showRewardedAd(
                () => {
                    grantSecondChance();
                },
                () => {
                    console.log('Ad failed or was closed early');
                }
            );
        };
    }
});
