class AIPlayer {
	// controller - anything - what will be used by the brain when observing and acting.
	// viewWorld  - function - Called to obtain a PNG image of the world that should be perceived.
	constructor(controller, viewWorld, BrainClass) {
		this.brain = new BrainClass(controller);
		this.controller = controller;
		this.running = false;
		this.silent = false;

		this.tick = async (shouldAct = true) => {
			let start = Date.now();

			let img = await viewWorld();

			let perception = await this.brain.perceive(img);
			let thoughts = await this.brain.think(perception);
			let decision = await this.brain.decide(thoughts);

			if (shouldAct) {
				let feedback = await this.brain.act(decision);
				await this.brain.learn(feedback, decision, thoughts, perception, img);
			}

			return {
				perception,
				thoughts,
				decision,
				diff : Date.now() - start
			};
		};
	}

	async run(ticksPerSecond = 0, shouldAct = !!this.controller) {
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
