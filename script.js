// script.js - Flappy Bird Clone with Point-Based Collision & Optimizations

// --- Canvas Setup ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false }); // Disable alpha for potential performance gain

// --- Game Constants & Variables ---
const gameWidth = 320;  // Internal game resolution width
const gameHeight = 480; // Internal game resolution height

let birdX = 50;
let birdY = canvas.height / 2 - 15; // Initial Y position
let birdVelY = 0;           // Bird's vertical velocity
const gravity = 0.25;       // Downward acceleration
const flapStrength = -5;    // Upward velocity impulse on flap

let score = 0;
let highScore = 0;
let frame = 0;              // Frame counter for game logic timing
let pipes = [];             // Array to hold pipe objects
const pipeWidth = 52;       // Visual width of pipes
const pipeHalfWidth = pipeWidth / 2; // Pre-calculated
const pipeGap = 100;        // Vertical gap between pipes
const pipeSpeed = 2;        // How fast pipes move left
const pipeFrequency = 90;   // Frames between new pipe spawns (Increase for better performance/easier game)

let gameState = 'start';    // 'start', 'playing', 'gameOver'
let canRestart = true;      // Flag to control restart availability after game over

// --- Bird Rotation Variables ---
let birdAngle = 0;          // Current bird angle in radians
const maxUpAngle = -Math.PI / 6; // Max upward rotation (~ -30 degrees)
const maxDownAngle = Math.PI / 6;  // Max downward rotation (~ +30 degrees)
const rotationLerpFactor = 0.1; // Smoothing factor for rotation (Lower = slower/smoother)

// --- Load Bird Images ---
const birdImg = new Image(); birdImg.src = 'bird.png';
const birdImgFlap = new Image(); birdImgFlap.src = 'bird2.png';
let birdWidth = 34;         // Bird visual width
let birdHeight = 24;        // Bird visual height
const birdHalfWidth = birdWidth / 2;   // Pre-calculated
const birdHalfHeight = birdHeight / 2; // Pre-calculated

// --- Bird Collision Point Offsets ---
// How far inset from visual edges the collision points are (Larger = more forgiving/"rounded")
const collisionInsetX = 4;
const collisionInsetY = 4;

// --- Flap Animation State ---
let isFlappingAnimation = false;
let flapAnimationTimer = null;

// --- Load Pipe Images ---
const pipeTopImg = new Image(); pipeTopImg.src = 'pipe2.png';
const pipeBottomImg = new Image(); pipeBottomImg.src = 'pipe.png';

// --- Load Background Image ---
const backgroundImg = new Image(); backgroundImg.src = 'background.png';
let bgX = 0;                // Current X position for background scrolling
const bgScrollSpeed = 0.5;  // Background scroll speed
let bgScaledWidth = canvas.width; // Calculated background width for correct aspect ratio

// --- Load Sounds using Howler.js ---
// NOTE: Ensure Howler.js library is included in index.html before this script
//       (e.g., via CDN or local file)
const flapSound = new Howl({
  src: ['flap.mp3', 'flap.wav'], preload: true, // Provide optimized format first
  onloaderror: (id, err) => console.error("Failed to load flap sound:", err),
  onplayerror: (id, err) => console.warn("Could not play flap sound:", err)
});
const scoreSound = new Howl({
  src: ['coingrab.mp3', 'coingrab.wav'], preload: true,
  onloaderror: (id, err) => console.error("Failed to load score sound:", err),
  onplayerror: (id, err) => console.warn("Could not play score sound:", err)
});
const hitSound = new Howl({
  src: ['hit.mp3', 'hit.wav'], preload: true,
  onloaderror: (id, err) => console.error("Failed to load hit sound:", err),
  onplayerror: (id, err) => console.warn("Could not play hit sound:", err)
});
// --- End Howler Sounds ---

