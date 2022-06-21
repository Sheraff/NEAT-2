import NeuralNetwork from "./Net.js"

export default class Entity {
	SENSES = [
		/* magnetic_field */ () => this.angle,
		/* time */			 (world) => world.time,
	]
	
	ACTIONS = [
		/* accelerate */ (signal) => this.speed += signal,
		/* rotate */ 	 (signal) => this.angle += signal,
	]

	constructor(genome, world) {
		this.genome = genome
		this.net = new NeuralNetwork(genome)
		this.angle = Math.random() * Math.PI * 2
		this.speed = 0
		this.x = Math.random() * world.width
		this.y = Math.random() * world.height
	}

	step(dt, world) {
		// brain
		this.net.perceive(this.SENSES.map((s) => () => s(world)))
		this.net.step()
		this.net.act(this.ACTIONS)

		// world
		this.x += this.speed * Math.cos(this.angle) * dt
		this.y += this.speed * Math.sin(this.angle) * dt
		if(this.x < 0) this.x += world.width
		if(this.x > world.width) this.x -= world.width
		if(this.y < 0) this.y += world.height
		if(this.y > world.height) this.y -= world.height
		this.speed *= 0.99
		this.angle %= Math.PI * 2
	}

	/** @type {CanvasRenderingContext2D} context */
	draw(context) {
		context.save()
		context.translate(this.x, this.y)
		context.rotate(this.angle)
		context.fillStyle = "red"
		context.fillRect(-5, -5, 10, 10)
		context.restore()
	}

	getFitness(world) {
		return 1 / Math.abs(this.x - world.width * 0.25)
		// return 1 / Math.hypot(this.x - world.width * 0.25, this.y - world.height * 0.25)
	}
}