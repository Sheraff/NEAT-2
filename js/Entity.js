import NeuralNetwork from "./Net.js"
import colors from './colors.js'

const SHAPES = ['square', 'circle', 'triangle']

export default class Entity {
	SENSES = [
		/* magnetic_field */ () => this.angle,
		/* time */			 (world) => world.time,
	]
	
	ACTIONS = [
		/* accelerate */ (signal) => this.speed += signal,
		/* rotate */ 	 (signal) => this.angle += signal,
	]

	constructor(_genome, world) {
		const [genome, color = 0] = _genome.split(':')
		this.genome = genome
		const index = Number(color)
		this.color = colors[index % colors.length]
		this.shape = SHAPES[Math.floor(index/colors.length) % SHAPES.length]
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
		if(this.shape === 'circle') {
			context.beginPath()
			context.arc(0, 0, 7, 0, Math.PI * 2)
			context.fillStyle = this.color
			context.fill()
		} else if(this.shape === 'triangle') {
			context.rotate(this.angle)
			context.beginPath()
			context.moveTo(0, 0)
			context.lineTo(-10, 10)
			context.lineTo(-10, -10)
			context.closePath()
			context.fillStyle = this.color
			context.fill()
		} else {
			context.rotate(this.angle)
			context.fillStyle = this.color
			context.fillRect(-5, -5, 10, 10)
		}
		context.restore()
	}

	getFitness(world) {
		return this.speed
		// return 1 / Math.abs(this.x - world.width * 0.25)
		// return 1 / Math.hypot(this.x - world.width * 0.25, this.y - world.height * 0.25)
	}
}