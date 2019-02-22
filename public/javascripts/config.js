//////////////////////////////
//////////GLOBALS/////////////
//////////////////////////////

//Configurable Global Values
const w=1200;
const amountOfLinearSquares = 8;
const strokeWidth = 4;
let nextConnectionNumber = 1000;
let debug = false;

const surviveOrPathfind = true;
const bestPathfindingBrain = [[0,5,0.8518220491764472],[1,6,0.5991215048228515],[1,5,0.32740373951950563],[3,5,-0.0026339383729878287],[4,5,-0.9463482255549144],[5,6,0.4976263111438737]];
let globalAccessorPlayers = 'GAP: String to acknowledge this exists';
let globalAccessorHallOfFame = 'GAHOF: String to acknowledge this exists';

//Species Globals
const excessCoeff = 1.5;
const weightDiffCoeff = 1;
const compatibilityThreshold = 3;
const largeGeneNormalizer = 10; // Idk what this is or why it exists

//Population Globals
const massExtinctionConfig = 5;

//Neural Network Configs
// const appleWorth = 0;
// const bodyWorth = -1;
// const headWorth = 5;
const pathInputs = 4;
const pathOutputs = 1;
const surviveInputs = 4;
const surviveOutputs = 1;


const IONames = ['Player X', 'Player Y', 'Apple X', 'Apple Y', 'Distance to Apple X', 'Distance to Apple Y', 'Length', 'Direction X', 'Direction Y', 'Body Parts in way',
                 'Up', 'Right', 'Down', 'Left',
                 'Bias Node'];

//Size of cell blocks
const squareSize = w / amountOfLinearSquares;
const squareSizeOver8 = w / 8;
const nodeRadii = squareSizeOver8 / 8;
const spaceBetweenLayers = squareSizeOver8 / 2;
const zeroWeightThicc = 2;

//Canvas
const canvas = document.getElementById('canvas');
canvas.width = w*2;
canvas.height = w + squareSize;
const ctx = canvas.getContext('2d');

// Framerate manipulation
let speed = 1;
let win = false;

//////////////////////////////
//////GLOBAL FUNCTIONS////////
//////////////////////////////

function runSpecialModel(inputs) {
    return runModel(bestPathfindingBrain, inputs, pathOutputs)
}

function runModel(model, inputs, outputLength) {
    inputs[inputs.length] = 1;
    let latestNodeActivated = inputs.length;

    model.forEach((connection, index, model) => {
        if (!inputs[connection[1]]) inputs[connection[1]] = 0;
        if (connection[0] >= latestNodeActivated) {
            inputs[connection[0]] = Math.tanh(inputs[connection[0]]);
            latestNodeActivated++;
        }
        inputs[connection[1]] += inputs[connection[0]] * connection[2];
    });

    for (let i = inputs.length-1; i >= inputs.length-outputLength; i--) inputs[i] = Math.tanh(inputs[i]);
    return inputs.slice(inputs.length-outputLength, inputs.length);
}

function comparePos(x,y) {
    return x[0] === y[0] && x[1] === y[1];
}

function fillCell(ctx,pos,small=false) {
    let x = pos[0]*squareSize + strokeWidth/2;
    let y = pos[1]*squareSize+strokeWidth/2;
    let size = squareSize-strokeWidth;

    if (small) {
        size /= 2;
        x += size/2;
        y += size/2;
    }

    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = "#FFF";
    ctx.fillRect(x + size / squareSize*8, y + size / squareSize*8, size / squareSize*8, size / squareSize*8);
}

// noinspection JSUnusedGlobalSymbols
function setSpeed(sped) {
    speed = sped;
}

let spareRandom = null;

