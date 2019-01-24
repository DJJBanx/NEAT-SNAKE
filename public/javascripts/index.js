// Created by Jackson Harding 1/24/2019


import Population from "./NEAT/Population.js";

console.log('starting');

// Snakes
let players = new Population(400, 5);
globalAccessorPlayers = players;

let hallOfFame = players.bestPlayersByGen;
globalAccessorHallOfFame = hallOfFame;
let HOFIndex = 0;

let highlightReel = false;
let showBrain = false;
let fullThrottle = false;

// Window Key Listener
window.addEventListener('keydown', (event) => {
    // console.log(event.key);
    switch (event.key) {
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
        case "b":
            showBrain = !showBrain;
            break;
        case "h":
            highlightReel = !highlightReel;
            if (highlightReel) {
                HOFIndex = 0;
                hallOfFame[HOFIndex].playMemory();
                highlightReel = true;
                logHOF();
            }
            break;
        case "a":
            HOFIndex--;
            if (HOFIndex < 0) HOFIndex = hallOfFame.length-1;
            hallOfFame[HOFIndex].playMemory();
            logHOF();
            break;
        case "d":
            HOFIndex++;
            if (HOFIndex >= hallOfFame.length) HOFIndex = 0;
            hallOfFame[HOFIndex].playMemory();
            logHOF();
            break;
        case "f":
            fullThrottle = !fullThrottle;
            if (fullThrottle) destroyMyCPU();
            else gameLoop();
            break;
    }
});

function logHOF() {
    console.log('==============================================');
    console.log('Hall of Fame Player #' + (HOFIndex+1) + ": ");
    console.log(hallOfFame[HOFIndex]);
    console.log('==============================================');
}

function drawBackground() {
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
}

//Framerate manipulation
let frames = 0;

function gameLoop() {
    update();
    if (!fullThrottle) animate();
    if (!win && !fullThrottle) requestAnimationFrame(gameLoop);
}

function destroyMyCPU() {
    for (let i = 0; i < 1000; i++) {
        gameLoop();
    }
}

function update() {
    if (frames > speed) {
        frames = 0;

        // console.log('Everyone dead? : ' + players.done);

        if (highlightReel) {
            let balls = hallOfFame[HOFIndex].updateForHOF();
            console.log('Input: ', balls[0]);
            console.log('Output: ', balls[1]);
        }
        else {
            if (!players.done) {
                // console.log('Updating...');
                players.update();
                // console.log('Updated!')
            }
            else {
                // console.log('Natural Selecting...');
                players.naturalSelection();
                // console.log('Cream of the crop!');
            }
        }

    } else frames++;
}

function animate() {
    drawBackground();
    if (highlightReel) {
        hallOfFame[HOFIndex].draw(ctx, showBrain);

        ctx.textAlign = "left";
        ctx.font = '30px serif';
        ctx.fillStyle = "#FFF";
        let text1 = 'Name: ' + hallOfFame[HOFIndex].name + ' Gen: ' + (hallOfFame[HOFIndex].gen+1);
        let text2 = 'Score: ' + hallOfFame[HOFIndex].score;
        ctx.fillText(text1, w+25, 40);
        ctx.fillText(text2, w+25, 80);
    }
    else players.draw(ctx, showBrain);

}

gameLoop();