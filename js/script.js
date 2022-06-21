const displayCounter = document.getElementById('counter')

const canvas = document.getElementById('canvas')
const rect = canvas.getBoundingClientRect()
canvas.width = rect.width * devicePixelRatio
canvas.height = rect.height * devicePixelRatio

const worker = new Worker("js/thread.worker.js", { type: "module" })

worker.addEventListener('message', ({ data }) => {
	if (data.count) {
		displayCounter.innerText = data.count
	}
})

{
	let lastCreate, lastRun
	worker.addEventListener('message', ({ data }) => {
		if (data.type === 'create') {
			lastCreate = performance.now()
			if(lastRun) {
				const delta = performance.now() - lastRun
				console.log(`running world took: ${delta.toFixed(0)}ms`)
			}
		}
		if (data.type === 'run') {
			lastRun = performance.now()
			if(lastCreate) {
				const delta = performance.now() - lastCreate
				console.log(`creating world took: ${delta.toFixed(0)}ms`)
			}
		}
	})
}

const offscreenCanvas = canvas.transferControlToOffscreen()
worker.postMessage({ offscreenCanvas }, [offscreenCanvas])
