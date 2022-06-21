import World from './World.js'
import Entity from './Entity.js'
import createNextGeneration from './Population.js'
import { makeGenome } from './utils.js'

const displayCounter = document.getElementById('counter')

function getContext(){
	const canvas = document.getElementById('canvas')
	const rect = canvas.getBoundingClientRect()
	canvas.width = rect.width * devicePixelRatio
	canvas.height = rect.height * devicePixelRatio
	const context = canvas.getContext('2d', { alpha: false })
	return context
}

async function ageWorld(world, steps) {
	const dt = 1 / 60
	let resolve
	const promise = new Promise((res) => resolve = res)
	let i = 0
	void function loop() {
		i++
		world.step(dt)
		world.draw()
		if(i>=steps) return resolve()
		requestAnimationFrame(loop)
	}()
	return promise
}

async function loopWorlds(context, world, count) {
	displayCounter.innerText = count
	await ageWorld(world, 1000)
	const nextGenomes = createNextGeneration(world.entities, world, 50)
	const nextWorld = new World(context)
	nextWorld.entities = nextGenomes.map((genome) => new Entity(genome, nextWorld))
	loopWorlds(context, nextWorld, count + 1)
}

{
	const context = getContext()
	const world = new World(context)
	for(let i = 0; i < 100; i++) {
		world.entities.push(new Entity(makeGenome(50), world))
	}
	loopWorlds(context, world, 0)
}