// script.js - Complete version with Bird Rotation and Sounds

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Variables
// ... (keep existing variables)
let birdX = 50;
let birdY = canvas.height / 2 - 15;
let birdVelY = 0;
const gravity = 0.25;
const flapStrength = -5;
let score = 0;
let frame = 0;
let pipes = [];
const pipeWidth = 52;
const pipeGap = 100;
const pipeSpeed = 2;
const pipeFrequency = 90;
let gameState = 'start';

// --- Bird Rotation Variables ---
let birdAngle = 0;
const maxUpAngle = -Math.PI / 6; // Using approx 30 degrees based on last adjustment
const maxDownAngle = Math.PI / 6;
const rotationLerpFactor = 0.1;

// --- Load Bird Images ---
const birdImg = new Image(); birdImg.src = 'bird.png';
const birdImgFlap = new Image(); birdImgFlap.src = 'bird2.png';
let birdWidth = 34; let birdHeight = 24;

// --- Flap Animation State ---
let isFlappingAnimation = false; let flapAnimationTimer = null;

// --- Load Pipe Images ---
const pipeTopImg = new Image(); pipeTopImg.src = 'pipe2.png';
const pipeBottomImg = new Image(); pipeBottomImg.src = 'pipe.png';

// --- Load Background Image ---
const backgroundImg = new Image(); backgroundImg.src = 'background.png';
let bgX = 0; const bgScrollSpeed = 0.5; let bgScaledWidth = canvas.width;

// --- Load Sounds ---
const flapSound = new Audio('flap.wav');
const scoreSound = new Audio('coingrab.wav');
const hitSound = new Audio('hit.wav');

// Optional Error Handlers
flapSound.onerror = () => console.error("Failed to load flap.wav");
scoreSound.onerror = () => console.error("Failed to load coingrab.wav");
hitSound.onerror = () => console.error("Failed to load hit.wav"); // <<< ADD THIS LINE
// --- End Load Sounds ---


// --- Image Loading Check ---
let birdImgLoaded = false, birdImgFlapLoaded = false, pipeTopImgLoaded = false, pipeBottomImgLoaded = false, backgroundImgLoaded = false;

function checkStartGame() {
    // MODIFIED: Check remains the same, logic depends only on images
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

        // Play flap sound // NEW
        try {
            flapSound.currentTime = 0; // Rewind to start before playing
            flapSound.play();
        } catch (e) {
            console.warn("Could not play flap sound:", e); // Handle potential browser restrictions
        }
    }
}