// --- Image Loading Check ---
// Flags to track loading status
let birdImgLoaded = false, birdImgFlapLoaded = false, pipeTopImgLoaded = false, pipeBottomImgLoaded = false, backgroundImgLoaded = false;

// Function to check if all assets are loaded and start the game
function checkStartGame() {
    // Check if all flags are true
    if (birdImgLoaded && birdImgFlapLoaded && pipeTopImgLoaded && pipeBottomImgLoaded && backgroundImgLoaded) {
        console.log("All game images loaded successfully!");

        // Calculate background width based on aspect ratio (only after image loaded)
        if (backgroundImg.naturalHeight > 0) {
            const aspectRatio = backgroundImg.naturalWidth / backgroundImg.naturalHeight;
            bgScaledWidth = canvas.height * aspectRatio;
        } else {
            // Fallback if image dimensions not available
            bgScaledWidth = backgroundImg.naturalWidth || canvas.width;
        }
        // Ensure scaled width is at least the canvas width
        if (bgScaledWidth < canvas.width) { bgScaledWidth = canvas.width; }

        resetGame(); // Initialize game state
        gameLoop();  // Start the main game loop
    }
}

// --- Image Load Handlers --- (Trigger checkStartGame)
birdImg.onload = () => { console.log("Bird image 1 loaded."); birdImgLoaded = true; checkStartGame(); };
birdImgFlap.onload = () => { console.log("Bird image 2 (flap) loaded."); birdImgFlapLoaded = true; checkStartGame(); };
pipeTopImg.onload = () => { console.log("Pipe Top image loaded."); pipeTopImgLoaded = true; checkStartGame(); };
pipeBottomImg.onload = () => { console.log("Pipe Bottom image loaded."); pipeBottomImgLoaded = true; checkStartGame(); };
backgroundImg.onload = () => { console.log("Background image loaded."); backgroundImgLoaded = true; checkStartGame(); };
// Error Handlers (Mark as loaded to allow game start even if one fails, using fallbacks)
birdImg.onerror = () => { console.error("Failed to load bird image 1!"); birdImgLoaded = true; checkStartGame(); }
birdImgFlap.onerror = () => { console.error("Failed to load bird image 2 (flap)!"); birdImgFlapLoaded = true; checkStartGame(); }
pipeTopImg.onerror = () => { console.error("Failed to load Pipe Top image!"); pipeTopImgLoaded = true; checkStartGame(); }
pipeBottomImg.onerror = () => { console.error("Failed to load Pipe Bottom image!"); pipeBottomImgLoaded = true; checkStartGame(); }
backgroundImg.onerror = () => { console.error("Failed to load Background image!"); backgroundImgLoaded = true; checkStartGame(); }

// --- Game Functions ---

function flap() {
    // Determine if a flap action is allowed based on game state and restart cooldown
    const canFlapNow = gameState === 'playing' || gameState === 'start' || (gameState === 'gameOver' && canRestart);
    console.log(`[flap] Called. State: ${gameState}, canRestart: ${canRestart}, canFlapNow: ${canFlapNow}`); // Debug log

    if (canFlapNow) {
        // If starting or restarting, reset necessary variables
        if (gameState === 'start' || gameState === 'gameOver') {
            console.log(`[flap] Resetting from ${gameState}...`);
            resetGame();        // Reset game variables
            gameState = 'playing'; // Set state to playing
            console.log(`[flap] State set to: ${gameState}`);
        }

        // Apply flap physics
        birdVelY = flapStrength;

        // Trigger flap animation visuals
        isFlappingAnimation = true;
        if (flapAnimationTimer) clearTimeout(flapAnimationTimer); // Clear previous timer if any
        flapAnimationTimer = setTimeout(() => { isFlappingAnimation = false; }, 500); // Reset animation after 0.5s

        // Play flap sound
        flapSound.play();

    } else {
        // Log why flap was ignored (useful for debugging restart delay)
        console.log(`[flap] Flap ignored. State: ${gameState}, canRestart: ${canRestart}`);
    }
}

