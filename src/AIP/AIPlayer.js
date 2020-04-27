class AIPlayer {
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
		let obj = { };
		obj.originalWeights = targetWeights.map(it => it.weight);
		obj.scores = [];

		obj.baseChanges = obj.originalWeights.map(it => 0);
		obj.attempts = Array.from({ length : attemptsPerGen }, (it, i) => {
			return {
				changes : obj.baseChanges.map(it => i == 0 ? 0 : (it + nudgeSpeed * (Math.random() + Math.random() - 1))),
				score : 0
			};
		});
		obj.counter = 0;

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
				console.log("Average score is: " + averageScore.toFixed(4).padStart(9, 0))
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
					let keeping = sortedAttempts.slice(0, Math.floor(sortedAttempts.length * 0.5)).map(it => it.changes);

					if (keeping.length) {
						this.baseChanges = keeping.reduce((t, c) => {
							return t.map((it, i) => it + c[i]);
						}, keeping[0].map(it => 0)).map(it => it / keeping.length);
					}

					this.attempts = Array.from({ length : attemptsPerGen }, (it, i) => {
						return {
							changes : i < keeping.length ? keeping[i] : this.baseChanges.map(it => it + nudgeSpeed * (Math.random() + Math.random() - 1)),
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

	static createWeightOptimizer(weights, optimizer = AIPlayer.naiveOptimizer, ...options) {
		return optimizer(weights, ...options);
	}

	// controller - anything - what will be stored in state.controller to be used by functions.
	// viewWorld  - function - Called to obtain a PNG image of the world that should be perceived.
	// perceive   - function - ...
	// ...
	constructor(controller, viewWorld, perceive, think, decide, act, learn, initialState = { }) {
		this.state = {
			controller
		};

		Object.entries(initialState).forEach(entry => {
			if (entry[0] != "page") {
				this.state[entry[0]] = entry[1];
			}
		});

		this.running = false;
		this.tick = async (shouldAct = true) => {
			let start = Date.now();

			let img = await viewWorld();

			let perception = await perceive(this.state, img);
			let thoughts = await think(this.state, perception);
			let decision = await decide(this.state, thoughts);

			if (shouldAct) {
				let feedback = await act(this.state, decision);
				await learn(this.state, feedback, decision, thoughts, perception, img);
			}

			return {
				perception,
				thoughts,
				decision,
				diff : Date.now() - start
			};
		};

		this.silent = false;
	}

	async run(ticksPerSecond = 0, shouldAct = !!this.state.controller) {
		const tickTime = ticksPerSecond ? (1000 / ticksPerSecond) : 0;
		this.running = true;

		const tickFunction = async () => {
			if (this.running) {
				let result = await this.tick(shouldAct);
				if (!this.silent) console.log("Took " + result.diff + " ms");

				if (tickTime) {
					setTimeout(tickFunction, Math.max(0, tickTime - result.diff));
				} else {
					this.running = false;
				}

				return result;
			}
		};

		return await tickFunction();
	}
}

module.exports = AIPlayer;
