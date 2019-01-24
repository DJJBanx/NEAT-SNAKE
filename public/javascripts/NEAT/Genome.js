import Node from './Node.js';
import ConnectionGene from './ConnectionGene.js';
import ConnectionHistory from './ConnectionHistory.js';

class Genome {
    constructor(inputs, outputs, empty = false) {
        this.genes = [];
        this.nodes = [];
        this.inputs = inputs;
        this.outputs = outputs;
        this.layers = 2;
        this.nextNode = 0;
        this.network = [];

        if (!empty) {
            for (let i = 0; i < inputs; i++) {
                let tmp = new Node(i);
                tmp.layer = 0;
                this.nodes[i] = tmp;
                this.nextNode++;
            }
            for (let o = inputs; o < inputs + outputs; o++) {
                let tmp = new Node(o);
                tmp.layer = 1;
                this.nodes[o] = tmp;
                this.nextNode++;
            }
            this.biasNode = this.nextNode;
            this.nodes[this.biasNode] = new Node(this.biasNode);
            this.nodes[this.biasNode].layer = 0;
            this.nextNode++;
            this.generateNetworkAndPositions();
        }
    }

    getNode(id) {
        let returnNode = null;
        this.nodes.forEach((val) => {
            if (val.id === id) returnNode = val;
        });
        return returnNode;
    }

    connectNodes() {
        this.nodes.forEach((val) => {
            val.outputConnections = [];
        });

        this.genes.forEach((val) => {
            val.fromNode.outputConnections.push(val);
        });
    }

    feedForward(inputValues) {
        // console.log('feeding forward');
        for (let i = 0; i < this.inputs; i++) this.nodes[i].outputSum = inputValues[i];
        this.nodes[this.biasNode].outputSum = 1;

        this.network.forEach((val) => {
            val.engage();
        });

        let outputValues = [];
        for (let o = 0; o < this.outputs; o++) outputValues[o] = this.nodes[o + this.inputs].outputSum;

        this.nodes.forEach((val) => {
            val.inputSum = 0;
        });

        // console.log(outputValues);
        return outputValues;
    }

    generateNetworkAndPositions() {

        // for (let i = 0; i < this.inputs; i++) this.getNode(i).pos = [((i % 8) * squareSize) + squareSize / 2, (Math.floor(i / 8) * squareSize) + squareSize / 2];

        // this.getNode(this.biasNode).pos = [w - squareSize / 2, w + squareSize / 2];

        this.connectNodes();
        this.network = [];

        for (let i = 0; i < this.layers; i++) {
            let layerNodes = [];
            this.nodes.forEach((val) => {
                if (val.layer === i) {
                    this.network.push(val);
                    layerNodes.push(val);
                }
            });
            let x = w + (spaceBetweenLayers * i * 2) + (3 * squareSize / 2);
            layerNodes.forEach((val, index) => {
                val.pos = [x, (w / 2) + (((3 * squareSizeOver8) / 4) * (index - ((layerNodes.length - 1) / 2)))];
            });
        }
    }

    innovateAndConnect(innovationHistory, from, to, weight) {
        let newConnection = true;
        let connectionInnovationNumber = nextConnectionNumber;

        for (let i = 0; i < innovationHistory.length; i++) if (innovationHistory[i].matches(this, from, to)) {
            // console.log('FOUND CONNECTION: ', innovationHistory[i]);
            newConnection = false;
            connectionInnovationNumber = innovationHistory[i].innovationNumber;
            break;
        }

        // console.log('NEW CONNECTION? ', newConnection);
        if (newConnection) {
            let innovationNumbers = [];
            this.genes.forEach((val) => {
                innovationNumbers.push(val.innovationNumber);
            });
            // console.log('INNOVATION NUMBERS: ', innovationNumbers);
            let ch = new ConnectionHistory(from.id, to.id, connectionInnovationNumber, innovationNumbers);
            // console.log(ch);
            innovationHistory.push(ch);
            nextConnectionNumber++;
        }

        this.genes.push(new ConnectionGene(from, to, weight, connectionInnovationNumber));
    }

    static nodesCantConnect(node1, node2) {
        return node1.isConnectedTo(node2) || (node1.layer === node2.layer);
    }

    isFullyConnected() {
        let maxConnections = 0;
        let nodesInLayers = [];
        nodesInLayers.length = this.layers;
        nodesInLayers.fill(0);

        this.nodes.forEach((val) => {
            nodesInLayers[val.layer] += 1;
        });

        for (let i = 0; i < this.layers - 1; i++) {
            let nodesInFront = 0;
            for (let j = i + 1; j < this.layers; j++) nodesInFront += nodesInLayers[j];
            maxConnections += nodesInLayers[i] * nodesInFront;
        }

        return maxConnections === this.genes.length;
    }

