// Game Configuration
const DIFFICULTIES = {
    EASY: { digits: 4, min: 1, max: 6, attempts: 12, label: 'Easy Mode' },
    NORMAL: { digits: 4, min: 1, max: 8, attempts: 10, label: 'Normal Mode' },
    HARD: { digits: 5, min: 1, max: 9, attempts: 8, label: 'Hard Mode' }
};

// Game State
let currentState = {
    difficulty: DIFFICULTIES.NORMAL,
    inputMode: 'TEXT',
    secretCode: [],
    attemptsLeft: 0,
    history: [],
    isPlaying: false,
    isPaused: false
};

// Speech Synthesis & Recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
}
const synth = window.speechSynthesis;

// DOM Elements
const els = {
    setupScreen: document.getElementById('setup-screen'),
    playScreen: document.getElementById('play-screen'),
    endScreen: document.getElementById('end-screen'),
    pauseScreen: document.getElementById('pause-screen'),
    rulesModal: document.getElementById('rules-modal'),

    btnRules: document.getElementById('btn-rules'),
    btnStart: document.getElementById('btn-start'),
    diffBtns: document.querySelectorAll('.diff-btn'),
    modeBtns: document.querySelectorAll('.mode-btn'),
    closeRules: document.getElementById('close-rules'),

    currentDiff: document.getElementById('current-diff'),
    attemptsLeft: document.getElementById('attempts-left'),
    maxAttempts: document.getElementById('max-attempts'),
    hostMessage: document.getElementById('host-message'),

    guessInput: document.getElementById('guess-input'),
    btnSubmit: document.getElementById('btn-submit'),
    btnVoice: document.getElementById('btn-voice'),
    btnPause: document.getElementById('btn-pause'),
    btnResume: document.getElementById('btn-resume'),
    btnGiveUp: document.getElementById('btn-giveup'),
    guessHistory: document.getElementById('guess-history'),

    endResultCard: document.getElementById('end-result-card'),
    endIcon: document.getElementById('end-icon'),
    endTitle: document.getElementById('end-title'),
    endMessage: document.getElementById('end-message'),
    revealedCode: document.getElementById('revealed-code'),
    btnRestart: document.getElementById('btn-restart')
};

// Event Listeners Initialization
function init() {
    els.btnRules.addEventListener('click', () => toggleModal(true));
    els.closeRules.addEventListener('click', () => toggleModal(false));

    els.diffBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            els.diffBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentState.difficulty = DIFFICULTIES[e.currentTarget.dataset.diff];
        });
    });

    els.modeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            els.modeBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentState.inputMode = e.currentTarget.dataset.mode;
        });
    });

    els.btnStart.addEventListener('click', startGame);

    els.btnSubmit.addEventListener('click', handleGuessSubmit);
    els.guessInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleGuessSubmit();
    });

    if (recognition) {
        els.btnVoice.addEventListener('click', toggleVoiceRecognition);
        recognition.onresult = handleVoiceResult;
        recognition.onerror = handleVoiceError;
        recognition.onend = handleVoiceEnd;
    } else {
        els.btnVoice.style.display = 'none'; // Hide if not supported
    }

    els.btnPause.addEventListener('click', pauseGame);
    els.btnResume.addEventListener('click', resumeGame);
    els.btnGiveUp.addEventListener('click', () => endGame(false, true));
    els.btnRestart.addEventListener('click', resetToSetup);
}

function toggleModal(show) {
    if (show) els.rulesModal.classList.add('active');
    else els.rulesModal.classList.remove('active');
}

