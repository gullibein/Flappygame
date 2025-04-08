// script.js - Corrected Howler.js Implementation

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false });

// Game Variables
let birdX = 50;
let birdY = canvas.height / 2 - 15;
let birdVelY = 0;
const gravity = 0.25;
const flapStrength = -5;
let score = 0;
let highScore = 0;
let frame = 0;
let pipes = [];
const pipeWidth = 52;
const pipeGap = 100;
const pipeSpeed = 2;
const pipeFrequency = 90;
let gameState = 'start';
let canRestart = true; 

// --- Bird Rotation Variables ---
let birdAngle = 0;
const maxUpAngle = -Math.PI / 6;
const maxDownAngle = Math.PI / 6;
const rotationLerpFactor = 0.1;

// --- Load Bird Images ---
const birdImg = new Image(); birdImg.src = 'bird.png';
const birdImgFlap = new Image(); birdImgFlap.src = 'bird2.png';
let birdWidth = 34; let birdHeight = 24;
const birdHalfWidth = birdWidth / 2;
const birdHalfHeight = birdHeight / 2;

// --- Flap Animation State ---
let isFlappingAnimation = false; let flapAnimationTimer = null;

// --- Load Pipe Images ---
const pipeTopImg = new Image(); pipeTopImg.src = 'pipe2.png';
const pipeBottomImg = new Image(); pipeBottomImg.src = 'pipe.png';

// --- Load Background Image ---
const backgroundImg = new Image(); backgroundImg.src = 'background.png';
let bgX = 0; const bgScrollSpeed = 0.5; let bgScaledWidth = canvas.width;

// --- Load Sounds using Howler.js ---
// Preload sounds for better performance
const flapSound = new Howl({
  src: ['flap.mp3', 'flap.wav'], // Provide multiple formats for compatibility
  preload: true,
  // Optional error handler within Howl config
  onloaderror: (id, err) => console.error("Failed to load flap sound:", err),
  onplayerror: (id, err) => console.warn("Could not play flap sound:", err)
});

const scoreSound = new Howl({
  src: ['coingrab.mp3', 'coingrab.wav'],
  preload: true,
  onloaderror: (id, err) => console.error("Failed to load score sound:", err),
  onplayerror: (id, err) => console.warn("Could not play score sound:", err)
});

const hitSound = new Howl({
  src: ['hit.mp3', 'hit.wav'],
  preload: true,
  onloaderror: (id, err) => console.error("Failed to load hit sound:", err),
  onplayerror: (id, err) => console.warn("Could not play hit sound:", err)
});
// --- End Howler Sounds ---

// NOTE: The bad block from lines 77-98 in the previous version has been DELETED

// --- Image Loading Check ---
let birdImgLoaded = false, birdImgFlapLoaded = false, pipeTopImgLoaded = false, pipeBottomImgLoaded = false, backgroundImgLoaded = false;

