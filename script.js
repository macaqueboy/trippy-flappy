const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Variables del juego
let birdX = 50;
let birdY = canvas.height / 2; // Posición inicial centrada
let baseBirdWidth = 20;
let baseBirdHeight = 20;
let birdWidth = baseBirdWidth;
let birdHeight = baseBirdHeight;
let birdPulse = 0; // Para la pulsación
let birdVelocityY = 0;
let birdHue = 120; // Color del pájaro
let score = 0;

// Variables comunes / del juego
let baseGravity = 0.3;
let gravity = baseGravity;
const jumpStrength = -6;

let pipes = [];
let pipeWidth = 40;
let pipeGap = 100; // Espacio inicial entre tubería superior e inferior
let basePipeSpeed = 2; // Velocidad base
let pipeSpeed = basePipeSpeed;
let pipeSpawnTimer = 0;
const pipeSpawnInterval = 100; // Generar tuberías un poco más rápido
const maxPipeSpeed = 5; // Velocidad máxima (sin cambios)
const pipeSpeedIncrease = 0.001; // Cuánto aumenta la velocidad por frame (sin cambios)
const minPipeGap = 85; // Espacio mínimo aumentado (antes 70)
const maxPipeGap = 160; // Espacio máximo aumentado (antes 150)
const pipeVerticalSpeed = 0.7; // Velocidad vertical reducida (antes 1)

let highScore = localStorage.getItem('flappyHighScore') || 0; // High Score
let gameOver = false;


// Variable para el cambio de color del fondo
let backgroundHue = 0;
// Variables para la locura de partículas y agitación (compartidas)
let particles = []; // Un solo array de partículas para ambos
let shakeIntensity = 0;
let shakeDuration = 0;
// Variables para eventos locos
let crazyEventTimer = 0;
const crazyEventInterval = 300; // Frames entre eventos locos
let currentCrazyEvent = null;
let crazyEventDuration = 0;
// Variable para la rotación del canvas
let canvasRotation = 0;
let rotationDirection = 1;
const maxRotation = 0.07; // Máxima rotación reducida (antes 0.1)
const rotationSpeed = 0.001; // Velocidad de oscilación (sin cambios)


// Función para dibujar el pájaro (ahora cambia de color y pulsa)
function drawBird() {
    // Calcular tamaño pulsante
    let pulseFactor = 1 + Math.sin(birdPulse) * 0.1; // Pulsa un 10%
    birdWidth = baseBirdWidth * pulseFactor;
    birdHeight = baseBirdHeight * pulseFactor;

    ctx.fillStyle = `hsl(${birdHue}, 100%, 50%)`; // Color cambiante
    // Dibujar centrado a pesar del cambio de tamaño
    ctx.fillRect(birdX - (birdWidth - baseBirdWidth) / 2, birdY - (birdHeight - baseBirdHeight) / 2, birdWidth, birdHeight);
}

