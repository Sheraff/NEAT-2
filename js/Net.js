const ACTIVATIONS = [
	/*'identity': */x => x,
	/*'abs': */		x => Math.abs(x),
	/*'clamped': */	x => Math.min(1, Math.max(-1, x)),
	/*'cube': */	x => Math.pow(x, 3),
	/*'exp': */		x => Math.exp(x),
	/*'gauss': */	x => x,
	/*'hat': */		x => Math.max(0, x < 0 ? 1 + x : 1 - x),
	/*'inv': */		x => 1 / x,
	/*'log': */		x => Math.log(x),
	/*'relu': */	x => x < 0 ? 0 : x,
	/*'elu': */		x => x < 0 ? Math.exp(x) - 1 : x,
	/*'lelu': */ // x => x,
	/*'selu': */ // x => x,
	/*'sigmoid': */	x => Math.tanh(x) / 2 + 1,
	/*'sin': */		x => Math.sin(x),
	/*'softplus': */ // x => x,
	/*'square': */	x => Math.pow(x, 2),
	/*'tanh': */	x => Math.tanh(x),
	/*'binary': */	x => x < 0 ? 0 : 1,
]
const AGGREGATIONS = [
	/* 'mean': */	arr => arr.reduce((accu, curr) => accu + curr, 0) / arr.length,
	/* 'product': */arr => arr.reduce((accu, curr) => accu * curr, 1),
	/* 'sum': */	arr => arr.reduce((accu, curr) => accu + curr, 0),
	/* 'max': */	arr => Math.max(...arr),
	/* 'min': */	arr => Math.min(...arr),
	/* 'maxabs': */	arr => Math.max(...arr.map(Math.abs)),
	/* 'median': */	arr => arr.sort()[Math.ceil(arr.length / 2)],
]

/** @param {string} str "74.28.97.50" */
function stringToNodeParams(str) {
	const params = str.split('.').map((x) => parseInt(x, 36))
	const bias = (((params[0] || 50) % 101) - 50) / 50
	const response = (((params[1] || 100) % 101) - 50) / 50
	const aggregation = (params[2] || 0) % AGGREGATIONS.length
	const activation = (params[3] || 0) % ACTIVATIONS.length
	return [bias, aggregation, activation, response]
}

/**
 * @param {string} str 
 * @param {number} nodeCount
 */
function stringToConnectionParams(str, nodeCount) {
	const params = str.split('.').map((x) => parseInt(x, 36))
	const expressed = (params[0] || 0) % 2
	const from = (params[1] || 0) % nodeCount
	const to = (params[2] || 0) % nodeCount
	const weight = ((params[3] || 50) % 101) / 100
	return [expressed, from, to, weight]
}

/** @param {string} str 'A4.2F.9J.HL0/74.28.97.50/74.28.97.50/74.28.97.50' */
function genomeToParams(str) {
	const [nodeGenome, connectionGenome] = str
		.split('/')
		.reduce((accu, curr) => {
			const type = parseInt(curr[0], 36) || Math.floor(Math.random() * 2)
			accu[type % 2].push(curr)
			return accu
		}, /** @type {string[][]} */([[], []]))
	const nodes = nodeGenome.map(stringToNodeParams)
	const nodeCount = nodes.length + NeuralNetwork.FIXED_NODE_COUNT
	const connections = connectionGenome.map((str) => stringToConnectionParams(str, nodeCount))
	return [nodes, connections]
}

function makeNodeFromParams(params, connected = true) {
	const [bias, aggregation, activation, response] = params
	return {
		/** @type {number[]} */ input: [],
		/** @type {number}   */ output: 0,
		/** @type {number}   */ aggregation,
		/** @type {number}   */ activation,
		/** @type {number}   */ bias,
		/** @type {number}   */ response,
		/** @type {boolean}  */ connected,
	}
}

export default class NeuralNetwork {
	static INPUT_NODE_COUNT = 2
	inputNodes = [
		makeNodeFromParams([0, 0, 0, 1], false),
		makeNodeFromParams([0, 0, 0, 1], false),
	]

	static OUTPUT_NODE_COUNT = 2
	static OUTPUT_NODE_IDS = new Set(
		Array(NeuralNetwork.OUTPUT_NODE_COUNT)
		.fill(0)
		.map((_, i) => i + NeuralNetwork.INPUT_NODE_COUNT)
	)
	outputNodes = [
		makeNodeFromParams([0, 0, 0, 1]),
		makeNodeFromParams([0, 0, 0, 1]),
	]

	static FIXED_NODE_COUNT = NeuralNetwork.INPUT_NODE_COUNT + NeuralNetwork.OUTPUT_NODE_COUNT
	nodes = [
		...this.inputNodes,
		...this.outputNodes,
	]

	connections = []

	constructor(genome) {
		const [nodeParams, connectionParams] = genomeToParams(genome)
		// console.log(nodeParams)
		const usefulConnections = NeuralNetwork.filterConnections(connectionParams)
		const usefulNodes = NeuralNetwork.filterNodes(usefulConnections, nodeParams)
		// console.log(usefulConnections)
		// console.log(usefulNodes)
		usefulConnections.forEach(([expressed, from, to, weight]) => {
			if(!this.nodes[from])
				this.nodes[from] = makeNodeFromParams(nodeParams[from - NeuralNetwork.FIXED_NODE_COUNT])
			if(!this.nodes[to])
				this.nodes[to] = makeNodeFromParams(nodeParams[to - NeuralNetwork.FIXED_NODE_COUNT], false)
			this.nodes[from].connected = true
			this.connections.push({from, to, weight})
		})
	}

	static filterNodes(connectionParams, nodeParams) {
		return Array.from(connectionParams
			.flatMap((co) => [co[1], co[2]])
			.map((i) => i - NeuralNetwork.FIXED_NODE_COUNT)
			.filter((i) => i >= 0)
			.reduce((set, i) => {
				if(!set.has(nodeParams[i]))
					set.add(nodeParams[i])
				return set
			}, new Set()))
	}

	static filterConnections(connectionParams) {
		const expressedConnections = connectionParams.filter(([expressed, from, to, weight]) => expressed && weight !== 0)
		const usefulConnections = new Set()
		const usefulIds = new Set()
		function connect(connections) {
			const size = usefulConnections.size
			connections.forEach(co => {
				if(usefulConnections.has(co))
					return
				if(usefulIds.has(co[2]) || NeuralNetwork.OUTPUT_NODE_IDS.has(co[2])) {
					usefulConnections.add(co)
					usefulIds.add(co[1])
				}
			})
			if(size !== usefulConnections.size)
				connect(connections)
		}
		connect(expressedConnections)
		return Array.from(usefulConnections.values())
	}

	perceive(senses) {
		this.inputNodes.forEach((node, i) => {
			if(!node.connected)
				return
			node.input.push(senses[i]())
		})
	}

	step() {
		this.nodes.forEach((node) => {
			if(!node.connected)
				return
			const aggregate = node.input.length
				? AGGREGATIONS[node.aggregation](node.input)
				: 0
			const stimulus = Math.max(-1, Math.min(1, aggregate * node.response + node.bias))
			const activation = ACTIVATIONS[node.activation](stimulus)
			node.input.length = 0
			node.output = activation
		})
		this.connections.forEach((co) => {
			this.nodes[co.to].input.push(co.weight * this.nodes[co.from].output)
		})
	}

	act(actions) {
		this.outputNodes.forEach((node, i) => {
			actions[i](node.output)
		})
	}
}
