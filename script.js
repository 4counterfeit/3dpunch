// --- COMIC BOOK UI STYLES ---
const style = document.createElement("style");
style.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Bangers&display=swap');

    body {
        font-family: 'Bangers', cursive;
        text-transform: uppercase;
        margin: 0;
        overflow: hidden;
        background: #2c3e50;
    }

    #start-screen {
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: #FFCC00;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        z-index: 2000;
    }

    .epic-title {
        font-size: 8rem;
        color: #E23636;
        -webkit-text-stroke: 4px black;
        text-shadow: 8px 8px 0px #000;
        margin: 0;
        transform: skew(-5deg, -5deg);
    }

    .epic-btn {
        margin-top: 30px;
        background: #E23636;
        color: white;
        font-family: 'Bangers', cursive;
        font-size: 4rem;
        padding: 10px 50px;
        border: 5px solid black;
        cursor: pointer;
        box-shadow: 8px 8px 0px black;
    }

    #uiScore {
        position: fixed;
        top: 20px;
        left: 20px;
        font-size: 4rem;
        color: #FFCC00;
        -webkit-text-stroke: 2px black;
        text-shadow: 4px 4px 0px #000;
        z-index: 100;
        pointer-events: none;
    }

    .hit-text {
        position: fixed;
        font-size: 5rem;
        color: #FFCC00;
        -webkit-text-stroke: 3px black;
        text-shadow: 6px 6px 0px #000;
        pointer-events: none;
        z-index: 1000;
        transition: transform 0.5s, opacity 0.5s;
    }

    #game-over {
        display: none;
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.9);
        color: white;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 5000;
    }
`;
document.head.appendChild(style);

// --- UI ELEMENTS ---
const startScreen = document.createElement("div");
startScreen.id = "start-screen";
startScreen.innerHTML = `
    <h1 class="epic-title">3D PUNCH</h1>
    <button class="epic-btn" onclick="initGame()">FIGHT!</button>
`;
document.body.appendChild(startScreen);

const uiScore = document.createElement("div");
uiScore.id = "uiScore";
uiScore.innerText = "0";
document.body.appendChild(uiScore);

const gameOverScreen = document.createElement("div");
gameOverScreen.id = "game-over";
gameOverScreen.innerHTML = `
    <h1 class="epic-title">K.O.</h1>
    <h2 id="final-score-text" style="font-size: 3rem;">SCORE: 0</h2>
    <button class="epic-btn" onclick="location.reload()">RETRY?</button>
`;
document.body.appendChild(gameOverScreen);

// --- GAME LOGIC & THREE.JS ---
let score = 0, isGameOver = true, bagZ = 0, difficulty = 1.0;
let bagState = "neutral", stateTimer = 0;
const MAX_Z = 25;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2c3e50);
const camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, -2, 38);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const light = new THREE.DirectionalLight(0xffffff, 0.8);
light.position.set(5, 10, 7);
scene.add(light);

// The Punching Bag
const pivot = new THREE.Group();
pivot.position.y = 12;
scene.add(pivot);

const bagGroup = new THREE.Group();
bagGroup.position.y = -13;
pivot.add(bagGroup);

const bagMat = new THREE.MeshToonMaterial({ color: 0x3498db });
const body = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 8, 20), bagMat);
const top = new THREE.Mesh(new THREE.SphereGeometry(3, 20, 20), bagMat);
top.position.y = 4;
const bot = new THREE.Mesh(new THREE.SphereGeometry(3, 20, 20), bagMat);
bot.position.y = -4;
bagGroup.add(body, top, bot);

// Gloves
const leftGlove = new THREE.Group();
const rightGlove = new THREE.Group();
const gloveMat = new THREE.MeshToonMaterial({ color: 0xe23636 });
const gloveMesh = new THREE.Mesh(new THREE.SphereGeometry(2, 16, 16), gloveMat);
gloveMesh.scale.set(1, 1.2, 1.4);

leftGlove.add(gloveMesh.clone());
rightGlove.add(gloveMesh.clone());
leftGlove.position.set(-4, -6, 25);
rightGlove.position.set(4, -6, 25);
scene.add(leftGlove, rightGlove);

// --- FUNCTIONS ---
window.initGame = () => {
    isGameOver = false;
    startScreen.style.display = "none";
    animate();
};

function spawnText(msg, x, y) {
    const t = document.createElement("div");
    t.className = "hit-text";
    t.innerText = msg;
    t.style.left = x + "px";
    t.style.top = y + "px";
    document.body.appendChild(t);
    setTimeout(() => {
        t.style.transform = "translateY(-100px) scale(1.5)";
        t.style.opacity = "0";
    }, 50);
    setTimeout(() => t.remove(), 600);
}

function punch(x) {
    if (isGameOver) return;
    
    // Simple Glove Animation
    const glove = x < window.innerWidth / 2 ? leftGlove : rightGlove;
    const originalZ = glove.position.z;
    glove.position.z -= 10;
    setTimeout(() => glove.position.z = originalZ, 100);

    if (bagState === "attack") {
        score++;
        uiScore.innerText = score;
        bagZ -= 12;
        bagState = "stunned";
        stateTimer = Date.now() + 500;
        bagMat.color.setHex(0xffffff);
        difficulty += 0.1;
        spawnText("POW!", x, window.innerHeight / 2);
    } else {
        bagZ += 4;
        spawnText("MISS!", x, window.innerHeight / 2);
    }
}

function animate() {
    if (isGameOver) return;
    requestAnimationFrame(animate);

    let now = Date.now();

    // AI Logic
    if (bagState === "neutral") {
        bagZ += 0.05 * difficulty;
        bagMat.color.setHex(0x3498db);
        if (now > stateTimer) {
            bagState = "warning";
            stateTimer = now + 800;
        }
    } else if (bagState === "warning") {
        bagMat.color.setHex(0xffcc00);
        if (now > stateTimer) {
            bagState = "attack";
            stateTimer = now + 600;
        }
    } else if (bagState === "attack") {
        bagZ += 0.4 * difficulty;
        bagMat.color.setHex(0xe23636);
        if (now > stateTimer) {
            bagState = "neutral";
            stateTimer = now + 1000;
        }
    } else if (bagState === "stunned" && now > stateTimer) {
        bagState = "neutral";
    }

    pivot.position.z = bagZ;

    if (bagZ >= MAX_Z) {
        isGameOver = true;
        document.getElementById("final-score-text").innerText = "SCORE: " + score;
        gameOverScreen.style.display = "flex";
    }

    renderer.render(scene, camera);
}

window.addEventListener("pointerdown", (e) => punch(e.clientX));
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
