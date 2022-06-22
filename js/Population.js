function isSameGene(gene1, gene2) {
	const [det1, a1, b1] = gene1.split('.')
	const [det2, a2, b2] = gene2.split('.')
	return a1 === a2 && b1 === b2 && parseInt(det1, 36) === parseInt(det2, 36)
}

function inferInnovations(genes) {
	const innovations = new Map()
	let i = 0
	genes.forEach((gene) => {
		if (!innovations.has(gene)) {
			const sibling = Array.from(innovations.keys())
				.find((gene2) => isSameGene(gene, gene2))
			if (sibling) {
				innovations.set(gene, innovations.get(sibling))
			} else {
				innovations.set(gene, i++)
			}
		}
	})
	const reversed = Array.from(innovations.entries())
		.reduce((map, [gene, innovation]) => {
			if (!map.has(innovation)) {
				map.set(innovation, [gene])
			} else {
				map.get(innovation).push(gene)
			}
			return map
		}, new Map())
	return {
		geneToId: innovations,
		idToGenes: reversed,
	}
}

function distanceBetweenGenomes(innovations, genomeA, genomeB) {
	const genesA = genomeA.split('/')
	const genesB = genomeB.split('/')
	let d = 0
	let weightDiffSum = 0
	let sharedCount = 0
	let countA = 0
	let countB = 0
	const seen = new Set()
	const all = [...genesA, ...genesB]
	for (let i = 0; i < all.length; i++) {
		const id = innovations.geneToId.get(all[i])
		if(seen.has(id)) {
			continue
		}
		seen.add(id)
		const matchA = genesA.find((gene) => innovations.geneToId.get(gene) === id)
		const matchB = genesB.find((gene) => innovations.geneToId.get(gene) === id)
		if(matchA && matchB) {
			const weightA = parseInt(matchA.split('.')[3], 36)
			const weightB = parseInt(matchB.split('.')[3], 36)
			weightDiffSum += Math.abs(weightA - weightB)
			sharedCount++
		}else if(matchA && matchB) {
			d++
		}
		if(matchA) countA++
		if(matchB) countB++
	}
	const e = Math.abs(genesA.length - genesB.length)
	const w = weightDiffSum / sharedCount
	const n = Math.max(countA, countB)
	const c1 = 1 // coefficient of excess connections
	const c2 = 1 // coefficient of disjoint connections
	const c3 = 1 // coefficient of difference in connections' weights

	return c1*e/n + c2*d/n + c3*w 
}

function segregateIntoSpecies(innovations, [first, ...entities]) {
	const species = [[first]]
	const SPECIES_THRESHOLD = .2 // if distance(a, b) > speciesThreshold => a & b belong to ≠ species
	for (let i = 0; i < entities.length; i++) {
		const genomeA = entities[i].genome
		const speciesIndex = species.findIndex((pool) => {
			const genomeB = pool[Math.floor(Math.random() * pool.length)].genome
			return distanceBetweenGenomes(innovations, genomeA, genomeB) < SPECIES_THRESHOLD
		})
		if (speciesIndex === -1) {
			species.push([entities[i]])
		} else {
			species[speciesIndex].push(entities[i])
		}
	}
	return species
}

function makeOffspring(innovations, genomeA, genomeB) {
	const genesA = genomeA.split('/')
	const genesB = genomeB.split('/')
	const seen = new Set()
	const offspring = []
	const all = [...genesA, ...genesB]
	for (let i = 0; i < all.length; i++) {
		const id = innovations.geneToId.get(all[i])
		if(seen.has(id)) {
			continue
		}
		seen.add(id)
		const matchA = genesA.find((gene) => innovations.geneToId.get(gene) === id)
		const matchB = genesB.find((gene) => innovations.geneToId.get(gene) === id)
		if(matchA && matchB) {
			const parent = Math.random() < .5 ? matchA : matchB
			offspring.push(parent)
		} else if (matchA) {
			offspring.push(matchA)
		} else if (matchB) {
			offspring.push(matchB)
		}
	}
	return offspring.join('/')
}

