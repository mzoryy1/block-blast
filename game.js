const BOARD_SIZE = 8;
const COLORS = [
    '#3b82f6', '#8b5cf6', '#ec4899',
    '#f59e0b', '#10b981', '#06b6d4'
];
const PIECE_TEMPLATES = [
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

let gameState;
let dragState = {
    isDragging: false,
    pieceIndex: null,
    offsetX: 0,
    offsetY: 0
};

function getLeaderboard() {
    const stored = localStorage.getItem('blockBlastLeaderboard');
    return stored ? JSON.parse(stored) : [];
}

function saveScore(score) {
    const leaderboard = getLeaderboard();
    leaderboard.push(score);
    leaderboard.sort((a, b) => b - a);
    const top5 = leaderboard.slice(0, 5);
    localStorage.setItem('blockBlastLeaderboard', JSON.stringify(top5));
    return top5;
}

function displayLeaderboard() {
    const leaderboard = getLeaderboard();
    const listElement = document.getElementById('leaderboardList');
    
    if (leaderboard.length === 0) {
        listElement.innerHTML = '<div class="leaderboard-empty">No scores yet. Play to set a record!</div>';
    } else {
        listElement.innerHTML = leaderboard.map((score, index) => `
            <div class="leaderboard-item">
                <div class="leaderboard-rank">#${index + 1}</div>
                <div class="leaderboard-score">${score}</div>
            </div>
        `).join('');
    }
}

function showHomeScreen() {
    document.getElementById('homeScreen').style.display = 'block';
    document.getElementById('gameScreen').style.display = 'none';
    hideBannerAd();
    displayLeaderboard();
}

function showGameScreen() {
    document.getElementById('homeScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';
    initializeGame();
}

function getHelpStatus() {
    const lastUsed = localStorage.getItem('lastHelpUsed');
    if (!lastUsed) return { available: true, cooldown: false };
    
    const lastUsedTime = parseInt(lastUsed);
    const now = Date.now();
    const hoursPassed = (now - lastUsedTime) / (1000 * 60 * 60);
    
    if (hoursPassed >= 24) {
        return { available: true, cooldown: false };
    } else {
        const hoursLeft = Math.ceil(24 - hoursPassed);
        return { available: false, cooldown: true, hoursLeft };
    }
}

function updateHelpButton() {
    const helpBtn = document.getElementById('helpBtn');
    const helpStatus = document.getElementById('helpStatus');
    const status = getHelpStatus();
    
    helpBtn.classList.remove('cooldown', 'ad-required');
    
    if (status.available) {
        helpStatus.textContent = 'Help (Free)';
        helpBtn.classList.add('available');
    } else if (status.cooldown) {
        helpStatus.textContent = `Help (${status.hoursLeft}h)`;
        helpBtn.classList.add('cooldown');
    }
}

function useHelp() {
    const status = getHelpStatus();
    
    if (status.available) {
        localStorage.setItem('lastHelpUsed', Date.now().toString());
        grantHelp();
        updateHelpButton();
    } else {
        showRewardedAd(() => {
            grantHelp();
        }, () => {
            console.log('Ad failed or was closed early');
        });
    }
}

function grantHelp() {
    const filledCells = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (gameState.board[row][col] !== 0) {
                filledCells.push([row, col]);
            }
        }
    }
    
    const cellsToRemove = Math.min(5, filledCells.length);
    for (let i = 0; i < cellsToRemove; i++) {
        const randomIndex = Math.floor(Math.random() * filledCells.length);
        const [row, col] = filledCells[randomIndex];
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.classList.add('exploding');
        }
        filledCells.splice(randomIndex, 1);
    }
    
    setTimeout(() => {
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (cell && cell.classList.contains('exploding')) {
                    gameState.board[row][col] = 0;
                    cell.classList.remove('exploding');
                }
            }
        }
        renderBoard();
    }, 250);
}

