class Node {
    constructor(id) {
        this.id = id;
        this.inputSum = 0.0;
        this.outputSum = 0.0;
        this.outputConnections = [];
        this.layer = 0;
        this.pos = [0,0];
        this.active = false;
    }

    engage() {
        if (this.layer !== 0) this.outputSum = Node.sigmoid(this.inputSum);
        this.active = this.outputSum !== 0;
        this.outputConnections.forEach((val) => {
            if (val.enabled) val.toNode.inputSum += this.outputSum * val.weight;
        });
    }

    // noinspection JSUnusedGlobalSymbols
    static sigmoid(val) {
        return 1 / (1 + Math.pow(Math.E, -val));
    }

    isConnectedTo(node) {
        if (this.layer === node.layer) return false;

        let tmp1 = this;
        let tmp2 = node;
        if (this.layer > node.layer) {
            tmp1 = node;
            tmp2 = this;
        }
        for (let i=0;i<tmp1.outputConnections.length;i++) if (tmp1.outputConnections[i].toNode === tmp2) return true;
        return false;
    }

    clone() {
        let tmp = new Node(this.id);
        tmp.layer = this.layer;
        return tmp;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.lineWidth = (this.active) ? zeroWeightThicc * 2 : zeroWeightThicc;
        ctx.strokeStyle = (this.active) ? "#FFF" : "#AAA";
        ctx.fillStyle = "#000";
        ctx.ellipse(this.pos[0], this.pos[1], nodeRadii, nodeRadii, 0, 0, 2*Math.PI);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.font = `${nodeRadii}px serif`;
        ctx.fillStyle = "#FFF";
        ctx.fillText(this.id, this.pos[0], this.pos[1]);


        if (!(this.id < inputs + outputs + 1)) return;
        let left = this.id < inputs || this.id === inputs + outputs + 1;
        if (!left) ctx.textAlign = "left";
        let string = IONames[this.id] + ': ' + this.outputSum;

        ctx.fillText(string, (left) ? this.pos[0] - 120: this.pos[0] + 30, this.pos[1])
    }
}

export default Node;