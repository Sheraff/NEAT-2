import World from './World.js'
import Entity from './Entity.js'
import createNextGeneration from './Population.js'
import { makeGenome, makeSimpleGenome } from './utils.js'

function getContext() {
	return new Promise(resolve => {
		const controller = new AbortController()
		addEventListener('message', ({data}) => {
			if (data.offscreenCanvas) {
				controller.abort()
				resolve(data.offscreenCanvas.getContext("2d"))
			}
		}, {signal: controller.signal})
	})
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
	postMessage({ count })
	postMessage({ type: 'run' })
	await ageWorld(world, 1000)
	postMessage({ type: 'create' })
	const nextGenomes = createNextGeneration(world.entities, world, 50)
	const nextWorld = new World(context)
	nextWorld.entities = nextGenomes.map((genome) => new Entity(genome, nextWorld))
	loopWorlds(context, nextWorld, count + 1)
}

{
	const context = await getContext()
	postMessage({ type: 'create' })
	const world = new World(context)
	for(let i = 0; i < 100; i++) {
		world.entities.push(new Entity(makeSimpleGenome(10), world))
	}
	loopWorlds(context, world, 0)
}