function initializeAdMob(testing) {
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

function showBannerAd(adUnitId) {
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

function hideBannerAd() {
    const banner = document.getElementById('adBanner');
    if (banner) {
        banner.classList.remove('show');
    }
    
    if (typeof AdMob !== 'undefined') {
        AdMob.removeBanner();
    }
}

function preloadRewardedAd(adUnitId) {
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

function showRewardedAd(onReward, onFailure) {
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

function initializeGame() {
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
    updateHelpButton();
    
    initializeAdMob(true).then(() => {
        showBannerAd('ca-app-pub-3940256099942544/6300978111');
        preloadRewardedAd('ca-app-pub-3940256099942544/5224354917');
    });
}

function generateNewPieces() {
    const pieces = [];
    const colors = [];
    for (let i = 0; i < 3; i++) {
        const randomIndex = Math.floor(Math.random() * PIECE_TEMPLATES.length);
        const colorIndex = Math.floor(Math.random() * COLORS.length);
        pieces.push(PIECE_TEMPLATES[randomIndex]);
        colors.push(colorIndex);
    }
    return { pieces, colors };
}

function renderBoard() {
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
            
            cell.addEventListener('touchstart', (e) => {
                e.preventDefault();
                handleCellTouch(row, col);
            });
            
            boardElement.appendChild(cell);
        }
    }
}

function renderPieces() {
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
        
        slotElement.onmousedown = (e) => startDrag(index, e);
        slotElement.ontouchstart = (e) => {
            e.preventDefault();
            startDrag(index, e.touches[0]);
        };
    });
}

function startDrag(pieceIndex, event) {
    if (gameState.usedPieces[pieceIndex]) return;
    
    dragState.isDragging = true;
    dragState.pieceIndex = pieceIndex;
    gameState.selectedPiece = pieceIndex;
    
    const preview = document.getElementById('dragPreview');
    const piece = gameState.currentPieces[pieceIndex];
    const colorIndex = gameState.pieceColors[pieceIndex];
    
    preview.innerHTML = '';
    const piecePreview = document.createElement('div');
    piecePreview.className = 'piece-preview';
    piecePreview.style.gridTemplateColumns = `repeat(${piece[0].length}, 20px)`;
    
    piece.forEach(row => {
        row.forEach(cell => {
            const block = document.createElement('div');
            block.className = 'piece-block';
            if (cell === 1) {
                block.style.background = COLORS[colorIndex];
            } else {
                block.style.background = 'transparent';
            }
            piecePreview.appendChild(block);
        });
    });
    
    preview.appendChild(piecePreview);
    preview.classList.add('active');
    
    updateDragPreview(event.clientX, event.clientY);
    
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleDragEnd);
}

function handleDragMove(e) {
    if (!dragState.isDragging) return;
    updateDragPreview(e.clientX, e.clientY);
}

function handleTouchMove(e) {
    if (!dragState.isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    updateDragPreview(touch.clientX, touch.clientY);
    
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element && element.classList.contains('cell')) {
        const row = parseInt(element.dataset.row);
        const col = parseInt(element.dataset.col);
        handleCellHover(row, col);
    }
}

function updateDragPreview(x, y) {
    const preview = document.getElementById('dragPreview');
    preview.style.left = (x - 30) + 'px';
    preview.style.top = (y - 30) + 'px';
}

function handleDragEnd(e) {
    if (!dragState.isDragging) return;
    
    const clientX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX);
    const clientY = e.clientY || (e.changedTouches && e.changedTouches[0].clientY);
    
    const element = document.elementFromPoint(clientX, clientY);
    
    if (element && element.classList.contains('cell')) {
        const row = parseInt(element.dataset.row);
        const col = parseInt(element.dataset.col);
        handleCellClick(row, col);
    }
    
    dragState.isDragging = false;
    dragState.pieceIndex = null;
    
    const preview = document.getElementById('dragPreview');
    preview.classList.remove('active');
    
    clearHighlight();
    
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleDragEnd);
}