    addConnection(innovationHistory) {
        if (this.isFullyConnected()) return;

        let node1 = this.getNode(Math.floor(Math.random() * this.nodes.length));
        let node2 = this.getNode(Math.floor(Math.random() * this.nodes.length));

        // console.log(node1, node2);

        // console.log('START WHILE LOOP =============================');

        while (Genome.nodesCantConnect(node1, node2)) {
            // console.log("INITIAL _ ==========================");
            // console.log(node1, node2);
            node1 = this.getNode(Math.floor(Math.random() * this.nodes.length));
            node2 = this.getNode(Math.floor(Math.random() * this.nodes.length));
            // console.log("AFTER _ ==========================");
            // console.log(node1, node2);
        }

        if (node2.layer < node1.layer) {
            let tmp = node1;
            node1 = node2;
            node2 = tmp;
        }

        this.innovateAndConnect(innovationHistory, node1, node2, (Math.random() * 2) - 1);

        this.connectNodes();
    }

    addNode(innovationHistory) {
        if (this.genes.length < 1) {
            this.addConnection(innovationHistory);
            return;
        }
        let randomConnection = Math.floor(Math.random() * this.genes.length);

        // let debuggie = 0;
        // while (this.genes[randomConnection].fromNode === this.nodes[this.biasNode] && this.genes.length > 5) {
        //     randomConnection = Math.floor(Math.random() * this.genes.length);
        //     debuggie ++;
        //     if (debuggie > 50) console.log('debuggie to the rescue');
        // }

        this.genes[randomConnection].enabled = false;

        let newNodeNo = this.nextNode;
        let newNode = new Node(newNodeNo);
        newNode.layer = this.genes[randomConnection].fromNode.layer + 1;
        let toNode = this.genes[randomConnection].toNode;

        this.nodes.push(newNode);
        this.nextNode++;

        this.innovateAndConnect(innovationHistory, this.genes[randomConnection].fromNode, newNode, 1);

        this.innovateAndConnect(innovationHistory, newNode, toNode, this.genes[randomConnection].weight);

        let biasNode = this.getNode(this.biasNode);
        if (this.genes[randomConnection].fromNode.id !== biasNode.id) this.innovateAndConnect(innovationHistory, biasNode, newNode, 0);

        if (newNode.layer === toNode.layer) {
            for (let i = 0; i < this.nodes.length - 1; i++) if (this.nodes[i].layer >= newNode.layer) {
                this.nodes[i].layer++;
            }
            this.layers++;
        }

        this.generateNetworkAndPositions();
    }

    mutate(innovationHistory) {
        if (this.genes.length < 1) this.addConnection(innovationHistory);

        let random = Math.random();
        // 0.8
        if (random < 0.8) this.genes.forEach((val) => {
            val.mutateweight();
        });
        // 0.08
        if (random < 0.18) this.addConnection(innovationHistory);
        // 0.02
        if (random < 0.09) this.addNode(innovationHistory);
    }

    matchingGene(parent2, innovationNumber) {
        let index = -1;
        parent2.genes.forEach((val, i) => {
            if (val.innovationNumber === innovationNumber) index = i;
        });
        return index;
    }

    crossover(parent2) {
        let child = new Genome(this.inputs, this.outputs, true);
        child.layers = this.layers;
        child.nextNode = this.nextNode;
        child.biasNode = this.biasNode;
        let childGenes = [];
        let enabledList = [];
        this.genes.forEach((val) => {
            let parent2gene = this.matchingGene(parent2, val.innovationNumber);
            if (parent2gene !== -1) {
                let p2n = parent2.genes[parent2gene];
                if (!p2n.enabled || !val.enabled) {
                    let random = Math.random();
                    if (random < 0.25) enabledList.push(true);
                    else enabledList.push(false);
                }
                let random = Math.random();
                if (random < 0.5) childGenes.push(val);
                else childGenes.push(p2n);
                enabledList.push(true);
            } else {
                childGenes.push(val);
                enabledList.push(val.enabled);
            }
        });

        this.nodes.forEach((val) => {
            child.nodes.push(val.clone());
        });

        childGenes.forEach((val, index) => {
            let tmpgene = val.clone(child.getNode(val.fromNode.id), child.getNode(val.toNode.id));
            tmpgene.enabled = enabledList[index];
            child.genes.push(tmpgene);
        });

        child.generateNetworkAndPositions();
        return child;
    }

    clone() {
        let tmp = new Genome(this.inputs, this.outputs, true);
        this.nodes.forEach((val) => {
            tmp.nodes.push(val.clone());
        });
        this.genes.forEach((val) => {
            tmp.genes.push(val.clone(tmp.getNode(val.fromNode.id), tmp.getNode(val.toNode.id)));
        });
        tmp.layers = this.layers;
        tmp.nextNode = this.nextNode;
        tmp.biasNode = this.biasNode;
        tmp.generateNetworkAndPositions();

        return tmp;
    }

    draw(ctx) {
        this.genes.forEach((val) => {
            val.draw(ctx);
        });
        //Only render nodes if they have output connections
        this.nodes.forEach((val) => {
            // if (val.layer !== 0 || val.outputConnections.length > 0 || val.id === this.biasNode) {
            //     val.draw(ctx);
            // }

            val.draw(ctx);
        });
    }
}

export default Genome;