function resetGame() {
    console.log("[resetGame] Resetting game variables."); // Debug log
    birdX = 50;                     // Reset bird position
    birdY = canvas.height / 2 - birdHalfHeight; // Center vertically based on half height
    birdVelY = 0;                   // Reset velocity
    pipes = [];                     // Clear pipes array
    score = 0;                      // Reset score
    // highScore is intentionally NOT reset
    frame = 0;                      // Reset frame counter
    bgX = 0;                        // Reset background scroll position
    isFlappingAnimation = false;    // Reset flap animation visual state
    if (flapAnimationTimer) { clearTimeout(flapAnimationTimer); flapAnimationTimer = null; } // Clear animation timer
    birdAngle = 0;                  // Reset bird rotation
    gameState = 'start';            // Set initial game state
    canRestart = true;              // Ensure restart is enabled
}

function update() {
    // --- Early exit if not in 'playing' state ---
    if (gameState !== 'playing') {
        return; // Stop all game logic updates (physics, pipes, score)
    }

    // --- If playing, proceed with updates ---

    // Background Scrolling
    if (backgroundImg.complete && bgScaledWidth > 0) {
         bgX -= bgScrollSpeed;
         if (bgX <= -bgScaledWidth) { bgX += bgScaledWidth; } // Loop background
    }

    // Bird Physics
    birdVelY += gravity; // Apply gravity
    birdY += birdVelY;   // Update vertical position

    // Bird Rotation Logic
    let targetAngle; const velocityThreshold = 0.5;
    if (birdVelY < 0) { targetAngle = maxUpAngle; } // Going up
    else if (birdVelY > velocityThreshold) { targetAngle = maxDownAngle; } // Going down
    else { targetAngle = 0; } // Near peak
    birdAngle += (targetAngle - birdAngle) * rotationLerpFactor; // Smoothly rotate

    // --- Calculate Rotated Collision Points ---
    const birdCenterX = birdX + birdHalfWidth;
    const birdCenterY = birdY + birdHalfHeight;
    const cosA = Math.cos(birdAngle);
    const sinA = Math.sin(birdAngle);
    // Points relative to bird center (inset for "rounded" feel)
    const beakRelX = birdHalfWidth - collisionInsetX; const beakRelY = 0;
    const topRelX = 0; const topRelY = -birdHalfHeight + collisionInsetY;
    const bottomRelX = 0; const bottomRelY = birdHalfHeight - collisionInsetY;
    // Calculate world coordinates of points
    const beakPoint = { x: birdCenterX + (beakRelX * cosA - beakRelY * sinA), y: birdCenterY + (beakRelX * sinA + beakRelY * cosA) };
    const topPoint = { x: birdCenterX + (topRelX * cosA - topRelY * sinA), y: birdCenterY + (topRelX * sinA + topRelY * cosA) };
    const bottomPoint = { x: birdCenterX + (bottomRelX * cosA - bottomRelY * sinA), y: birdCenterY + (bottomRelX * sinA + bottomRelY * cosA) };
    const collisionPoints = [beakPoint, topPoint, bottomPoint]; // Array of points to check

    // --- Collision Detection: Ground & Ceiling (Point-based) ---
    if (bottomPoint.y > canvas.height || topPoint.y < 0) {
        if (gameState !== 'gameOver') { // Check if not already game over
            gameState = 'gameOver'; canRestart = false; // Set state, disable restart
            if (score > highScore) { highScore = score; console.log("New High Score:", highScore); } // Update high score
            hitSound.play(); // Play hit sound
            // Set timer to re-enable restart after delay
            setTimeout(() => { canRestart = true; console.log("Restart enabled after delay."); }, 500);
        }
        // No return needed here - update loop will exit next frame based on gameState
    }

    // --- Pipe Management ---
    // Add new pipes periodically
    if (frame % pipeFrequency === 0) {
        let pipeY = Math.random() * (canvas.height - pipeGap - 150) + 75; // Random gap position
        pipes.push({ x: canvas.width, y: pipeY, passed: false });
    }

    // --- Move and Check Pipes ---
    for (let i = pipes.length - 1; i >= 0; i--) { // Loop backwards for safe removal
        const pipe = pipes[i];
        pipe.x -= pipeSpeed; // Move pipe left

        // Define pipe boundaries for collision checks
        const pipeTopY = pipe.y;           // Top of the gap
        const pipeBottomY = pipe.y + pipeGap; // Bottom of the gap
        const pipeLeftX = pipe.x;
        const pipeRightX = pipe.x + pipeWidth;

        // --- Collision with Pipes (Point-based) ---
        let collisionDetected = false;
        for (const point of collisionPoints) {
            // Is the point horizontally within the pipe?
            if (point.x > pipeLeftX && point.x < pipeRightX) {
                // Is the point vertically outside the gap (hitting top or bottom part)?
                if (point.y < pipeTopY || point.y > pipeBottomY) {
                    collisionDetected = true;
                    break; // One point hit is enough
                }
            }
        }

        if (collisionDetected) {
            if (gameState !== 'gameOver') { // Check if not already game over
                 gameState = 'gameOver'; canRestart = false; // Set state, disable restart
                 if (score > highScore) { highScore = score; console.log("New High Score:", highScore); } // Update high score
                 hitSound.play(); // Play hit sound
                 // Set timer to re-enable restart after delay
                 setTimeout(() => { canRestart = true; console.log("Restart enabled after delay."); }, 500);
            }
            // No return needed here
        }

        // --- Score Update --- (Only check if game is still playing)
        if (gameState === 'playing') {
             const birdCenterXScore = birdX + birdHalfWidth; // Use bird's visual center
             const pipeCenterX = pipe.x + pipeHalfWidth;    // Use pipe's visual center

             // Check if bird center has passed pipe center and score not yet awarded
             if (birdCenterXScore >= pipeCenterX && !pipe.passed) {
                 score++;
                 pipe.passed = true; // Mark as passed
                 scoreSound.play();  // Play score sound
             }
        }

        // --- Remove off-screen pipes ---
        if (pipeRightX < 0) {
            pipes.splice(i, 1); // Remove pipe from array
        }
    } // End pipe loop

    // --- Increment Frame Counter --- (Only if still playing)
    if (gameState === 'playing') {
        frame++;
    }

} // --- End of update function ---