function selectPiece(index) {
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

function handleCellClick(row, col) {
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

function handleCellTouch(row, col) {
    if (dragState.isDragging) return;
    handleCellClick(row, col);
}

function handleCellHover(row, col) {
    if (gameState.selectedPiece === null) return;
    
    clearHighlight();
    
    const piece = gameState.currentPieces[gameState.selectedPiece];
    const valid = isValidPlacement(row, col, piece);
    
    for (let r = 0; r < piece.length; r++) {
        for (let c = 0; c < piece[r].length; c++) {
            if (piece[r][c] === 1) {
                const targetRow = row + r;
                const targetCol = col + c;
                const cell = document.querySelector(`[data-row="${targetRow}"][data-col="${targetCol}"]`);
                if (cell) {
                    cell.classList.add(valid ? 'drag-highlight' : 'drag-invalid');
                }
            }
        }
    }
}

function clearHighlight() {
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('highlight', 'invalid', 'drag-highlight', 'drag-invalid');
    });
}

function isValidPlacement(row, col, piece) {
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

function placePiece(row, col, piece, pieceIndex) {
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

function checkAndClearLines() {
    const linesToClear = [];
    const colsToClear = [];
    
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
        const cellsToAnimate = [];
        
        linesToClear.forEach(row => {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (cell) {
                    cell.classList.add('exploding');
                    cellsToAnimate.push(cell);
                }
            }
        });
        
        colsToClear.forEach(col => {
            for (let row = 0; row < BOARD_SIZE; row++) {
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (cell && !cell.classList.contains('exploding')) {
                    cell.classList.add('exploding');
                    cellsToAnimate.push(cell);
                }
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
            
            const totalLinesCleared = linesToClear.length + colsToClear.length;
            const multiplier = totalLinesCleared;
            const points = totalLinesCleared * 100 * multiplier;
            gameState.score += points;
            
            renderBoard();
            updateScore();
        }, 250);
    }
}

function checkGameOver() {
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

function handleGameOver() {
    gameState.gameOver = true;
    saveScore(gameState.score);
    
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

function grantSecondChance() {
    const filledCells = gameState.board.flat().filter(cell => cell !== 0).length;
    const cellsToRemove = Math.min(Math.floor(filledCells * 0.5), 25);
    
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

function updateScore() {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.textContent = gameState.score.toString();
    }
}

function restartGame() {
    const modal = document.getElementById('gameOverModal');
    if (modal) {
        modal.classList.remove('show');
    }
    
    const filledCells = gameState.board.flat().filter(cell => cell !== 0).length;
    const cellsToRemove = Math.min(Math.floor(filledCells * 0.4), 20);
    
    for (let i = 0; i < cellsToRemove; i++) {
        let row, col;
        do {
            row = Math.floor(Math.random() * BOARD_SIZE);
            col = Math.floor(Math.random() * BOARD_SIZE);
        } while (gameState.board[row][col] === 0);
        
        gameState.board[row][col] = 0;
    }
    
    const { pieces, colors } = generateNewPieces();
    gameState.currentPieces = pieces;
    gameState.pieceColors = colors;
    gameState.usedPieces = [false, false, false];
    gameState.selectedPiece = null;
    gameState.gameOver = false;
    
    renderBoard();
    renderPieces();
}

document.addEventListener('DOMContentLoaded', () => {
    showHomeScreen();
    
    const playBtn = document.getElementById('playBtn');
    if (playBtn) {
        playBtn.onclick = showGameScreen;
    }
    
    const backToHomeBtn = document.getElementById('backToHomeBtn');
    if (backToHomeBtn) {
        backToHomeBtn.onclick = showHomeScreen;
    }
    
    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) {
        restartBtn.onclick = restartGame;
    }
    
    const homeBtn = document.getElementById('homeBtn');
    if (homeBtn) {
        homeBtn.onclick = showHomeScreen;
    }
    
    const watchAdBtn = document.getElementById('watchAdBtn');
    if (watchAdBtn) {
        watchAdBtn.onclick = () => {
            showRewardedAd(() => {
                grantSecondChance();
            }, () => {
                console.log('Ad failed or was closed early');
            });
        };
    }
    
    const helpBtn = document.getElementById('helpBtn');
    if (helpBtn) {
        helpBtn.onclick = useHelp;
    }
});
