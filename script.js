// --- Global Game State ---
let targetR, targetG, targetB;
let hintTimeout;
let countdownInterval;
const HINT_DELAY_SECONDS = 60; // 1 minute
const MAX_CHECKS = 5; 
let checksRemaining = MAX_CHECKS; 
let gameActive = true; 
const WIN_DIFFERENCE_THRESHOLD = 5.0; 

// --- DOM Elements ---
const targetDisplay = document.getElementById('target-display');
const guessDisplay = document.getElementById('guess-display');

const redSlider = document.getElementById('red-slider');
const greenSlider = document.getElementById('green-slider');
const blueSlider = document.getElementById('blue-slider');

const redValueSpan = document.getElementById('red-value');
const greenValueSpan = document.getElementById('green-value');
const blueValueSpan = document.getElementById('blue-value');

const checkButton = document.getElementById('check-button');
const newColorButton = document.getElementById('new-color-button');
const hintButton = document.getElementById('hint-button'); 
const countdownTimer = document.getElementById('countdown-timer'); 
const resultMessage = document.getElementById('result-message');
const checkCountDisplay = document.getElementById('check-count'); 

const adjustButtons = document.querySelectorAll('.adjust-btn'); 


// --- Functions ---

/**
 * Handles the hint logic: shows R and G values only.
 */
function getHint() {
    if (!gameActive || hintButton.classList.contains('hidden') || hintButton.disabled) return;

    // Hint shows R and G values only, B is replaced by ???
    resultMessage.textContent = `ヒント: ターゲットRGBは (${targetR}, ${targetG}, ???)`;
    resultMessage.style.color = '#fff';
    resultMessage.style.backgroundColor = '#bf616a'; 
    resultMessage.style.padding = '5px';
    
    // Disable the hint button after use (per round)
    hintButton.disabled = true;
    hintButton.textContent = 'ヒント使用済';
}

/**
 * Adjusts the slider value by +/- 1 when a button is clicked.
 */
function adjustSliderValue(channel, operation) {
    if (!gameActive) return;

    let slider;
    switch (channel) {
        case 'red': slider = redSlider; break;
        case 'green': slider = greenSlider; break;
        case 'blue': slider = blueSlider; break;
        default: return;
    }

    let currentValue = parseInt(slider.value);
    
    if (operation === 'plus' && currentValue < 255) {
        slider.value = currentValue + 1;
    } else if (operation === 'minus' && currentValue > 0) {
        slider.value = currentValue - 1;
    }

    // Manually trigger the input event to update the display
    updateGuessDisplay();
}

/**
 * Manages the countdown timer and shows the hint button.
 */
function startCountdown() {
    // Clear previous timers if any
    clearTimeout(hintTimeout);
    clearInterval(countdownInterval);
    
    hintButton.classList.add('hidden');
    hintButton.disabled = false;
    hintButton.textContent = 'ヒントを得る';
    countdownTimer.textContent = `ヒントまで残り: ${HINT_DELAY_SECONDS}秒`;

    let secondsLeft = HINT_DELAY_SECONDS;

    // Set the timeout to reveal the hint button after 60 seconds
    hintTimeout = setTimeout(() => {
        hintButton.classList.remove('hidden');
        countdownTimer.textContent = 'ヒント利用可能!';
        clearInterval(countdownInterval);
    }, HINT_DELAY_SECONDS * 1000);

    // Update the timer display every second
    countdownInterval = setInterval(() => {
        secondsLeft--;
        if (secondsLeft > 0) {
            countdownTimer.textContent = `ヒントまで残り: ${secondsLeft}秒`;
        }
    }, 1000);
}

/**
 * Generates and sets a new random target color.
 */
function setNewTargetColor() {
    // Reset game state
    gameActive = true;
    checksRemaining = MAX_CHECKS;
    checkButton.disabled = false;
    
    // Check Count Reset
    checkCountDisplay.textContent = `残りチェック回数: ${checksRemaining}`;
    checkCountDisplay.style.color = '#eceff4';

    targetR = Math.floor(Math.random() * 256);
    targetG = Math.floor(Math.random() * 256);
    targetB = Math.floor(Math.random() * 256);

    const targetColor = `rgb(${targetR}, ${targetG}, ${targetB})`;
    
    targetDisplay.style.backgroundColor = targetColor;
    
    // Reset guess to black (0, 0, 0) for the new round
    redSlider.value = 0;
    greenSlider.value = 0;
    blueSlider.value = 0;
    updateGuessDisplay();
    
    resultMessage.textContent = 'ターゲットの色を一致させてください!';
    resultMessage.style.color = '#a3be8c';
    resultMessage.style.backgroundColor = 'transparent';
    resultMessage.style.padding = '0';
    
    // Reset slider disabled state
    redSlider.disabled = false;
    greenSlider.disabled = false;
    blueSlider.disabled = false;

    // Start the countdown for the new round
    startCountdown();
}

