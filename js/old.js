import NeuralNetwork from "./Net.js"
import { makeGenome } from "./utils.js"


const genome = makeGenome(50)
console.log(genome)
const net = new NeuralNetwork(genome)
let iterations = 0
const start = Date.now()
do {
	net.perceive()
	net.step()
	net.act()
	iterations++
} while (Date.now() - start < 1000)
console.log('iterations: ', iterations)
//console.log(net.outputNodes)