function makeBase() {
	const base10 = Math.floor(Math.random() * 1296)
	return Number(base10).toString(36)
}

function makeGene() {
	return Array(4)
		.fill(0)
		.map(makeBase)
		.join('.')
}

export function makeGenome(length) {
	return Array(length)
		.fill(0)
		.map(makeGene)
		.join('/')
}

export function makeSimpleGenome(length) {
	return Array(length)
		.fill(0)
		.map(() => [
			Math.random() < .5 ? '00' : '11',
			`0${Math.floor(Math.random() * 7).toString(36)}`,
			`0${Math.floor(Math.random() * 7).toString(36)}`,
			'zz'
		].join('.'))
		.join('/')
}