function mutate(genome) {
	const MUTATION_RATE = .0001
	const mutated = []
	for (let i = 0; i < genome.length; i++) {
		const base = genome[i]
		if(base === '.' || base === '/' || Math.random() >= MUTATION_RATE) {
			mutated.push(base)
		} else {
			mutated.push(Math.floor(Math.random() * 37).toString(36))
		}
	}
	if(Math.random() < MUTATION_RATE) {
		mutated.push(
			'/',
			Math.floor(Math.random() * 1296).toString(36),
			'.',
			Math.floor(Math.random() * 1296).toString(36),
			'.',
			Math.floor(Math.random() * 1296).toString(36),
			'.',
			Math.floor(Math.random() * 1296).toString(36),
		)
	} else if(Math.random() < MUTATION_RATE) {
		const genes = mutated.join('').split('/')
		const removeIndex = Math.floor(Math.random() * genes.length)
		genes.splice(removeIndex, 1)
		return genes.join('/')
	}

	return mutated.join('')
}

function makeOffspringFromSpecies(innovations, species) {
	const singles = [...species]
	const offsprings = []
	while(singles.length > 1) {
		const indexA = Math.floor(Math.random() * singles.length)
		const [A] = singles.splice(indexA, 1)
		const indexB = Math.floor(Math.random() * singles.length)
		const [B] = singles.splice(indexB, 1)
		const offspring = makeOffspring(innovations, A.genome, B.genome)
		offsprings.push(offspring)
	}
	return offsprings
}

export default function createNextGeneration(entities, world, desiredCount) {
	const innovations = inferInnovations(entities.flatMap((entity) => entity.genome.split('/')))
	const species = segregateIntoSpecies(innovations, entities)
	const fitnessPerSpecies = species.map((pool) => pool.reduce(
		(sum, entity) => sum + entity.getFitness(world) / pool.length,
		0
	))
	const FITNESS_PERCENTILE = .6
	const fittestEntities = species.map((pool, i) => pool.reduce(
		(best, entity) => {
			if(entity.getFitness(world) > FITNESS_PERCENTILE * fitnessPerSpecies[i])
				best.push(entity)
			return best
		},
		[]
	))
	const biggestSpecies = fittestEntities.reduce((biggest, pool) => Math.max(biggest, pool.length), 0)
	const survivors = fittestEntities.flatMap((pool, i) => pool.map((entity) => `${entity.genome}:${i}`))
	const numberOfFittest = survivors.length
	console.log('number of entities:', entities.length)
	console.log('number of species:', species.length)
	console.log('biggest species after selection:', biggestSpecies)
	console.log('survivors:', fittestEntities.map((pool) => pool.length))
	const nextGeneration = []
	if(biggestSpecies >= 2) {
		while (nextGeneration.length < desiredCount - numberOfFittest) {
			fittestEntities.forEach((pool, i) => {
				const offspring = makeOffspringFromSpecies(innovations, pool)
				nextGeneration.push(...offspring.map((genome) => `${genome}:${i}`))
			})
		}
	} else {
		while (nextGeneration.length < desiredCount - numberOfFittest) {
			const offspring = makeOffspringFromSpecies(innovations, fittestEntities.flat())
			nextGeneration.push(...offspring.map((genome) => `${genome}:${0}`))
		}
	}
	nextGeneration.push(...survivors)
	return nextGeneration.map((genome) => mutate(genome))
}





// static offspringCount(species, avgPopulationFitness) {
// 	const speciesAdjustedFitnessSum = adjustedFitness(species.map(individual => individual.fitness))
// 		.reduce((accu, curr) => accu + curr)
// 	return speciesAdjustedFitnessSum / avgPopulationFitness
// }

// static adjustedFitness(fitnessArray) {
// 	return fitnessArray.map(fitness => fitness / fitnessArray.length)
// }