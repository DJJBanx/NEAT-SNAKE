class ConnectionHistory {
    constructor(fromID, toID, innovationNumber, innovationNumbers) {
        // console.log(innovationNumbers);
        // console.log(innovationNumbers.splice());
        this.fromNodeID = fromID;
        this.toNodeID = toID;
        this.innovationNumber = innovationNumber;
        this.innovationNumbers = innovationNumbers;
        // console.log(this.innovationNumbers);
    }

    matches(genome, from, to) {
        if (genome.genes.length === this.innovationNumbers.length && from.id === this.fromNodeID && to.id === this.toNodeID) {
            for (let i = 0;i<genome.genes.length;i++) if (!this.innovationNumbers.includes(genome.genes[i].innovationNumber)) return false;
            return true;
        }
        return false;
    }

}

export default ConnectionHistory;