function draw() {
    // --- Draw Background ---
    if (backgroundImg.complete && bgScaledWidth > 0) {
        ctx.drawImage(backgroundImg, bgX, 0, bgScaledWidth, canvas.height);
        ctx.drawImage(backgroundImg, bgX + bgScaledWidth, 0, bgScaledWidth, canvas.height);
    } else { ctx.fillStyle = "#70c5ce"; ctx.fillRect(0, 0, canvas.width, canvas.height); } // Fallback

    // --- Draw Pipes ---
    for (let pipe of pipes) {
        if (pipeTopImg.complete) { ctx.drawImage(pipeTopImg, pipe.x, pipe.y - pipeTopImg.height, pipeWidth, pipeTopImg.height); }
        else { ctx.fillStyle = "#006400"; ctx.fillRect(pipe.x, 0, pipeWidth, pipe.y); } // Fallback
        if (pipeBottomImg.complete) { ctx.drawImage(pipeBottomImg, pipe.x, pipe.y + pipeGap, pipeWidth, pipeBottomImg.height); }
        else { ctx.fillStyle = "#008000"; ctx.fillRect(pipe.x, pipe.y + pipeGap, pipeWidth, canvas.height - (pipe.y + pipeGap)); } // Fallback
    }

    // --- Define which bird image to use ---
    let currentBirdImage = birdImg; // Default
    if (!birdImg.complete && birdImgFlap.complete) { currentBirdImage = birdImgFlap; } // Fallback if needed
    if (isFlappingAnimation && birdImgFlap.complete) { currentBirdImage = birdImgFlap; } // Override for flap

    // --- Draw Bird (with Rotation) ---
    if (currentBirdImage && currentBirdImage.complete) {
        ctx.save(); // Save context state
        const birdCenterX = birdX + birdHalfWidth;
        const birdCenterY = birdY + birdHalfHeight;
        ctx.translate(birdCenterX, birdCenterY); // Move origin to bird center
        ctx.rotate(birdAngle); // Rotate context
        // Draw bird centered on the transformed origin
        ctx.drawImage(currentBirdImage, -birdHalfWidth, -birdHalfHeight, birdWidth, birdHeight);
        ctx.restore(); // Restore context state
    } else { // Fallback if image not ready
        ctx.fillStyle = 'yellow'; ctx.fillRect(birdX, birdY, birdWidth, birdHeight);
    }

    // --- Draw Score --- (Yellow, Pixel Font)
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFF00";
    ctx.font = "16px 'Press Start 2P'";
    ctx.fillText(score, canvas.width / 2, 40); // NOTE: No strokeText for performance

    // --- Draw Messages ---
    if (gameState === 'start') {
        ctx.fillStyle = "#000000"; // Black text
        ctx.font = "14px 'Press Start 2P'";
        ctx.fillText("Ýtið til að byrja", canvas.width / 2, canvas.height / 2 - 20);
        // NOTE: No strokeText
    } else if (gameState === 'gameOver') {
        // "Game Over!" text (Red, Pixel Font)
        ctx.fillStyle = "#FF0000";
        ctx.font = "20px 'Press Start 2P'";
        ctx.fillText("Búið spil!", canvas.width / 2, canvas.height / 2 - 40);
        // NOTE: No strokeText

        // Score/Retry text (Black, Pixel Font)
        ctx.fillStyle = "#000000";
        ctx.font = "14px 'Press Start 2P'";
        ctx.fillText(score+" stig", canvas.width / 2, canvas.height / 2 + 0);
        ctx.fillText(`Besta tilraun: ${highScore}`, canvas.width / 2, canvas.height / 2 + 25);
        ctx.fillText("Click or Space to Retry", canvas.width / 2, canvas.height / 2 + 55);
         // NOTE: No strokeText
    }
    ctx.textAlign = "start"; // Reset alignment

} // --- End of draw function ---

