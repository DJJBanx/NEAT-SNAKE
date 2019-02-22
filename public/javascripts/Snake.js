import Genome from "./NEAT/Genome.js";

class Snake {
    constructor(small = false, appleColor = '#F00', snakeColor = "#0F0", name, pos = [5, 5], length = 0, applePos = [1, 1], direction = -2, inputs, outputs, useModel=false) {
        this.useModel = useModel;
        this.genome = new Genome(inputs || pathInputs, outputs || pathOutputs);

        this.pos = (pos[0] < amountOfLinearSquares) ? pos : [3, 3];
        this.length = length;
        this.body = [];
        this.applePos = applePos;
        this.direction = direction;
        this.lastThoughtDirection = direction;
        this.dead = false;
        this.startingMemory = [this.pos.slice(), applePos.slice(), direction, length];
        this.memoryBank = [];
        this.memory = -2;
        this.appleMemory = 0;
        this.appleMemoryBank = [];

        this.appleColor = appleColor;
        this.snakeColor = snakeColor;
        this.small = small;
        this.name = name || randomName();

        this.gen = 0;
        this.score = 0;
        this.moves = 0;
        this.lastAppleMove = 0;
        this.fitness = 0;
        this.vision = [];
        // for (let i = 0; i < inputs; i++) for (let j = 0; j < amountOfLinearSquares; j++) {
        //     this.vision[i] = 0;
        // }
        this.decision = [0, 0, 0, 0];
    }

    get direction() {
        return this._direction;
    }

    set direction(dir) {
        //             (-dir === this.lastThoughtDirection) ? this.lastThoughtDirection :
        //              \                                                              /
        this._direction =                                                              dir;
    }

    randomApple() {
        this.applePos[0] = Math.floor(Math.random() * Math.floor(amountOfLinearSquares));
        this.applePos[1] = Math.floor(Math.random() * Math.floor(amountOfLinearSquares));

        if (this.body.length >= amountOfLinearSquares ** 2 - 1) {
            this.score += 100;
            this.die();
            return;
        }
        if (comparePos(this.applePos, this.pos)) {
            this.randomApple();
        } else if (this.body.length > 1) {
            this.body.forEach((val) => {
                if (comparePos(val, this.applePos)) {
                    this.randomApple();
                }
            });
        } else if (this.body.length === 1) {
            if (comparePos(this.body[0], this.applePos)) {
                this.randomApple();
            }
        }
    }

    look() {
        // Apple Position - Player Head Position / amountOfLinearSquares

        // this.vision[0] = (this.applePos[0] - this.pos[0]) / amountOfLinearSquares;
        // this.vision[1] = (this.applePos[1] - this.pos[1]) / amountOfLinearSquares;

        // Direction
        this.vision[2] = (Math.abs(this.direction) === 1) ? this.direction : 0;
        this.vision[3] = (Math.abs(this.direction) === 2) ? this.direction / 2 : 0;

        this.vision[0] = ((this.applePos[0] - this.pos[0]) / amountOfLinearSquares) * this.vision[2];
        this.vision[1] = ((this.applePos[1] - this.pos[1]) / amountOfLinearSquares) * this.vision[3];

        if (this.useModel) {
            let startingLeftToRight = 0;
            if (this.vision[2] !== 0) startingLeftToRight = (this.vision[2] > 0) ? 0 : 2;
            else startingLeftToRight = (this.vision[3] > 0) ? 1 : 3;

            let topRightBottomLeft = [0, 0, 0, 0];

            if (this.pos[0] === 0) topRightBottomLeft[3] = 1;
            if (this.pos[0] === amountOfLinearSquares - 1) topRightBottomLeft[1] = 1;
            if (this.pos[1] === 0) topRightBottomLeft[0] = 1;
            if (this.pos[1] === amountOfLinearSquares - 1) topRightBottomLeft[2] = 1;

            this.body.forEach((bodyPart) => {
                if (bodyPart[1] === this.pos[1]) {
                    if (bodyPart[0] === this.pos[0] - 1) topRightBottomLeft[3] = 1;
                    if (bodyPart[0] === this.pos[0] + 1) topRightBottomLeft[1] = 1;
                }
                if (bodyPart[0] === this.pos[0]) {
                    if (bodyPart[1] === this.pos[1] + 1) topRightBottomLeft[2] = 1;
                    if (bodyPart[1] === this.pos[1] - 1) topRightBottomLeft[0] = 1;
                }
            });

            topRightBottomLeft = topRightBottomLeft.concat(topRightBottomLeft);

            this.vision[3] = runSpecialModel(this.vision.slice())[0];
            this.vision[0] = topRightBottomLeft[startingLeftToRight++];
            this.vision[1] = topRightBottomLeft[startingLeftToRight++];
            this.vision[2] = topRightBottomLeft[startingLeftToRight];
        }
        // this.vision[4] = this.lastThoughtDirection;
        return this.vision.slice();
    }