/**
 * Updates the guess box and RGB text based on slider values.
 */
function updateGuessDisplay() {
    const r = redSlider.value;
    const g = greenSlider.value;
    const b = blueSlider.value;

    const guessColor = `rgb(${r}, ${g}, ${b})`;

    guessDisplay.style.backgroundColor = guessColor;
    
    redValueSpan.textContent = r;
    greenValueSpan.textContent = g;
    blueValueSpan.textContent = b;
}

/**
 * Compares the user's guess with the target color.
 */
function checkColorMatch() {
    if (!gameActive) return;

    // 1. Decrease Check Count
    checksRemaining--;
    checkCountDisplay.textContent = `残りチェック回数: ${checksRemaining}`;
    if (checksRemaining < 2) {
         checkCountDisplay.style.color = '#bf616a'; // Low checks warning color
    }

    const guessR = parseInt(redSlider.value);
    const guessG = parseInt(greenSlider.value);
    const guessB = parseInt(blueSlider.value);

    // Calculate difference using Euclidean distance
    const diffR = Math.abs(targetR - guessR);
    const diffG = Math.abs(targetG - guessG);
    const diffB = Math.abs(targetB - guessB);
    
    const totalDifference = Math.sqrt(diffR * diffR + diffG * diffG + diffB * diffB);

    // 2. Check for Win Condition (Total Difference < 5)
    if (totalDifference < WIN_DIFFERENCE_THRESHOLD) {
        resultMessage.textContent = `パーフェクトマッチ！ (差: ${totalDifference.toFixed(2)}) 🎉 勝利!`;
        resultMessage.style.color = '#a3be8c';
        countdownTimer.textContent = '勝者!';
        endGame(true);
        return;
    }
    
    // 3. Check for Lose Condition (Out of Checks)
    if (checksRemaining <= 0) {
        resultMessage.textContent = '敗者!! 💀 チェック回数オーバー！';
        resultMessage.style.color = '#bf616a'; // Red
        checkCountDisplay.style.color = '#bf616a';
        countdownTimer.textContent = 'ゲームオーバー';
        endGame(false);
        return;
    }
    
    // 4. Provide Feedback (No Pause)
    let message;
    let color;
    
    // Feedback logic
    if (totalDifference < 10) {
        message = 'すごい！非常に近いです!';
        color = '#8fbcbb'; 
    } else if (totalDifference < 40) {
        message = '惜しい！微調整が必要です。';
        color = '#b48ead'; 
    } else if (totalDifference < 100) {
        message = '近づいています。';
        color = '#ebcb8b'; 
    } else {
        message = '大きく外れています！スライダーを動かそう！';
        color = '#bf616a'; 
    }
    
    resultMessage.textContent = message;
    resultMessage.style.color = color;
}

/**
 * Ends the game by disabling controls and clearing timers.
 * @param {boolean} won - Whether the game was won or lost.
 */
function endGame(won) {
    gameActive = false;
    clearTimeout(hintTimeout);
    clearInterval(countdownInterval);
    
    // Disable interaction
    checkButton.disabled = true;
    redSlider.disabled = true;
    greenSlider.disabled = true;
    blueSlider.disabled = true;
    hintButton.disabled = true;
    
    if (won) {
        // Highlight the target box green
        targetDisplay.style.boxShadow = '0 0 10px #a3be8c, 8px 8px 0 #242933';
    } else {
        // Reveal the target color upon losing
        const targetColor = `rgb(${targetR}, ${targetG}, ${targetB})`;
        targetDisplay.style.backgroundColor = targetColor;
        targetDisplay.style.boxShadow = '0 0 10px #bf616a, 8px 8px 0 #242933';
    }
}


// --- Event Listeners and Initialization ---

// Update guess display whenever a slider moves
redSlider.addEventListener('input', updateGuessDisplay);
greenSlider.addEventListener('input', updateGuessDisplay);
blueSlider.addEventListener('input', updateGuessDisplay);

// Adjust buttons functionality
adjustButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        const channel = e.target.dataset.channel;
        const op = e.target.dataset.op;
        adjustSliderValue(channel, op);
    });
});


// Button clicks
checkButton.addEventListener('click', checkColorMatch);
newColorButton.addEventListener('click', setNewTargetColor);
hintButton.addEventListener('click', getHint); 

// Initialize the game
setNewTargetColor();