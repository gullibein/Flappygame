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
    // Check remains the same, logic depends only on images
    if (birdImgLoaded && birdImgFlapLoaded && pipeTopImgLoaded && pipeBottomImgLoaded && backgroundImgLoaded) {
        console.log("All game images loaded successfully!");
        if (backgroundImg.naturalHeight > 0) {
            const aspectRatio = backgroundImg.naturalWidth / backgroundImg.naturalHeight;
            bgScaledWidth = canvas.height * aspectRatio;
        } else { bgScaledWidth = backgroundImg.naturalWidth || canvas.width; }
        if (bgScaledWidth < canvas.width) { bgScaledWidth = canvas.width; }
        resetGame();
        gameLoop();
    }
}

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
    const canFlap = gameState === 'playing' || gameState === 'start' || gameState === 'gameOver';
    if (canFlap) {
        if (gameState === 'start' || gameState === 'gameOver') {
            resetGame();
            gameState = 'playing';
        }
        birdVelY = flapStrength;
        isFlappingAnimation = true;
        if (flapAnimationTimer) clearTimeout(flapAnimationTimer);
        flapAnimationTimer = setTimeout(() => { isFlappingAnimation = false; }, 500);

        // Play flap sound using Howler // CORRECT PLACEMENT
        flapSound.play();
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
    if (gameState !== 'playing') {
         if (gameState === 'gameOver' && birdY + birdHeight < canvas.height) { }
        return;
    }

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
        if(birdY < 0) birdY = 0;
        if(birdY + birdHeight > canvas.height) birdY = canvas.height - birdHeight;
        gameState = 'gameOver';

        if (score > highScore) { highScore = score; console.log("New High Score:", highScore); }

        // Play hit sound using Howler // CORRECT PLACEMENT
        hitSound.play();

        return;
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
            gameState = 'gameOver';

            if (score > highScore) { highScore = score; console.log("New High Score:", highScore); }

            // Play hit sound using Howler // CORRECT PLACEMENT
            hitSound.play();

            return;
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

// The ACTUAL draw function
function draw() {
    // --- Draw Background ---
    if (backgroundImg.complete && bgScaledWidth > 0) {
        ctx.drawImage(backgroundImg, bgX, 0, bgScaledWidth, canvas.height);
        ctx.drawImage(backgroundImg, bgX + bgScaledWidth, 0, bgScaledWidth, canvas.height);
    } else { ctx.fillStyle = "#70c5ce"; ctx.fillRect(0, 0, canvas.width, canvas.height); }

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
    } else { ctx.fillStyle = 'yellow'; ctx.fillRect(birdX, birdY, birdWidth, birdHeight); }

    // --- Draw Score --- (Yellow, New Font)
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFF00";
    ctx.font = "16px 'Press Start 2P'";
    ctx.fillText(score, canvas.width / 2, 40);

    // --- Draw Messages ---
    if (gameState === 'start') {
        ctx.fillStyle = "#000000"; // Black text
        ctx.font = "14px 'Press Start 2P'";
        ctx.fillText("Ýtið til að byrja", canvas.width / 2, canvas.height / 2 - 20); // Your Icelandic text

    } else if (gameState === 'gameOver') {
        // "Game Over!" text
        ctx.fillStyle = "#FF0000"; // Red color
        ctx.font = "20px 'Press Start 2P'";
        ctx.fillText("Búið spil!", canvas.width / 2, canvas.height / 2 - 40); // Your Icelandic text

        // Reset styles for score/retry text
        ctx.fillStyle = "#000000"; // Black text
        ctx.font = "14px 'Press Start 2P'";
        // Final score
        ctx.fillText(score+" stig", canvas.width / 2, canvas.height / 2 + 0); // Your Icelandic text
        // High Score
        ctx.fillText(`Besta tilraun: ${highScore}`, canvas.width / 2, canvas.height / 2 + 25); // Your Icelandic text
        // Retry text - (Assuming you want English, otherwise translate)
        ctx.fillText("Click or Space to Retry", canvas.width / 2, canvas.height / 2 + 55);
    }
    ctx.textAlign = "start"; // Reset alignment
}

// The ACTUAL gameLoop function
function gameLoop() {
    update();
    draw();
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
function resizeGame() { /* ... */ }
window.addEventListener('load', resizeGame);
window.addEventListener('resize', resizeGame);