// --- Main Game Loop ---
function gameLoop() {
    update(); // Update game state
    draw();   // Render the current state
    requestAnimationFrame(gameLoop); // Schedule the next frame
}

// --- Event Listeners ---
window.addEventListener('keydown', function(e) { if (e.code === 'Space') { e.preventDefault(); flap(); } });
canvas.addEventListener('mousedown', flap);
// Use passive: false for touchstart if preventing default scroll is critical
canvas.addEventListener('touchstart', function(e) { e.preventDefault(); flap(); }, { passive: false });

// --- Initial Setup ---
resetGame(); // Set initial game state variables
draw();      // Draw the initial frame (likely the 'start' screen)

// --- Screen Resizing Logic ---
function resizeGame() {
    const canvas = document.getElementById('gameCanvas'); // Get canvas element again
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const windowRatio = windowWidth / windowHeight;
    const gameRatio = gameWidth / gameHeight; // Use defined constants
    let newWidth = gameWidth; let newHeight = gameHeight;

    // Calculate new dimensions based on aspect ratio fit
    if (windowRatio > gameRatio) { newHeight = windowHeight; newWidth = newHeight * gameRatio; }
    else { newWidth = windowWidth; newHeight = newWidth / gameRatio; }

    // Apply visual scaling styles
    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;
    // Ensure canvas is visible after sizing
    canvas.style.visibility = 'visible';
}
// Initial resize on load and subsequent resize events
window.addEventListener('load', resizeGame);
window.addEventListener('resize', resizeGame);

// --- End of Script ---