function resetGame() {
    // ... (reset variables remain the same) ...
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

function update() {
    if (gameState !== 'playing') {
        // ... (logic for game over state remains the same) ...
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
        
 	// Play hit sound // <<< ADD THIS BLOCK vvv
        try {
            hitSound.currentTime = 0; // Rewind to start
            hitSound.play();
        } catch (e) {
            console.warn("Could not play hit sound:", e);
        }
        // <<< ADD THIS BLOCK ^^^

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
        const collisionBoxTopY = birdY + 2; // Effective top starts 2px lower
        if (birdX < pipes[i].x + pipeWidth && birdX + birdWidth > pipes[i].x &&
            (collisionBoxTopY < pipeTopY || birdY + birdHeight > pipeBottomY)) { // Use collisionBoxTopY for top check
            gameState = 'gameOver';
             
	// Play hit sound // <<< ADD THIS BLOCK vvv
            try {
                hitSound.currentTime = 0; // Rewind to start
                hitSound.play();
            } catch (e) {
                console.warn("Could not play hit sound:", e);
            }
            // <<< ADD THIS BLOCK ^^^

            return;
        }

        // Score Update // MODIFIED - Trigger when bird center passes pipe center
        const birdCenterX = birdX + birdWidth / 2;
        const pipeCenterX = pipes[i].x + pipeWidth / 2;

        if (birdCenterX >= pipeCenterX && !pipes[i].passed) { // Check if bird center passed pipe center
            score++;
            pipes[i].passed = true; // Mark as passed so we don't score again

            // Play score sound
            try {
                scoreSound.currentTime = 0; // Rewind to start
                scoreSound.play();
            } catch (e) {
                 console.warn("Could not play score sound:", e); // Handle potential browser restrictions
            }
        }

        // Remove off-screen pipes
        if (pipes[i].x + pipeWidth < 0) { pipes.splice(i, 1); }
    }

    frame++;
}

function draw() {
    // ... (background, pipes, bird drawing remain the same) ...
     // Draw Background
    if (backgroundImg.complete && bgScaledWidth > 0) {
        ctx.drawImage(backgroundImg, bgX, 0, bgScaledWidth, canvas.height);
        ctx.drawImage(backgroundImg, bgX + bgScaledWidth, 0, bgScaledWidth, canvas.height);
    } else { ctx.fillStyle = "#70c5ce"; ctx.fillRect(0, 0, canvas.width, canvas.height); }

    // Draw Pipes
    for (let pipe of pipes) {
        if (pipeTopImg.complete) { ctx.drawImage(pipeTopImg, pipe.x, pipe.y - pipeTopImg.height, pipeWidth, pipeTopImg.height); }
        else { ctx.fillStyle = "#006400"; ctx.fillRect(pipe.x, 0, pipeWidth, pipe.y); }
        if (pipeBottomImg.complete) { ctx.drawImage(pipeBottomImg, pipe.x, pipe.y + pipeGap, pipeWidth, pipeBottomImg.height); }
        else { ctx.fillStyle = "#008000"; ctx.fillRect(pipe.x, pipe.y + pipeGap, pipeWidth, canvas.height - (pipe.y + pipeGap)); }
    }

    // Draw Bird (with Rotation)
    let currentBirdImage = birdImg;
    if (isFlappingAnimation && birdImgFlap.complete) { currentBirdImage = birdImgFlap; }
    else if (!birdImg.complete && birdImgFlap.complete) { currentBirdImage = birdImgFlap; }
    if (currentBirdImage && currentBirdImage.complete) {
        ctx.save();
        const birdCenterX = birdX + birdWidth / 2; const birdCenterY = birdY + birdHeight / 2;
        ctx.translate(birdCenterX, birdCenterY); ctx.rotate(birdAngle);
        ctx.drawImage(currentBirdImage, -birdWidth / 2, -birdHeight / 2, birdWidth, birdHeight);
        ctx.restore();
    } else { ctx.fillStyle = 'yellow'; ctx.fillRect(birdX, birdY, birdWidth, birdHeight); }


    // Draw Score
    // ... (score drawing remains the same) ...
    ctx.fillStyle = "#FFFFFF"; ctx.font = "24px Arial"; ctx.strokeStyle = "#000000"; ctx.lineWidth = 1; ctx.textAlign = "center";
    ctx.fillText(score, canvas.width / 2, 50); ctx.strokeText(score, canvas.width / 2, 50);

    // Draw Messages
    // ... (message drawing remains the same) ...
     ctx.textAlign = "center";
    if (gameState === 'start') {
        ctx.font = "20px Arial";
        ctx.fillText("Click or Press Space to Start", canvas.width / 2, canvas.height / 2 - 20);
        ctx.strokeText("Click or Press Space to Start", canvas.width / 2, canvas.height / 2 - 20);
    } else if (gameState === 'gameOver') {
        ctx.font = "30px Arial";
        ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 30);
        ctx.strokeText("Game Over!", canvas.width / 2, canvas.height / 2 - 30);
        ctx.font = "20px Arial";
        ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 0);
        ctx.strokeText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 0);
        ctx.fillText("Click or Space to Retry", canvas.width / 2, canvas.height / 2 + 30);
        ctx.strokeText("Click or Space to Retry", canvas.width / 2, canvas.height / 2 + 30);
    }
    ctx.textAlign = "start";
}

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