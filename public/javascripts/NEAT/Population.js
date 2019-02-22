import Snake from "../Snake.js";
import Species from "./Species.js";

class Population {
    constructor(size, numberOfSize=1) {
        this.innovationHistory = [];
        this.currentPool = 0;
        this.bestPlayer = null;
        this.bestPlayersByGen = [];
        this.bestScore = 0;
        this.gen = 0;
        this.species = [];

        this.killEveryoneLOL = false;
        this.popLife = false;
        this.done = false;

        this.poolLife = 0;
        this.popLife = 0;

        this.population = [];
        if (numberOfSize < 1) numberOfSize = 1;
        for (let i = 0; i < numberOfSize; i++) {
            let popSection = [];
            for (let j = 0; j < size; j++) {
                let randomInfo = randomPosInfo();
                let tmpPlayer = new Snake(Math.random() <= 0.5, getRandomColor(), getRandomColor(), randomName(), randomInfo[0], 0, randomInfo[1], randomInfo[2], surviveInputs, surviveOutputs, surviveOrPathfind);
                tmpPlayer.genome.mutate(this.innovationHistory);
                popSection.push(tmpPlayer);
            }
            this.population.push(popSection);
        }

        this.snakeID = Math.floor(Math.random()* this.population[this.currentPool].length);
        this.drawingSnake = this.population[this.currentPool][this.snakeID];
    }

    update() {
        this.poolLife++;
        let dead = true;
        this.population[this.currentPool].forEach((val) => {
            if (!val.dead) {
                val.look();
                val.think();
                val.move();
                if (!val.dead) dead = false;
            }
        });
        if (dead) {
            // console.log('everyone dead, sad');
            this.currentPool++;
            if (this.poolLife > this.popLife) this.popLife = this.poolLife;
            if (this.currentPool >= this.population.length) this.done = true;
        }
    }

    draw(ctx, showBrain = false) {
        // console.log('Drawing: ', this.done);
        while (!this.done && this.drawingSnake.dead) {
            // console.log('Finding new snake');
            this.snakeID = Math.floor(Math.random()* this.population[this.currentPool].length);
            this.drawingSnake = this.population[this.currentPool][this.snakeID];
        }

        if (!this.done) this.drawingSnake.draw(ctx, showBrain);

        ctx.textAlign = "left";
        ctx.font = '30px serif';
        ctx.fillStyle = "#FFF";
        let text1 = (this.done) ? 'Natural Selection Initiated' : 'Snake: ' + (this.snakeID + (this.currentPool * this.population[this.currentPool].length)) + ' Name: ' + this.drawingSnake.name + ' Gen: ' + (this.gen+1) + ' Pool: ' + (this.currentPool+1);
        let text2 = (this.done) ? '' : 'Score: ' + this.drawingSnake.score;
        ctx.fillText(text1, w+25, 20);
        ctx.fillText(text2, w+25, 60);
    }

    naturalSelection() {
        this.speciate();
        this.calculatePlayersFitness();
        this.sortSpecies();
        if (this.killEveryoneLOL) {
            this.species.splice(massExtinctionConfig, this.species.length - massExtinctionConfig);
            this.killEveryoneLOL = false;
        }
        this.cullSpecies();
        this.setBestPlayer();
        this.killStaleAndBadSpecies();

        let avgSum = this.getAvgFitnessSum();
        let newGeneration = [];

        debug = this.gen % 10 === 0;

        if (debug) {
            console.log('========================================================================');
            console.log('Generation: ', this.gen + 1, ' // Number of Mutations: ', this.innovationHistory.length, ' // Number of Species: ', this.species.length);
            console.log('<><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>');
        }

        this.species.forEach((species, speciesRank) => {
            if (debug) {
                console.log('#', speciesRank + 1, ' Species: ' + species.name + ' Best Fitness (UA): ', species.bestFitness, ' -----------------');
                console.log('(', species, ')');
            }
            species.players.forEach((player, playerRank) => {
                if (debug && (playerRank < 4 || playerRank > species.length-6)) console.log('=== #', playerRank + 1, ": ", player.name, " -------- Fitness: ", player.fitness, ' // Score: ', player.score, ' ----------------');
            });

            newGeneration.push(species.champion.clone(true));
            let noOfChildren = Math.floor(species.averageFitness / avgSum * this.population.length * this.population[0].length) - 1;
            for (let i = 0; i < noOfChildren; i++) newGeneration.push(species.getChild(this.innovationHistory, this.gen+1));
        });

        while (newGeneration.length < this.population.length * this.population[0].length) newGeneration.push(this.species[0].getChild(this.innovationHistory, this.gen + 1));

        for (let i = 0; i < this.population.length; i++) this.population[i] = newGeneration.slice(i*this.population[i].length, (i+1)*this.population[i].length);

        this.gen += 1;

        this.popLife = 0;
        this.poolLife = 0;
        this.currentPool = 0;
        this.done = false;
        this.snakeID = Math.floor(Math.random()* this.population[this.currentPool].length);
        this.drawingSnake = this.population[this.currentPool][this.snakeID];
    }

    setBestPlayer() {
        let tmpBest = this.species[0].players[0];
        tmpBest.gen = this.gen;

        if (tmpBest.score > this.bestScore) {
            this.bestPlayersByGen.push(tmpBest.cloneForHallOfFame());
            this.bestScore = tmpBest.score;
            this.bestPlayer = tmpBest.cloneForHallOfFame();
            console.log('==================');
            console.log('New Hall of Famer!');
            console.log('Score: ', tmpBest.score);
            console.log(this.bestPlayer);
            console.log('==================');
        }
    }

    iteratePlayers(cbk) {
        this.population.forEach((pool) => {
            pool.forEach(cbk);
        });
    }

    speciate() {
        this.species.forEach((val) => {
            val.players = [];
        });

        this.iteratePlayers((player) => {
            let speciesFound = false;
            for (let i = 0; i < this.species.length; i++) {
                if (this.species[i].sameSpecies(player.genome)) {
                    this.species[i].addToSpecies(player);
                    speciesFound = true;
                    break;
                }
            }
            if (!speciesFound) this.species.push(new Species(player));
        });
    }

    calculatePlayersFitness() {
        this.iteratePlayers((player) => {
            player.calculateFitness();
        });
    }

    sortSpecies() {
        this.species.forEach((val) => {
            val.sortPlayers();
        });

        this.species.sort((a,b) => {
            return (a.bestFitness > b.bestFitness) ? -1 : 1;
        });
    }

    killStaleAndBadSpecies() {
        if (this.species.length < 2) return;

        let avgSum = (this.species[0].averageFitness || 0) + (this.species[1].averageFitness || 0);
        for (let i = 2; i < this.species.length; i++) {
            if (this.species[i].staleness >= 20) {
                this.species.splice(i, 1);
                i--;
            } else avgSum += this.species[i].averageFitness;
        }

        for (let i = 1; i < this.species.length; i++) {
            if (this.species[i].averageFitness / avgSum * this.population.length * this.population[0].length < 1) {
                this.species.splice(i, 1);
                i--;
            }
        }
    }

    cullSpecies() {
        this.species.forEach((val) => {
            val.cull();
            val.fitnessSharing();
            val.setAverage();
        });
    }

    getAvgFitnessSum() {
        let avgSum = 0;
        this.species.forEach((val) => {
            avgSum += val.averageFitness;
        });
        return avgSum;
    }
}

export default Population;