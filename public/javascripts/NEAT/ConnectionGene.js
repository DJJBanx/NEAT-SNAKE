class ConnectionGene {
    constructor(from, to, weight, innoNumber) {
        this.fromNode = from;
        this.toNode = to;
        this.weight = weight;
        this.enabled = true;
        this.innovationNumber = innoNumber;
    }

    mutateweight() {
        let random = Math.random();

        if (random < 0.15) this.weight = (Math.random() * 2.2) - 1.1;
        else this.weight += randomGaussian() / 5;

        if (this.weight < -1) this.weight = -1;
        else if (this.weight > 1) this.weight = 1;
    }

    clone(from, to) {
        if (from === null || to === null) throw "You need to specify new nodes for the cloned gene to point to!";
        let temp = new ConnectionGene(from, to, this.weight, this.innovationNumber);
        temp.enabled = this.enabled;
        return temp;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.strokeStyle = (Math.sign(this.weight) > 0) ? "#00F" : (Math.sign(this.weight) === 0) ? "#777" : '#F00';
        ctx.lineWidth = zeroWeightThicc + Math.floor(zeroWeightThicc * 2 * this.weight);
        ctx.moveTo(this.fromNode.pos[0], this.fromNode.pos[1]);
        ctx.lineTo(this.toNode.pos[0], this.toNode.pos[1]);
        ctx.stroke();

        let x = this.fromNode.pos[0] + (this.toNode.pos[0] - this.fromNode.pos[0]);
        let y = this.fromNode.pos[1] + (this.toNode.pos[1] - this.fromNode.pos[1]);

        ctx.textAlign = "center";
        ctx.font = `${nodeRadii/2}px serif`;
        ctx.fillStyle = "#FFF";
        ctx.fillText(`${(this.weight).toFixed(3)}`, x, y);
    }
}

export default ConnectionGene;