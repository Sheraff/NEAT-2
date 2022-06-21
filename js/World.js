export default class World {
	constructor(context) {
		this.context = context
		this.width = context.canvas.width
		this.height = context.canvas.height
		this.entities = []
		this.time = 0
	}

	step(dt) {
		this.time += dt
		this.entities.forEach((entity) => {
			entity.step(dt, this)
		})
	}

	draw() {
		this.context.clearRect(0, 0, this.width, this.height)
		this.entities.forEach((entity) => {
			entity.draw(this.context)
		})
	}
}