function randomGaussian() {
    let val, u, v, s, mul;

    if (spareRandom !== null) {
        val = spareRandom;
        spareRandom = null;
    }
    else {
        do {
            u = Math.random() * 2 - 1;
            v = Math.random() * 2 - 1;

            s = u * u + v * v;
        } while (s === 0 || s >= 1);

        mul = Math.sqrt(-2 * Math.log(s) / s);

        val = u * mul;
        spareRandom = v * mul;
    }
    return val / 14;	// 7 standard deviations on either side
}

function normalizeColors(colorIn3Hex) {
    colorIn3Hex = colorIn3Hex.toUpperCase().substr(1);
    let hexes = colorIn3Hex.split('');
    for (let i = 0; i < hexes.length; i++) {
        // noinspection JSValidateTypes
        hexes[i] = parseInt(hexes[i], 16);
    }

    if (hexes.length === 6 || hexes.length === 3) {
        if (hexes.length === 6) {
            hexes[0] = hexes[0] + hexes[1];
            hexes[1] = hexes[2] + hexes[3];
            hexes[2] = hexes[4] + hexes[5];
        } else if (hexes.length === 3) {
            hexes[0] *= hexes[0];
            hexes[1] *= hexes[1];
            hexes[2] *= hexes[2];
        }
        let norm = (hexes[0] + hexes[1] + hexes[2]) / 255;
        if (norm !== 0) {
            hexes[0] = hexes[0] / norm;
            hexes[1] = hexes[1] / norm;
            hexes[2] = hexes[2] / norm;
        }
    } else {
        console.log(hexes);
        throw "COLOR ERROR: Normalize Color requires a 3 or 6 digit Hexadecimal Value starting with a '#'";
    }

    return [hexes[0], hexes[1], hexes[2]]
}

function addColors(color1, color2) {
    try {
        color1 = normalizeColors(color1);
        color2 = normalizeColors(color2);
    } catch (e) {
        console.log(color1, " // ", color2);
        console.log(e);
    }
    let color3 = '#';

    for (let i = 0; i < color1.length; i++) {
        let colorNumber = Math.round(color1[i] + color2[i]);
        if (colorNumber > 255) colorNumber -= (colorNumber - 255);
        let colorUnit = colorNumber.toString(16);
        if (colorUnit.length < 2) colorUnit = '0' + colorUnit;
        color3 += colorUnit;
    }

    if (color3.length < 7) {
        console.log("COLOR ERROR");
        console.log(color1);
        console.log(color2);
        console.log(color3);
    }

    return color3;
}

function randomNonVowel() {
    let letterIndex = 0;
    do letterIndex = Math.floor(Math.random() * 25) + 98; while ([101,105,111,117,121].includes(letterIndex));
    return String.fromCharCode(letterIndex);
}

randomVowel = _ => Array.from(['a', 'e', 'i', 'o', 'u', 'y'])[Math.floor(Math.random()*6)];

randomName = _ => (randomNonVowel().toUpperCase() + randomVowel() + ((Math.random() < 0.5) ? randomVowel() : '') + ((Math.random() < 0.5) ? randomNonVowel() : ''));

function getRandomColor() {
    let color = '#'+Math.floor(Math.random()*16777215).toString(16);
    while (color.length < 7) color = '#0' + color.substr(1,color.length);
    return color;
}

function randomPosInfo() {
    let pX = Math.floor(Math.random()*amountOfLinearSquares);
    let pY = Math.floor(Math.random()*amountOfLinearSquares);

    let aX = Math.floor(Math.random()*amountOfLinearSquares);
    let aY = Math.floor(Math.random()*amountOfLinearSquares);

    while (Math.abs(aX - pX) < 2) aX = Math.floor(Math.random()*amountOfLinearSquares);
    while (Math.abs(aY - pY) < 2) aY = Math.floor(Math.random()*amountOfLinearSquares);

    let apx = aX - pX;
    let apy = aY - pY;

    return [[pX, pY], [aX, aY], (Math.abs(apx) >= Math.abs(apy)) ? Math.sign(apx) : Math.sign(apy) * 2]
}