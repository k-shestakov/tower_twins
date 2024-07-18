const plane = document.querySelector('.plane');
const gameField = document.querySelector('.game__field');
const gamePlanes = document.querySelectorAll('.game__plane');
const gameScore = document.querySelector('.game__score');
const messageStart = document.querySelector('.message--start');
const messageContinue = document.querySelector('.message--continue');
const messageRestart = document.querySelector('.message--restart');

const frameHeight = document.documentElement.clientHeight;
const planeTopPosition = 30;
const countTopPosition = Math.floor(frameHeight * (planeTopPosition / 100));

const STATUS_GAME = {
    idle: 'idle',
    playing: 'playing',
    lose: 'lose',
};

let status = STATUS_GAME.idle;
let planes = 2;
let score = 0;
let isFalling = true;
let fallSpeed = 0;
let angle = 0;
let towersInterval;
let addSmoke = false;

const audioScore = new Audio();
const audioLose = new Audio();

audioScore.src = './audio/score.wav';
audioLose.src = './audio/lose.wav';

const setPlanePosition = () => plane.style.top = `${countTopPosition}px`;

setPlanePosition();

function move() {
    const planePosition = plane.getBoundingClientRect();
    let topPosition = parseFloat(plane.style.top);

    const relativeFallSpeed = frameHeight * 0.0050;
    const relativeRiseSpeed = frameHeight * 0.0060;

    if (isFalling) {
        fallSpeed = Math.min(fallSpeed + 0.15, relativeFallSpeed)
        topPosition += fallSpeed;
        angle = Math.min(angle + 1, 8);
    } else {
        fallSpeed = 0;
        topPosition -= relativeRiseSpeed; 
        angle = -8;
    }

    plane.style.top = `${topPosition}px`;
    plane.style.transform = `rotate(${angle}deg)`;

    countScore();

    if (checkCollision()) {
        return checkStatus();
    }

    if (topPosition + 100 < 0) {
        return checkStatus();
    }

    if (planePosition.bottom + 3 > frameHeight) {
        return checkStatus();
    }

    requestAnimationFrame(move);
}

function checkStatus() {
    clearInterval(towersInterval);
    audioLose.play();
    planes--;

    if (planes > 0) {
        updateState();
    } else {
        updateStateToInitial();
    }

    pauseTowers();
}

function checkCollision() {
    const planeRect = plane.getBoundingClientRect();
    const towers = document.querySelectorAll('.tower');
    
    for (const tower of towers) {
        const towerRect = tower.getBoundingClientRect();
        if (
            planeRect.left < towerRect.right &&
            planeRect.right > towerRect.left &&
            planeRect.top < towerRect.bottom &&
            planeRect.bottom > towerRect.top
        ) {
            addSmoke = true;
            return true;
        }
    }

    return false;
}

function countScore() {
    const planeRect = plane.getBoundingClientRect();
    const towers = document.querySelectorAll('.tower--down');
    
    for (const tower of towers) {
        const towerRect = tower.getBoundingClientRect();
        if (towerRect.right < planeRect.right && tower.dataset.passed !== 'true') {
            score++;
            gameScore.textContent = score;
            audioScore.play();
            tower.dataset.passed = 'true';
        }
    }
}

function startGame(e) {
    if (e.code === 'Space') {
        document.removeEventListener('keydown', startGame);
        status = STATUS_GAME.playing;
        messageStart.classList.add('hidden');
        move();

        startCreatingTowers();
    }
}

function hideMessages() {
    messageContinue.classList.add('hidden');
    messageRestart.classList.add('hidden');
}

function restartGame(e) {
    if (e.code === 'Space') {
        if (planes === 2) {
            gamePlanes[0].src = './images/try-g.png';
            gamePlanes[1].src = './images/try-g.png';
            gameScore.textContent = 0;
        }

        document.removeEventListener('keydown', restartGame);
        hideMessages();
        status = STATUS_GAME.playing;
        setPlanePosition();
        
        removeAllTowers()
        startCreatingTowers();
        move();
    }
}

function updateState() {
    status = STATUS_GAME.idle;
    plane.style.transform = `rotate(0deg)`;
    gamePlanes[1].src = './images/try-l.png';
    messageContinue.classList.remove('hidden');

    document.addEventListener('keydown', restartGame);
}

function updateStateToInitial() {
    planes = 2;
    score = 0;
    addSmoke = false;
    status = STATUS_GAME.lose;
    gamePlanes[0].src = './images/try-l.png';
    plane.style.transform = `rotate(0deg)`;
    messageRestart.classList.remove('hidden');
    
    document.addEventListener('keydown', restartGame);
}

function handleUp(e) {
    if (e.code === 'Space') {
        isFalling = true;
    }
}

function handleDown(e) {
    if (e.code === 'Space') {
        isFalling = false;
    }
}

document.addEventListener('keydown', startGame);
document.addEventListener('keydown', handleDown);
document.addEventListener('keyup', handleUp);

function getRandomHeight(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createTowers() {
    if (status !== STATUS_GAME.playing) return;

    const tower1 = document.createElement('div');
    const tower2 = document.createElement('div');
    const aerial = document.createElement('span');
    
    const fullHeight = 100;
    const gap = 20;
    const maxHeight = 70;
    const minHeight = 10;

    const tower1Height = getRandomHeight(minHeight, maxHeight);
    const tower2Height = fullHeight - gap - tower1Height;

    aerial.classList.add('aerial');

    const towerWithAerial = Math.random() < 0.5 ? tower1 : tower2;
    towerWithAerial.append(aerial);   

    tower1.style.height = `${tower1Height}%`;
    tower2.style.height = `${tower2Height}%`;

    tower1.classList.add('tower', 'tower--down');
    tower2.classList.add('tower', 'tower--up');

    if (planes < 2 && addSmoke) {
        const smoke = document.createElement('img');
        
        smoke.style.top = '-90px';
        smoke.classList.add('smoke');
        smoke.src = './images/smoke.gif';

        towerWithAerial.append(smoke);
    }

    gameField.append(tower1);
    gameField.append(tower2);

    tower1.addEventListener('animationend', () => {
        tower1.remove();
    });

    tower2.addEventListener('animationend', () => {
        tower2.remove();
    });
}

function startCreatingTowers() {
    towersInterval = setInterval(() => {
        if (status === STATUS_GAME.playing) {
            createTowers();
        } else {
            clearInterval(towersInterval);
        }
    }, 3000);
}

function pauseTowers() {
    const towers = document.querySelectorAll('.tower');
    towers.forEach(tower => {
        tower.style.animationPlayState = 'paused';
    });
}

function removeAllTowers() {
    const towers = document.querySelectorAll('.tower');
    towers.forEach(tower => {
        tower.remove();
    });
}

function createCloud() {
    const cloud = document.createElement('img');
    cloud.src = 'images/cloud.png';
    cloud.alt = 'Cloud';
    cloud.classList.add('cloud');
    cloud.style.top = `${Math.random() * 30}%`;
    
    if (document.querySelectorAll('.cloud').length === 0) {
        cloud.style.animationDelay = '-3s';
    }

    gameField.append(cloud);

    cloud.addEventListener('animationiteration', () => {
        cloud.remove();
    });
}

createCloud();

setInterval(() => createCloud(), 9000);