// Game Core Logic
function startGame() {
    currentState.isPlaying = true;
    currentState.isPaused = false;
    currentState.attemptsLeft = currentState.difficulty.attempts;
    currentState.history = [];
    currentState.secretCode = generateCode(currentState.difficulty);

    // UI Update
    els.setupScreen.classList.add('hidden');
    els.playScreen.classList.remove('hidden');
    els.guessHistory.innerHTML = '';
    els.guessInput.value = '';

    els.currentDiff.textContent = currentState.difficulty.label;
    els.maxAttempts.textContent = currentState.difficulty.attempts;
    updateAttemptsUI();

    speakAndShow(`Welcome to ${currentState.difficulty.label}! I've got my secret code. What's your first guess?`);
}

function generateCode(diff) {
    let code = [];
    while (code.length < diff.digits) {
        let r = Math.floor(Math.random() * (diff.max - diff.min + 1)) + diff.min;
        if (code.indexOf(r) === -1) code.push(r);
    }
    return code;
}

// Input Handling
function handleGuessSubmit() {
    if (!currentState.isPlaying || currentState.isPaused) return;
    let rawInput = els.guessInput.value;
    processGuess(rawInput);
}

function processGuess(rawInput) {
    let guessStr = rawInput.replace(/[^0-9]/g, '');
    let diff = currentState.difficulty;

    // Validation
    if (guessStr.length !== diff.digits) {
        showError(`I need exactly ${diff.digits} digits! You gave me ${guessStr.length > 0 ? guessStr.length : 'none'}. Try again.`);
        return;
    }

    let guessArr = guessStr.split('').map(Number);
    let uniqueDigits = new Set(guessArr);

    if (uniqueDigits.size !== guessArr.length) {
        showError("Oops! Each digit must be unique. Try again!");
        return;
    }

    for (let d of guessArr) {
        if (d < diff.min || d > diff.max) {
            showError(`Digits must be between ${diff.min} and ${diff.max}! Give it another go.`);
            return;
        }
    }

    // Valid Guess Processing
    currentState.attemptsLeft--;
    updateAttemptsUI();
    els.guessInput.value = '';

    let result = calculateGreensAndBlues(guessArr, currentState.secretCode);
    addHistoryItem(guessStr, result.greens, result.blues);

    if (result.greens === diff.digits) {
        endGame(true);
    } else if (currentState.attemptsLeft === 0) {
        endGame(false);
    } else {
        const responses = [
            `That's ${result.greens} Greens and ${result.blues} Blues! Keep trying!`,
            `Getting warmer! ${result.greens} Greens, ${result.blues} Blues.`,
            `Interesting choice! You got ${result.greens} Greens and ${result.blues} Blues.`,
            `${result.greens} Greens and ${result.blues} Blues. What's your next move?`
        ];
        let msg = responses[Math.floor(Math.random() * responses.length)];
        speakAndShow(msg);
    }
}

function calculateGreensAndBlues(guess, secret) {
    let greens = 0;
    let blues = 0;
    for (let i = 0; i < guess.length; i++) {
        if (guess[i] === secret[i]) {
            greens++;
        } else if (secret.includes(guess[i])) {
            blues++;
        }
    }
    return { greens, blues };
}

function addHistoryItem(guessStr, greens, blues) {
    const item = document.createElement('div');
    item.className = 'history-item';
    let guessNum = currentState.difficulty.attempts - currentState.attemptsLeft;
    item.innerHTML = `
        <div class="history-header"><span>Guess #${guessNum}</span></div>
        <div class="history-guess">${guessStr.split('').join(' ')}</div>
        <div class="history-result">
            <span class="greens-count">🟢 ${greens} Greens</span>
            <span class="blues-count">🔵 ${blues} Blues</span>
        </div>
    `;
    els.guessHistory.prepend(item);
}

function showError(msg) {
    els.guessInput.classList.add('shake');
    setTimeout(() => els.guessInput.classList.remove('shake'), 500);
    speakAndShow(msg);
}