// Función para dibujar partículas
function drawParticles() {
    particles.forEach(p => {
        ctx.fillStyle = `hsla(${p.hue}, 100%, 50%, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Función para dibujar las tuberías (con bordes ondulados y color cambiante)
function drawWavyPipes() {
    const waveAmplitude = 5; // Amplitud de la onda
    const waveFrequency = 0.1; // Frecuencia de la onda

    pipes.forEach(pipe => {
        ctx.fillStyle = `hsl(${pipe.hue}, 70%, 50%)`;

        // Tubería superior ondulada
        ctx.beginPath();
        ctx.moveTo(pipe.x, 0);
        for (let y = 0; y <= pipe.topHeight; y++) {
            let xOffset = Math.sin(y * waveFrequency + backgroundHue * 0.1) * waveAmplitude; // La onda se mueve con el fondo
            ctx.lineTo(pipe.x + pipeWidth / 2 + xOffset, y);
        }
        ctx.lineTo(pipe.x + pipeWidth, pipe.topHeight);
        ctx.lineTo(pipe.x + pipeWidth, 0);
        ctx.closePath();
        ctx.fill();


        // Tubería inferior ondulada
        ctx.beginPath();
        ctx.moveTo(pipe.x, canvas.height);
         for (let y = canvas.height; y >= pipe.bottomY; y--) {
            let xOffset = Math.sin(y * waveFrequency + backgroundHue * 0.1) * waveAmplitude;
            ctx.lineTo(pipe.x + pipeWidth / 2 + xOffset, y);
        }
        ctx.lineTo(pipe.x + pipeWidth, pipe.bottomY);
        ctx.lineTo(pipe.x + pipeWidth, canvas.height);
        ctx.closePath();
        ctx.fill();

         // Dibujar rectángulos sólidos en los bordes para tapar huecos (opcional, mejora visual)
         ctx.fillRect(pipe.x, 0, pipeWidth/4, pipe.topHeight);
         ctx.fillRect(pipe.x + pipeWidth*3/4, 0, pipeWidth/4, pipe.topHeight);
         ctx.fillRect(pipe.x, pipe.bottomY, pipeWidth/4, canvas.height - pipe.bottomY);
         ctx.fillRect(pipe.x + pipeWidth*3/4, pipe.bottomY, pipeWidth/4, canvas.height - pipe.bottomY);


    });
}

// Función para dibujar el marcador y High Score
function drawScore() {
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, 10, 25);
    // High Score (con más margen)
    ctx.textAlign = 'right';
    ctx.fillText('High: ' + highScore, canvas.width - 15, 35);
    ctx.textAlign = 'start'; // Resetear alineación
}

// Función principal de dibujo
function draw() {
    // Guardar estado del canvas
    ctx.save();

    // Aplicar rotación oscilante al canvas completo
    ctx.translate(canvas.width / 2, canvas.height / 2); // Mover origen al centro
    ctx.rotate(canvasRotation);
    ctx.translate(-canvas.width / 2, -canvas.height / 2); // Mover origen de vuelta

    // Aplicar agitación si está activa (después de rotar)
    if (shakeDuration > 0) {
        let dx = (Math.random() - 0.5) * shakeIntensity;
        let dy = (Math.random() - 0.5) * shakeIntensity;
        ctx.translate(dx, dy);
    }

    // Cambiar color de fondo dinámicamente
    ctx.fillStyle = `hsl(${backgroundHue}, 100%, 85%)`; // Usar HSL para cambiar el matiz
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Rellenar el fondo

    // Dibujar elementos del JUEGO (afectados por rotación/agitación)
    drawParticles();
    drawBird(); // Dibujar solo un pájaro
    drawWavyPipes();

    // Restaurar estado del canvas ANTES de dibujar la UI (scores, game over)
    ctx.restore();

    // --- Dibujar UI (fuera de las transformaciones) ---
    drawScore(); // Dibujar marcador normal

    if (gameOver) {
        // Game Over más loco (dibujado sobre todo, sin rotar/agitar)
        ctx.fillStyle = `hsla(${Math.random() * 360}, 100%, 50%, 0.7)`;
        ctx.font = `${Math.random() * 20 + 40}px Impact`; // Tamaño y fuente aleatorios
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER!!!', canvas.width / 2 + (Math.random() - 0.5) * 10, canvas.height / 2 - 30 + (Math.random() - 0.5) * 10); // Subir un poco el texto principal
        ctx.font = '20px Arial'; // Reset font for score
        ctx.fillStyle = 'black';
        // Mostrar puntuación final
        ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 10);
        // Mostrar High Score
         ctx.fillText('High Score: ' + highScore, canvas.width / 2, canvas.height / 2 + 40);
         // Añadir texto para reiniciar
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.font = '16px Arial';
        ctx.fillText('(Enter / Click / Tap to Restart)', canvas.width / 2, canvas.height / 2 + 100);

        ctx.textAlign = 'start'; // Reset alignment
    }

    // Ya no necesitamos restaurar aquí, se hizo antes de dibujar la UI
    // ctx.restore();
}

// Función para actualizar partículas
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02; // Desvanecer
        if (p.alpha <= 0) {
            particles.splice(i, 1); // Eliminar si es invisible
        }
    }
}

// Función para actualizar el estado del juego
function update() {
    // Actualizar el matiz del fondo, pájaro y pulsación
    backgroundHue = (backgroundHue + 1) % 360;
    birdHue = (birdHue + 2) % 360;
    birdPulse += 0.1;

    // Actualizar rotación del canvas
    canvasRotation += rotationSpeed * rotationDirection;
    if (Math.abs(canvasRotation) >= maxRotation) {
        rotationDirection *= -1; // Invertir dirección al alcanzar el límite
        canvasRotation = maxRotation * rotationDirection; // Asegurar que no exceda
    }


    // Actualizar agitación
    if (shakeDuration > 0) {
        shakeDuration--;
        if (shakeDuration === 0) {
            shakeIntensity = 0;
        }
    }

    // Actualizar partículas
    updateParticles();

    // Gestionar eventos locos
    handleCrazyEvents();

    if (gameOver) return; // Si el juego ha terminado, no actualizar más

    // Mover pájaro (gravedad)
    birdVelocityY += gravity;
    birdY += birdVelocityY;

    // Generar partículas donde está el pájaro
    particles.push({
        x: birdX + baseBirdWidth / 2, // Usar tamaño base para centro
        y: birdY + baseBirdHeight / 2,
        size: Math.random() * 3 + 1,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        hue: birdHue,
        alpha: 1
    });


    // --- Actualizaciones Comunes (Tuberías, Velocidad) ---
    // Aumentar velocidad gradualmente
    if (pipeSpeed < maxPipeSpeed) {
        pipeSpeed += pipeSpeedIncrease;
    }

    // Generar nuevas tuberías
    pipeSpawnTimer++;
    if (pipeSpawnTimer >= pipeSpawnInterval) {
        pipeSpawnTimer = 0;
        let currentGap = Math.random() * (maxPipeGap - minPipeGap) + minPipeGap; // Espacio aleatorio
        let topHeight = Math.random() * (canvas.height - currentGap - 100) + 50; // Altura aleatoria ajustada al hueco
        pipes.push({
            x: canvas.width,
            topHeight: topHeight,
            bottomY: topHeight + currentGap,
            vy: (Math.random() < 0.5 ? 1 : -1) * pipeVerticalSpeed, // Dirección vertical aleatoria
            hue: Math.random() * 360, // Color aleatorio para la tubería
            passed: false
        });
    }

    // Mover tuberías horizontal y verticalmente
    pipes.forEach(pipe => {
        pipe.x -= pipeSpeed;
        pipe.topHeight += pipe.vy;
        pipe.bottomY += pipe.vy;

        // Rebotar en los bordes superior/inferior
        if (pipe.topHeight < 20 || pipe.bottomY > canvas.height - 20) {
            pipe.vy *= -1; // Invertir dirección vertical
        }
    });

    // Eliminar tuberías que salen de la pantalla
    pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);

    // Comprobar colisiones
    checkCollisions();

    // Actualizar puntuación
    pipes.forEach(pipe => {
        if (!pipe.passed && pipe.x + pipeWidth < birdX) {
            score++;
            pipe.passed = true; // Marcar como pasada
        }
    });
}

// Función para comprobar colisiones
function checkCollisions() {
    // Colisión con bordes superior/inferior
    // Usar tamaños base para colisión más consistente
    if (birdY - (birdHeight - baseBirdHeight) / 2 < 0 || birdY + baseBirdHeight + (birdHeight - baseBirdHeight) / 2 > canvas.height) {
        triggerGameOver();
        return;
    }

    // Colisión con tuberías
    pipes.forEach(pipe => {
        if (
            birdX < pipe.x + pipeWidth &&
            birdX + baseBirdWidth > pipe.x &&
            (birdY < pipe.topHeight || birdY + baseBirdHeight > pipe.bottomY)
        ) {
            triggerGameOver();
            return; // Salir del forEach
        }
    });
}

// Función para activar el Game Over y la sacudida
function triggerGameOver() {
    if (!gameOver) {
        gameOver = true;
        shakeDuration = 60;
        shakeIntensity = 15;
        resetCrazyEvent();

        // Comprobar y guardar High Score
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('flappyHighScore', highScore);
        }
    }
}

// Función para gestionar eventos locos
function handleCrazyEvents() {
    if (crazyEventDuration > 0) {
        crazyEventDuration--;
        if (crazyEventDuration === 0) {
            resetCrazyEvent();
        }
    } else {
        crazyEventTimer++;
        if (crazyEventTimer >= crazyEventInterval) {
            crazyEventTimer = 0;
            startRandomCrazyEvent();
        }
    }
}

// Función para iniciar un evento loco aleatorio
function startRandomCrazyEvent() {
    let eventType = Math.floor(Math.random() * 2); // 0: Speed change, 1: Gravity change
    crazyEventDuration = 120; // Duración del evento (sin cambios)

    if (eventType === 0) { // Cambio de velocidad
        let speedMultiplier = Math.random() < 0.5 ? 0.6 : 1.8; // Velocidades menos extremas (antes 0.5 y 2)
        pipeSpeed = basePipeSpeed * speedMultiplier;
        currentCrazyEvent = 'speedChange';
    } else if (eventType === 1) { // Cambio de gravedad (sin cambios por ahora)
        gravity = Math.random() < 0.5 ? baseGravity * -1 : baseGravity * 2; // Gravedad invertida o doble
        currentCrazyEvent = 'gravityChange';
    }
}

// Función para resetear el evento loco actual
function resetCrazyEvent() {
    if (currentCrazyEvent === 'speedChange') {
        pipeSpeed = basePipeSpeed; // Restaurar velocidad base (se ajustará por el aumento gradual)
    } else if (currentCrazyEvent === 'gravityChange') {
        gravity = baseGravity; // Restaurar gravedad base
    }
    currentCrazyEvent = null;
    crazyEventDuration = 0;
}

// Función para hacer saltar al pájaro
function jump() {
    if (!gameOver) {
        birdVelocityY = jumpStrength;
    } else {
        // Reiniciar juego si está terminado y se hace clic/toca/Enter
        resetGame();
    }
}

// Función para reiniciar el juego
function resetGame() {
    birdX = 50;
    birdY = canvas.height / 2; // Centrar pájaro inicial
    birdVelocityY = 0;
    birdWidth = baseBirdWidth;
    birdHeight = baseBirdHeight;
    pipes = [];
    particles = [];
    score = 0;
    gameOver = false;
    pipeSpawnTimer = 0;
    pipeSpeed = basePipeSpeed;
    gravity = baseGravity;
    backgroundHue = 0;
    birdHue = 120; // Resetear color pájaro
    shakeDuration = 0;
    shakeIntensity = 0;
    canvasRotation = 0;
    rotationDirection = 1;
    resetCrazyEvent();
    crazyEventTimer = 0;
    // Recargar High Score
    highScore = localStorage.getItem('flappyHighScore') || 0;
}

// Bucle principal del juego
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop); // Llama a gameLoop repetidamente
}

// Event listener para el salto (Espacio, Clic, Toque) y reinicio (Enter)
document.addEventListener('keydown', function(event) {
    if (event.code === 'Space') {
        jump();
    } else if (gameOver && event.code === 'Enter') {
         resetGame();
    }
});
document.addEventListener('click', jump);
document.addEventListener('touchstart', jump);

// Iniciar el juego
resetGame(); // Asegura que el estado inicial sea correcto
gameLoop();