function checkStartGame() {
    // Check if all required images have attempted loading (either success or error)
    if (birdImgLoaded && birdImgFlapLoaded && pipeTopImgLoaded && pipeBottomImgLoaded && backgroundImgLoaded) {
        // This log confirms the condition was met
        console.log("[checkStartGame] All assets reported loaded (or errored).");

        // --- Calculate Background Scaled Width ---
        // Make sure backgroundImg is valid and has dimensions
        if (backgroundImg && backgroundImg.complete && backgroundImg.naturalHeight > 0) {
            const aspectRatio = backgroundImg.naturalWidth / backgroundImg.naturalHeight;
            // Calculate width needed to maintain aspect ratio when height matches canvas internal height
            bgScaledWidth = canvas.height * aspectRatio;
            console.log(`[checkStartGame] Calculated bgScaledWidth: ${bgScaledWidth.toFixed(0)}px based on aspect ratio.`);
        } else {
            // Fallback if image isn't ready or has no height (use internal canvas width)
            bgScaledWidth = canvas.width; // Default to internal game width
            console.warn("[checkStartGame] Background image not ready or invalid for aspect ratio calculation, using canvas width as bgScaledWidth.");
        }

        // Safety check: Ensure bgScaledWidth is a positive number. Fallback if not.
        if (!(bgScaledWidth > 0)) { // Checks for NaN, 0, negative
             console.error("[checkStartGame] Invalid bgScaledWidth calculated, resetting to canvas.width.");
             bgScaledWidth = canvas.width;
        }
        // --- End Calculate Background Scaled Width ---

        resetGame(); // Initialize game variables

} // --- End of checkStartGame function ---

// --- Image Load Handlers --- (Remain the same)
birdImg.onload = () => { console.log("Bird image 1 loaded."); birdImgLoaded = true; checkStartGame(); };
birdImgFlap.onload = () => { console.log("Bird image 2 (flap) loaded."); birdImgFlapLoaded = true; checkStartGame(); };
pipeTopImg.onload = () => { console.log("Pipe Top image loaded."); pipeTopImgLoaded = true; checkStartGame(); };
pipeBottomImg.onload = () => { console.log("Pipe Bottom image loaded."); pipeBottomImgLoaded = true; checkStartGame(); };
backgroundImg.onload = () => { console.log("Background image loaded."); backgroundImgLoaded = true; checkStartGame(); };
birdImg.onerror = () => { console.error("Failed to load bird image 1!"); birdImgLoaded = true; checkStartGame(); }
birdImgFlap.onerror = () => { console.error("Failed to load bird image 2 (flap)!"); birdImgFlapLoaded = true; checkStartGame(); }
pipeTopImg.onerror = () => { console.error("Failed to load Pipe Top image!"); pipeTopImgLoaded = true; checkStartGame(); }
pipeBottomImg.onerror = () => { console.error("Failed to load Pipe Bottom image!"); pipeBottomImgLoaded = true; checkStartGame(); }
backgroundImg.onerror = () => { console.error("Failed to load Background image!"); backgroundImgLoaded = true; checkStartGame(); }


// --- Game Functions ---

// The ACTUAL flap function where the sound should be played
function flap() {
    const canFlapNow = gameState === 'playing' || gameState === 'start' || (gameState === 'gameOver' && canRestart);
    console.log(`[flap] Called. Current state: ${gameState}, canRestart: ${canRestart}, canFlapNow: ${canFlapNow}`);

    if (canFlapNow) {
        if (gameState === 'start' || gameState === 'gameOver') { // This condition is now safe
            console.log(`[flap] Resetting from ${gameState}...`);
            resetGame();
            gameState = 'playing';
            console.log(`[flap] State set to: ${gameState}`);
        }
        birdVelY = flapStrength;
        isFlappingAnimation = true;
        if (flapAnimationTimer) clearTimeout(flapAnimationTimer);
        flapAnimationTimer = setTimeout(() => { isFlappingAnimation = false; }, 500);
        // Play flap sound using Howler // CORRECT PLACEMENT
        flapSound.play();
    }  else {
        console.log(`[flap] Flap ignored. gameState: ${gameState}, canRestart: ${canRestart}`);
    }
}

// The ACTUAL resetGame function
function resetGame() {
    birdX = 50;
    birdY = canvas.height / 2 - birdHeight / 2;
    birdVelY = 0;
    pipes = [];
    score = 0;
    frame = 0;
    bgX = 0;
    isFlappingAnimation = false;
    if (flapAnimationTimer) { clearTimeout(flapAnimationTimer); flapAnimationTimer = null; }
    birdAngle = 0;
    gameState = 'start';
}

// The ACTUAL update function where sounds should be played
function update() {
    // Log the state right at the beginning of update
    console.log(`[update] Entered. gameState = ${gameState}, Frame = ${frame}`); // <<< ADD THIS LOG

    if (gameState !== 'playing') {
        // If it's not 'playing', log why we are returning
        console.log(`[update] Returning because gameState is '${gameState}'`); // <<< ADD THIS LOG
        if (gameState === 'gameOver' && birdY + birdHeight < canvas.height) { }
        return;
    }

    // If we reach here, gameState MUST be 'playing'
    console.log("[update] gameState IS 'playing'. Proceeding with updates."); // <<< ADD THIS LOG

    // Background Scrolling
    if (backgroundImg.complete && bgScaledWidth > 0) {
         bgX -= bgScrollSpeed; if (bgX <= -bgScaledWidth) { bgX += bgScaledWidth; }
    }

    // Bird Physics
    birdVelY += gravity; birdY += birdVelY;

    // Bird Rotation Logic
    let targetAngle; const velocityThreshold = 0.5;
    if (birdVelY < 0) { targetAngle = maxUpAngle; }
    else if (birdVelY > velocityThreshold) { targetAngle = maxDownAngle; }
    else { targetAngle = 0; }
    birdAngle += (targetAngle - birdAngle) * rotationLerpFactor;

    // Collision Detection: Ground & Ceiling
    if (birdY + birdHeight > canvas.height || birdY < 0) {
        // --- ADD THIS CHECK vvv ---
        if (gameState !== 'gameOver') { // Only process if game isn't already over
            if(birdY < 0) birdY = 0; // Optional clamping
            if(birdY + birdHeight > canvas.height) birdY = canvas.height - birdHeight; // Optional clamping
            gameState = 'gameOver';
            canRestart = false; // Disable restart

            if (score > highScore) { highScore = score; console.log("New High Score:", highScore); }

            hitSound.play(); // Play hit sound

            // Set timer to re-enable restart
            setTimeout(() => {
                canRestart = true;
                console.log("Restart enabled after delay.");
            }, 500); // 500 milliseconds = 0.5 seconds
        }
    }

    // Pipe Management
    if (frame % pipeFrequency === 0) {
        let pipeY = Math.random() * (canvas.height - pipeGap - 150) + 75;
        pipes.push({ x: canvas.width, y: pipeY, passed: false });
    }

    // Move and Check Pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= pipeSpeed;
        const pipeTopY = pipes[i].y; const pipeBottomY = pipes[i].y + pipeGap;

        // Collision with Pipes
        const collisionBoxTopY = birdY + 2;
        if (birdX < pipes[i].x + pipeWidth && birdX + birdWidth > pipes[i].x &&
            (collisionBoxTopY < pipeTopY || birdY + birdHeight > pipeBottomY)) {
           // --- ADD THIS CHECK vvv ---
            if (gameState !== 'gameOver') { // Only process if game isn't already over
                 gameState = 'gameOver';
                 canRestart = false; // Disable restart

                 if (score > highScore) { highScore = score; console.log("New High Score:", highScore); }

                 hitSound.play(); // Play hit sound

                 // Set timer to re-enable restart
                 setTimeout(() => {
                    canRestart = true;
                    console.log("Restart enabled after delay.");
                 }, 500); // 500 milliseconds = 0.5 seconds
            }
        }

        // Score Update
        const birdCenterX = birdX + birdHalfWidth;
        const pipeHalfWidth = pipeWidth / 2; // Calculate once here
        const pipeCenterX = pipes[i].x + pipeHalfWidth;

        if (birdCenterX >= pipeCenterX && !pipes[i].passed) {
            score++;
            pipes[i].passed = true;

            // Play score sound using Howler // CORRECT PLACEMENT
            scoreSound.play();
        }

        // Remove off-screen pipes
        if (pipes[i].x + pipeWidth < 0) { pipes.splice(i, 1); }
    }

    frame++;
}

