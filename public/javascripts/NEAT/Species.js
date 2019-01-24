class Species {
    constructor(p = null) {
        this.players = (p) ? [p] : [];
        this.bestFitness = (p) ? p.fitness : 0;
        this.champion = (p) ? p.clone() : null;
        this.averageFitness = 0;
        this.staleness = 0;
        this.name = (p) ? p.name : '';
    }

    // Returns an array with ExcessAndDisjoint in slot 0 and AvgWeightDifference in slot 1
    getInformation(brain1, brain2) {
        let matching = 0, totalDiff = 0.0;
        brain1.genes.forEach((val1) => {
            for (let i = 0; i < brain2.genes.length; i++) if (val1.innovationNumber === brain2.genes[i].innovationNumber) {
                matching++;
                totalDiff += Math.abs(val1.weight - brain2.genes[i].weight);
                break;
            }
        });
        return [brain1.genes.length + brain2.genes.length - 2 * matching, (matching) ? totalDiff/matching : 100];
    }

    sameSpecies(genome) {
        let information = this.getInformation(this.champion.genome, genome);

        let compatibility = excessCoeff * information[0] / largeGeneNormalizer + weightDiffCoeff * information[1];
        return compatibility < compatibilityThreshold;
    }

    addToSpecies(player) {
        this.players.push(player);
    }

    sortPlayers() {
        this.players.sort((a,b) => {
            return (a.fitness > b.fitness) ? -1 : 1;
        });

        if (this.players.length === 0) return this.staleness = 200;

        if (this.players[0].fitness > this.bestFitness) {
            this.staleness = 0;
            this.bestFitness = this.players[0].fitness;
            this.champion = this.players[0].clone();
            if (this.name !== this.players[0].name) this.name += '-' + this.players[0].name
        } else this.staleness++;
    }

    setAverage() {
        let sum = 0;
        this.players.forEach((val) => {
            sum += val.fitness;
        });
        this.averageFitness = sum / this.players.length;
    }

    selectPlayer() {
        let randomFitness = Math.floor(Math.random() * (this.averageFitness * this.players.length));
        let fitnessSum = 0;

        for (let i = 0; i < this.players.length; i++) {
            fitnessSum += this.players[i].fitness;
            if (fitnessSum > randomFitness) return this.players[i];
        }
    }

    getChild(innovationHistory, gen) {
        let baby = null, rand = Math.random();
        //                                    0.25
        if (this.players.length < 2 || rand < 0.10) baby = this.selectPlayer().clone(true);
        else {
            let p1 = this.selectPlayer();
            let p2 = this.selectPlayer();

            baby = (p1.fitness > p2.fitness) ? p1.crossover(p2) : p2.crossover(p1);
        }
        baby.genome.mutate(innovationHistory);
        return baby;
    }


    cull() {
        this.players.splice(Math.ceil(this.players.length/2), Math.ceil(this.players.length/2));
    }

    fitnessSharing() {
        this.players.forEach((val, index, arr) => {
            val.fitness /= arr.length;
        });
    }
}

export default Species;