    think() {
        let middlePoint = 0;
        if (this.lastThoughtDirection%2 === 0) middlePoint = (this.lastThoughtDirection > 0) ? 2 : 4;
        else middlePoint = (this.lastThoughtDirection > 0) ? 1 : 3;

        // -1 -> -0.33 -> 0.33 -> 1
        this.decision = this.genome.feedForward(this.vision);
        // let dec = [[-2, 1, 2, -1],['up', 'right', 'down', 'left']];
        let dec = [-2,1,2,-1,-2,1];

        middlePoint += (this.decision < -0.33) ? -1 : (this.decision > 0.33) ? 1 : 0;

        this.direction = dec[middlePoint];

        if (this.memory >= 0) this.direction = this.memoryBank[this.memory];
        else this.memoryBank.push(this.direction);

        this.lastThoughtDirection = this.direction;

        if (this.memory >= 0) this.memory++;

        return this.decision;
    }

    move() {
        if (this.length > 0) {
            for (let i = this.length - 1; i > 0; i--) if (this.body[i - 1]) this.body[i] = this.body[i - 1].slice();
            this.body[0] = this.pos.slice();
        }

        if (this.direction % 2 !== 0) this.pos[0] += this.direction;
        else this.pos[1] += this.direction / 2;

        if ((this.pos[1] < 0) || (this.pos[1] >= amountOfLinearSquares) || (this.pos[0] < 0) || (this.pos[0] >= amountOfLinearSquares)) this.die();

        if (this.body.length > 3) this.body.forEach((val) => {
            if (comparePos(val, this.pos)) this.die();
        });

        if (comparePos(this.applePos, this.pos)) {
            if (this.useModel) this.length++;
            if (this.memory < 0) this.score += 5;
            this.lastAppleMove = this.moves;
            if (this.memory < -1) {
                this.randomApple();
                this.appleMemoryBank.push(this.applePos.slice());
            } else {
                this.applePos = this.appleMemoryBank[this.appleMemory].slice();
                this.appleMemory++;
            }
        }

        if (!this.dead) this.moves++;
        if (this.moves - this.lastAppleMove > (amountOfLinearSquares ** 2) - 1) this.die();
    }

    updateForHOF() {
        let vise = this.look();
        let dec = this.think();
        this.move();
        if (this.dead) this.playMemory();
        return [vise, dec];
    }

    die() {
        this.dead = true;
    }

    undie() {
        this.dead = false;
        this.playMemory();
        this.memory = -2;
        this.memoryBank = [];
        this.appleMemoryBank = [];
    }

    playMemory() {
        this.dead = false;
        this.memory = 0;
        this.pos = this.startingMemory[0].slice();
        this.applePos = this.startingMemory[1].slice();
        this._direction = this.startingMemory[2];
        this.length = this.startingMemory[3];
        this.lastThoughtDirection = this.direction;
        this.body = [];
        this.appleMemory = 0;
    }

    // noinspection JSUnusedGlobalSymbols
    crossover(snake2) {
        let babyGenome = this.genome.crossover(snake2.genome);
        let babySnake = new Snake();
        babySnake.genome = babyGenome;
        babySnake.snakeColor = addColors(this.snakeColor, snake2.snakeColor);
        babySnake.appleColor = addColors(this.appleColor, snake2.appleColor);
        babySnake.small = (Math.random() > 0.5) ? this.small : snake2.small;
        babySnake.useModel = this.useModel;
        return babySnake;
    }

    calculateFitness() {
        this.fitness = 5 + this.score;
    }

    clone(isChild = false) {
        //small = false, appleColor='#F00', snakeColor="#0F0", name, pos=[5,5], length=0, applePos=[1,1], direction=-2
        //this.startingMemory = [this.pos.slice(), applePos.slice(), direction, length];
        let randomInfo = randomPosInfo();
        let tmp = new Snake(this.small, this.appleColor, this.snakeColor, this.name, randomInfo[0], this.startingMemory[3], randomInfo[1], randomInfo[2], this.genome.inputs, this.genome.outputs, this.useModel);
        tmp.genome = this.genome.clone();

        if (isChild) {
            if (tmp.name.includes(' ')) {
                let newtmp = tmp.name.split(' ');
                let n = parseInt(newtmp[1]);
                tmp.name = newtmp[0] + ' ' + (n + 1).toString(10);
            }
            else tmp.name += ' 2';
        }

        return tmp;
    }

    cloneForHallOfFame() {
        let tmp = new Snake(this.small, this.appleColor, this.snakeColor, this.name, this.startingMemory[0].slice(), this.startingMemory[3], this.startingMemory[1].slice(), this.startingMemory[2], this.genome.inputs, this.genome.outputs, this.useModel);
        tmp.genome = this.genome.clone();
        tmp.memory = this.memory;
        tmp.memoryBank = this.memoryBank.slice();
        tmp.appleMemoryBank = this.appleMemoryBank.slice();
        tmp.fitness = this.fitness;
        tmp.score = this.score;
        tmp.gen = this.gen;

        return tmp;
    }

    draw(ctx, showBrain = false) {
        ctx.fillStyle = this.snakeColor;
        fillCell(ctx, this.pos, this.small);
        this.body.forEach((val) => {
            ctx.fillStyle = this.snakeColor;
            if (val) fillCell(ctx, val, this.small);
        });

        ctx.fillStyle = this.appleColor;
        fillCell(ctx, this.applePos, this.small);

        if (showBrain) this.genome.draw(ctx);
    }
}

export default Snake;