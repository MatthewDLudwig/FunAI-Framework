class AIBrain {
	static weightChoices(choices, weightDefinition) {
		return choices.map(choice => {
			let weight = 0;

			weightDefinition.forEach(definition => {
				if (typeof definition.value == "string") {
					weight += definition.weight * choice[definition.value];
				} else if (typeof definition.value == "function") {
					weight += definition.weight * definition.value(choice);
				} else if (typeof definition.value == "number") {
					weight += definition.weight * definition.value;
				}
			});

			return {
				choice,
				weight
			};
		});
	}

	static naiveOptimizer(targetWeights, gamesPerGen = 10) {
		let obj = { };
		obj.originalWeights = targetWeights.map(it => it.weight);
		obj.scores = [];
		obj.attempts = [
			{
				changes : obj.originalWeights.map(it => 0),
				score : 0
			}
		];
		obj.counter = 0;

		obj.runDone = function (finalScore) {
			this.scores.push(finalScore);

			let averageScore = this.scores.reduce((t, c) => t + c, 0) / this.scores.length;
			console.log("Scored " + finalScore.toString().padStart(4, 0) + " points, average score is: " + averageScore.toString().padStart(4, 0))

			if (this.scores.length >= gamesPerGen) {
				this.attempts[this.counter++].score = averageScore;
				this.scores = [];
				console.log(JSON.stringify(this.attempts, null, "\t"))

				let nextAttempt = {
					changes : this.originalWeights.map(it => (Math.random() - 0.5)),
					score : 0
				};
				this.attempts.push(nextAttempt);
				console.log("Attempting : " + JSON.stringify(nextAttempt.changes));

				this.originalWeights.forEach((it, i) => {
					targetWeights[i].weight = it + nextAttempt.changes[i];
				});
			}

		};

		return obj;
	}

	// Trys attemptsPerGen different variations each gamesPerGen times to get an average score.
	// Sorts by score (highest first) and drops out the bottom dropoutRate of attempts.
	static geneticOptimizer(targetWeights, gamesPerGen = 10, attemptsPerGen = 10, dropoutRate = 0.5, nudgeSpeed = 0.25, optimizeLowerScore = false) {
		const generationNames = Array.from({ length : 26 }, (it, i) => String.fromCharCode("A".charCodeAt(0) + i));

		let obj = { };
		obj.originalWeights = targetWeights.map(it => it.weight);
		obj.scores = [];

		obj.counter = 0;
		obj.generations = 0;
		obj.baseChanges = obj.originalWeights.map(it => 0);
		obj.attempts = Array.from({ length : attemptsPerGen }, (it, i) => {
			return {
				name : generationNames[obj.generations] + i.toString().padStart(attemptsPerGen.toString().length, "0"),
				changes : obj.baseChanges.map(it => i == 0 ? 0 : (it + nudgeSpeed * (Math.random() + Math.random() - 1))),
				score : 0
			};
		});

		obj.originalWeights.forEach((it, i) => {
			targetWeights[i].weight = it + (it * obj.attempts[0].changes[i]);
		});
		console.log(targetWeights);

		// All scores are multiplied by this before sorting, which allows for optimizing for lower scores instead of higher scores.
		obj.multiplier = optimizeLowerScore ? -1 : 1;

		obj.runDone = function (finalScore) {
			this.scores.push(finalScore);

			let averageScore = this.scores.reduce((t, c) => t + c, 0) / this.scores.length;

			if (this.scores.length >= gamesPerGen) {
				console.log(this.attempts[this.counter].name + " - Average score is: " + averageScore.toFixed(4).padStart(9, 0))
				this.attempts[this.counter++].score = averageScore;
				this.scores = [];

				if (this.counter < attemptsPerGen) {
					let nextAttempt = this.attempts[this.counter];

					this.originalWeights.forEach((it, i) => {
						targetWeights[i].weight = it + (it * nextAttempt.changes[i]);
					});
				} else {
					console.log("Generation Avg Score : " + (this.attempts.map(it => it.score).reduce((t, c) => t + c, 0) / this.attempts.length).toFixed(4).padStart(9, 0));

					// Generation done, decide next generation.
					let sortedAttempts = this.attempts.sort((a, b) => (this.multiplier * b.score) - (this.multiplier * a.score));
					let keeping = sortedAttempts.slice(0, Math.floor(sortedAttempts.length * 0.5));

					if (keeping.length) {
						this.baseChanges = keeping.map(it => it.changes).reduce((t, c) => {
							return t.map((it, i) => it + c[i]);
						}, keeping[0].changes.map(it => 0)).map(it => it / keeping.length);
					}

					this.generations++;
					this.attempts = Array.from({ length : attemptsPerGen }, (it, i) => {
						return {
							name : i < keeping.length ? keeping[i].name : generationNames[this.generations] + i.toString().padStart(attemptsPerGen.toString().length, "0"),
							changes : i < keeping.length ? keeping[i].changes : this.baseChanges.map(it => it + nudgeSpeed * (Math.random() + Math.random() - 1)),
							score : 0
						};
					});
					this.counter = 0;

					this.originalWeights.forEach((it, i) => {
						targetWeights[i].weight = it + (it * this.attempts[0].changes[i]);
					});
					console.log(targetWeights);
				}
			}
		};

		return obj;
	}

	static createWeightOptimizer(weights, optimizer = AIBrain.naiveOptimizer, ...options) {
		return optimizer(weights, ...options);
	}

	constructor(controller) {
		this.controller = controller;
	}

	perceive(img) { }
	think(perception) { }
	decide(thoughts) { }
	act(img) { }
	learn(img) { }
}

module.exports = AIBrain;