function draw() {
    // --- Draw Background ---
    if (backgroundImg.complete && bgScaledWidth > 0) {
        ctx.drawImage(backgroundImg, bgX, 0, bgScaledWidth, canvas.height);
        ctx.drawImage(backgroundImg, bgX + bgScaledWidth, 0, bgScaledWidth, canvas.height);
    } else {
        ctx.fillStyle = "#70c5ce"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // --- Draw Pipes ---
    for (let pipe of pipes) {
        if (pipeTopImg.complete) { ctx.drawImage(pipeTopImg, pipe.x, pipe.y - pipeTopImg.height, pipeWidth, pipeTopImg.height); }
        else { ctx.fillStyle = "#006400"; ctx.fillRect(pipe.x, 0, pipeWidth, pipe.y); }
        if (pipeBottomImg.complete) { ctx.drawImage(pipeBottomImg, pipe.x, pipe.y + pipeGap, pipeWidth, pipeBottomImg.height); }
        else { ctx.fillStyle = "#008000"; ctx.fillRect(pipe.x, pipe.y + pipeGap, pipeWidth, canvas.height - (pipe.y + pipeGap)); }
    }

    // --- Define which bird image to use ---
    let currentBirdImage = birdImg;
    if (!birdImg.complete && birdImgFlap.complete) { currentBirdImage = birdImgFlap; }
    if (isFlappingAnimation && birdImgFlap.complete) { currentBirdImage = birdImgFlap; }

    // --- Draw Bird (with Rotation) ---
    if (currentBirdImage && currentBirdImage.complete) {
        ctx.save();
        const birdCenterX = birdX + birdHalfWidth; const birdCenterY = birdY + birdHalfHeight;
        ctx.translate(birdCenterX, birdCenterY); ctx.rotate(birdAngle);
        ctx.drawImage(currentBirdImage, -birdHalfWidth, -birdHalfHeight, birdWidth, birdHeight);
        ctx.restore();
    } else {
        ctx.fillStyle = 'yellow'; ctx.fillRect(birdX, birdY, birdWidth, birdHeight);
    }

    // --- Draw Score --- (Yellow, New Font)
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFF00";
    ctx.font = "16px 'Press Start 2P'";
    ctx.fillText(score, canvas.width / 2, 40);

    // --- Draw Messages ---
    if (gameState === 'start') {
        // Style for start message
        ctx.fillStyle = "#000000"; // Black text
        ctx.font = "14px 'Press Start 2P'";
        ctx.fillText("Ýtið til að byrja", canvas.width / 2, canvas.height / 2 - 20); // Icelandic

    } else if (gameState === 'gameOver') {
        // Style for "Game Over!" text (Red, New Font)
        ctx.fillStyle = "#FF0000"; // Red color
        ctx.font = "20px 'Press Start 2P'";
        ctx.fillText("Búið spil!", canvas.width / 2, canvas.height / 2 - 40); // Icelandic

        // Reset styles for score/retry text
        ctx.fillStyle = "#000000"; // Black text
        ctx.font = "14px 'Press Start 2P'";
        // Final score
        ctx.fillText(score+" stig", canvas.width / 2, canvas.height / 2 + 0); // Icelandic
        // High Score
        ctx.fillText(`Besta tilraun: ${highScore}`, canvas.width / 2, canvas.height / 2 + 25); // Icelandic
    }
    ctx.textAlign = "start"; // Reset alignment
}

// The ACTUAL gameLoop function
function gameLoop() {
    console.log("[gameLoop] Entered loop."); // Log entry
    console.log("[gameLoop] Calling update...");
    update();
    console.log("[gameLoop] Calling draw...");
    draw();
    console.log("[gameLoop] Requesting next frame...");
    requestAnimationFrame(gameLoop);
}

// --- Event Listeners --- (Remain the same)
window.addEventListener('keydown', function(e) { if (e.code === 'Space') { e.preventDefault(); flap(); } });
canvas.addEventListener('mousedown', flap);
canvas.addEventListener('touchstart', function(e) { e.preventDefault(); flap(); });

// --- Start Game --- (Remains the same)
resetGame();
draw(); // Initial draw while images load

// --- Scaling Logic --- (Remains the same)
const gameWidth = 320; const gameHeight = 480;
function resizeGame() {
    const canvas = document.getElementById('gameCanvas');
    // ... (null check for canvas is good practice)
    if (!canvas) {
        console.error("!!! Canvas element not found for resizing!");
        return;
    }

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const windowRatio = windowWidth / windowHeight;
    // Make sure gameWidth and gameHeight are accessible here (should be global)
    const gameRatio = gameWidth / gameHeight;

    let newWidth = gameWidth;
    let newHeight = gameHeight;

    if (windowRatio > gameRatio) {
        newHeight = windowHeight;
        newWidth = newHeight * gameRatio;
    } else {
        newWidth = windowWidth;
        newHeight = newWidth / gameRatio;
    }

    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;

    // >>> THIS IS THE CRITICAL LINE <<<
    canvas.style.visibility = 'visible';

    console.log(`Resized canvas style to: ${newWidth.toFixed(0)}px x ${newHeight.toFixed(0)}px. Visibility set to visible.`); // Added visibility confirmation
}

// Make sure these listeners are active at the end of the script
window.addEventListener('load', resizeGame);
window.addEventListener('resize', resizeGame);
window.addEventListener('load', resizeGame);
window.addEventListener('resize', resizeGame);
