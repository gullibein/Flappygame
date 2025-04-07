// script.js - Complete version with Bird Rotation and Sounds

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false });

// Game Variables
// ... (keep existing variables)
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
const maxUpAngle = -Math.PI / 6; // Using approx 30 degrees based on last adjustment
const maxDownAngle = Math.PI / 6;
const rotationLerpFactor = 0.1;

// --- Load Bird Images ---
const birdImg = new Image(); birdImg.src = 'bird.png';
const birdImgFlap = new Image(); birdImgFlap.src = 'bird2.png';
let birdWidth = 34; let birdHeight = 24;
const birdHalfWidth = birdWidth / 2;   // NEW
const birdHalfHeight = birdHeight / 2; // NEW

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

 	if (score > highScore) {
            highScore = score;
            console.log("New High Score:", highScore); // Optional: Log to console
        }
        
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

            if (score > highScore) {
                highScore = score;
                console.log("New High Score:", highScore); // Optional: Log to console
            }
             
	// Play hit sound
            try {
                hitSound.currentTime = 0; // Rewind to start
                hitSound.play();
            } catch (e) {
                console.warn("Could not play hit sound:", e);
            }

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
    ctx.fillStyle = "#FFFF00"; // Yellow color
    // MODIFIED: Use Press Start 2P, adjust size, remove bold
    ctx.font = "16px 'Press Start 2P'"; // Smaller size often looks better for pixel fonts
    // Removed strokeText
    ctx.fillText(score, canvas.width / 2, 40); // Adjusted Y position slightly for new font size

    // --- Draw Messages ---
    // Keep text centered
    if (gameState === 'start') {
        // Style for start message
        ctx.fillStyle = "#000000"; // Black text
        // MODIFIED: Use Press Start 2P, adjust size
        ctx.font = "14px 'Press Start 2P'"; // Slightly smaller for longer text
        // Removed strokeText
        ctx.fillText("Ýtið til að byrja", canvas.width / 2, canvas.height / 2 - 20);

    } else if (gameState === 'gameOver') {
        // Style for "Game Over!" text (Red, New Font)
        ctx.fillStyle = "#FF0000"; // Red color
        // MODIFIED: Use Press Start 2P, adjust size, remove bold
        ctx.font = "20px 'Press Start 2P'"; // Larger size for title
         // Removed strokeText
        ctx.fillText("Búið spil!", canvas.width / 2, canvas.height / 2 - 40); // Adjusted Y

        // Reset styles for score/retry text
        ctx.fillStyle = "#000000"; // Black text
        // MODIFIED: Use Press Start 2P, adjust size
        ctx.font = "14px 'Press Start 2P'";
         // Removed strokeText

        // Draw final score
        ctx.fillText(score+" stig", canvas.width / 2, canvas.height / 2 + 0); // Adjusted Y
	ctx.fillText(`Besta tilraun: ${highScore}`, canvas.width / 2, canvas.height / 2 + 25); // Display HS 
    }

    // Reset text alignment
    ctx.textAlign = "start";

} // --- End of draw function ---

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

// --- Add this Scaling Logic at the END of script.js ---

const gameWidth = 320; // Your game's internal width
const gameHeight = 480; // Your game's internal height

function resizeGame() {
    const canvas = document.getElementById('gameCanvas');
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const windowRatio = windowWidth / windowHeight;
    const gameRatio = gameWidth / gameHeight;

    let newWidth = gameWidth;
    let newHeight = gameHeight;

    // Decide which dimension to fit by comparing aspect ratios
    if (windowRatio > gameRatio) {
        // Window is wider than game: Fit height
        newHeight = windowHeight;
        newWidth = newHeight * gameRatio;
    } else {
        // Window is taller or same ratio as game: Fit width
        newWidth = windowWidth;
        newHeight = newWidth / gameRatio;
    }

    // Set the visual size of the canvas element using CSS styles
    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;

    canvas.style.visibility = 'visible';

    console.log(`Resized canvas style to: ${newWidth.toFixed(0)} x ${newHeight.toFixed(0)}`);
}

// Call resizeGame initially when the window loads
window.addEventListener('load', resizeGame);

// Call resizeGame again whenever the window is resized
window.addEventListener('resize', resizeGame);

// --- End of Scaling Logic ---