// End Game
function endGame(isWin, gaveUp = false) {
    currentState.isPlaying = false;
    currentState.isPaused = false;
    els.playScreen.classList.add('hidden');
    els.endScreen.classList.remove('hidden');
    els.pauseScreen.classList.add('hidden'); // Ensure pause is hidden

    if (recognition && currentState.inputMode === 'VOICE') {
        try { recognition.abort(); } catch (e) { }
    }

    let secretStr = currentState.secretCode.join('');
    els.revealedCode.innerHTML = '';
    currentState.secretCode.forEach(d => {
        let div = document.createElement('div');
        div.className = 'digit';
        div.textContent = d;
        els.revealedCode.appendChild(div);
    });

    if (isWin) {
        els.endIcon.textContent = '🎉';
        els.endTitle.textContent = 'You Win!';
        els.endTitle.className = 'win';
        let attemptsUsed = currentState.difficulty.attempts - currentState.attemptsLeft;
        let msg = `INCREDIBLE! You cracked the code! ${secretStr.split('').join(' ')} was the secret! You're a true CodeMaster! Want to play again?`;
        els.endMessage.textContent = `Solved in ${attemptsUsed} attempt(s)!`;
        speakAndShow(msg, false); // Audio only, UI has its own text
    } else {
        els.endIcon.textContent = '💀';
        els.endTitle.textContent = 'Game Over';
        els.endTitle.className = 'loss';
        els.endMessage.textContent = gaveUp ? "You gave up!" : "No attempts left!";
        let msg = `Oh no! The secret code was ${secretStr.split('').join(' ')}. Better luck next time! Fancy another round?`;
        speakAndShow(msg, false);
    }
}

// Pause Logic
function pauseGame() {
    if (!currentState.isPlaying || currentState.isPaused) return;
    currentState.isPaused = true;

    // Stop voice listening
    if (recognition && currentState.inputMode === 'VOICE') {
        try { recognition.abort(); } catch (e) { }
        els.btnVoice.classList.remove('listening');
    }

    // Show overlay
    els.pauseScreen.classList.remove('hidden');
}

function resumeGame() {
    if (!currentState.isPlaying || !currentState.isPaused) return;
    currentState.isPaused = false;

    // Hide overlay
    els.pauseScreen.classList.add('hidden');

    // Restart voice listening if needed
    if (currentState.inputMode === 'VOICE' && recognition && !synth.speaking) {
        try {
            recognition.start();
            els.btnVoice.classList.add('listening');
            els.guessInput.placeholder = "Listening...";
        } catch (e) { }
    }
}

function resetToSetup() {
    els.endScreen.classList.add('hidden');
    els.setupScreen.classList.remove('hidden');
    speakAndShow("Welcome back! Are you ready for a new challenge?", false);
}

// UI Helpers
function updateAttemptsUI() {
    els.attemptsLeft.textContent = currentState.attemptsLeft;
    if (currentState.attemptsLeft <= 3) {
        els.attemptsLeft.style.color = 'var(--danger)';
    } else {
        els.attemptsLeft.style.color = '#fff';
    }
}

function speakAndShow(text, updateUI = true) {
    if (updateUI) {
        els.hostMessage.textContent = text;
        // Small pop animation
        els.hostMessage.style.transform = 'scale(1.02)';
        setTimeout(() => els.hostMessage.style.transform = 'scale(1)', 200);
    }

    // Stop any ongoing speech
    synth.cancel();
    let utterance = new SpeechSynthesisUtterance(text);

    // Coordinate with Voice Recognition so it doesn't hear the synthesis
    utterance.onstart = () => {
        if (recognition && currentState.inputMode === 'VOICE') {
            try { recognition.abort(); } catch (e) { }
            els.btnVoice.classList.remove('listening');
        }
    };

    utterance.onend = () => {
        if (currentState.isPlaying && currentState.inputMode === 'VOICE' && recognition) {
            try {
                recognition.start();
                els.btnVoice.classList.add('listening');
                els.guessInput.placeholder = "Listening...";
            } catch (e) { console.error(e); }
        }
    };

    // Try to find a good English voice
    let voices = synth.getVoices();
    let preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('en')) ||
        voices.find(v => v.lang === 'en-US');
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.pitch = 1.1; // Slightly enthusiastic
    utterance.rate = 1.05;
    synth.speak(utterance);
}

