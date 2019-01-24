import Snake from "./Snake.js";
import Population from "./NEAT/Population";

console.log('starting');

// Snakes
// noinspection JSValidateTypes
globalAccessorPlayers = [];


for (let i = 0; i < 200; i++) {
    globalAccessorPlayers[i] = new Snake(Math.random() <= 0.5, getRandomColor(), getRandomColor(), randomName());
}

let iHT2 = [];

let cp = 0;
let currentPlayer = players[cp];

function changePlayer(cp) {
    // console.log('Changing player!');
    // console.log('==============================');
    // console.log("PLAYERS: " + players);
    // console.log('==============================');
    currentPlayer = players[cp];
    currentPlayer.genome.mutate(iHT2);
    // console.log('CURRENT PLAYER (' + cp + '): ' + currentPlayer);
    // console.log('==============================');
    if (currentPlayer.memory >= 0) currentPlayer.playMemory();
    if (win) {
        win = false;
        gameLoop();
    }
}

// Window Key Listener
window.addEventListener('keydown', (event) => {
    // console.log(event.key);
    if (currentPlayer.memory < 0) switch (event.key) {
        case "Down": // IE/Edge specific value
        case "ArrowDown":
            currentPlayer.direction = 2;
            break;
        case "Up": // IE/Edge specific value
        case "ArrowUp":
            currentPlayer.direction = -2;
            break;
        case "Left": // IE/Edge specific value
        case "ArrowLeft":
            currentPlayer.direction = -1;
            break;
        case "Right": // IE/Edge specific value
        case "ArrowRight":
            currentPlayer.direction = 1;
            break;
    } else switch (event.key) {
        case "=":
            if (win) {
                win = false;
                gameLoop();
            } else win = true;
            break;
        case "]":
            if (win) {
                frames = speed+1;
                gameLoop();
            }
            break;
        case "d":
            cp++;
            if (cp === players.length) cp = 0;
            changePlayer(cp);
            break;
        case "a":
            cp--;
            if (cp < 0) cp = players.length-1;
            changePlayer(cp);
            break;
        case "m":
            currentPlayer.genome.mutate(iHT2);
            break;
        case "r":
            currentPlayer.undie();
            if (win) {
                win = false;
                gameLoop();
            }
            break;
        // case "w":
        //     dualScreen = true;
        //     currentPlayer.playMemory();
        //     p2.playMemory();
        //     break;
        // case "s":
        //     dualScreen = false;
        //     break;
    }
});

//Framerate manipulation
let frames = 0;

function gameLoop() {
    animate();
    update();
    if (!win) requestAnimationFrame(gameLoop);
}

function update() {
    if (frames > speed) {
        frames = 0;
        currentPlayer.look();
        currentPlayer.think();
        currentPlayer.move();
        // if (dualScreen) {
        //     p2.think();
        //     p2.move();
        // }
    } else {
        frames++;
    }
}

function animate() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = "#FFF";

    for (let i = 0; i<= amountOfLinearSquares;i++) {
        ctx.beginPath();
        ctx.moveTo(i*squareSize,0);
        ctx.lineTo(i*squareSize,w);
        ctx.stroke();
    }
    for (let j = 0; j <= amountOfLinearSquares;j++) {
        ctx.beginPath();
        ctx.moveTo(0,j*squareSize);
        ctx.lineTo(w,j*squareSize);
        ctx.stroke();
    }

    currentPlayer.draw(ctx);
    currentPlayer.drawBrain(ctx);
    // if (dualScreen) p2.draw(ctx);
}

currentPlayer.genome.mutate(iHT2);
gameLoop();