// Ensure voices are loaded
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = () => synth.getVoices();
}

// Voice Recognition Handlers
const NUMBER_WORDS = {
    'zero': 0, 'one': 1, 'two': 2, 'to': 2, 'too': 2, 'three': 3, 'four': 4, 'for': 4,
    'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9
};

function toggleVoiceRecognition() {
    if (!recognition) return;

    // Manual toggle logic
    if (els.btnVoice.classList.contains('listening')) {
        recognition.stop();
        els.btnVoice.classList.remove('listening');
        // If they manually stop, maybe they want to switch to text?
    } else {
        try {
            recognition.start();
            els.btnVoice.classList.add('listening');
            els.guessInput.placeholder = "Listening...";
        } catch (e) {
            console.error("Speech recognition error:", e);
        }
    }
}

function handleVoiceEnd() {
    els.btnVoice.classList.remove('listening');
    els.guessInput.placeholder = "Enter your guess (e.g. 3 7 1 5)";

    // Automatically restart if in VOICE mode, game is playing, NOT paused, and host isn't speaking
    if (currentState.isPlaying && !currentState.isPaused && currentState.inputMode === 'VOICE' && !synth.speaking) {
        try {
            recognition.start();
            els.btnVoice.classList.add('listening');
            els.guessInput.placeholder = "Listening...";
        } catch (e) { }
    }
}

function handleVoiceResult(event) {
    els.btnVoice.classList.remove('listening');
    els.guessInput.placeholder = "Enter your guess (e.g. 3 7 1 5)";

    let transcript = event.results[0][0].transcript.toLowerCase();
    console.log("Heard:", transcript);

    // Check for special commands
    if (transcript.includes('give up') || transcript.includes('reveal') || transcript.includes('quit')) {
        endGame(false, true);
        return;
    }

    if (transcript.includes('rule') || transcript.includes('how to play') || transcript.includes('help')) {
        toggleModal(true);
        speakAndShow("Here are the rules!");
        return;
    }

    // Convert words to digits and extract numbers
    let words = transcript.split(/[\s\-]+/);
    let parsedDigits = [];

    for (let word of words) {
        // Direct number match
        let numMatch = word.match(/\d/g);
        if (numMatch) {
            parsedDigits.push(...numMatch);
        } else if (NUMBER_WORDS.hasOwnProperty(word)) {
            parsedDigits.push(NUMBER_WORDS[word]);
        }
    }

    let guessStr = parsedDigits.join('');

    // Process exactly required digits if available
    let diff = currentState.difficulty;

    if (guessStr.length === diff.digits) {
        els.guessInput.value = guessStr;
        processGuess(guessStr);
    } else if (guessStr.length > diff.digits) {
        // Assume the last N digits are the guess (e.g. "my guess is 1 2 3 4") 
        // works well because people say filler words with numbers occasionally.
        let finalStr = guessStr.slice(-diff.digits);
        els.guessInput.value = finalStr;
        processGuess(finalStr);
    } else if (guessStr.length > 0) {
        speakAndShow(`You said ${guessStr.split('').join(' ')}, but I need exactly ${diff.digits} digits. Try again!`);
    } else {
        speakAndShow("Sorry, I didn't catch any numbers! Could you repeat your guess?");
    }
}

function handleVoiceError(event) {
    els.btnVoice.classList.remove('listening');
    els.guessInput.placeholder = "Enter your guess (e.g. 3 7 1 5)";
    if (event.error !== 'no-speech') {
        speakAndShow("Sorry, my microphone access had a hiccup! You can always type your guess.");
    }
}

// Start
document.addEventListener('DOMContentLoaded', init);
