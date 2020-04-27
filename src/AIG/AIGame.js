const AIPlayer = require("../AIP/AIPlayer.js");

class AIGame {
	constructor() {

	}

	async beforeRealRun() { }
	async doRealRun() { }
	async afterRealRun() { }

	async run(...args) {
		await this.beforeRealRun(...args);
		await this.doRealRun(...args);
		await this.afterRealRun(...args);
	}

	async beforeTestRun() { }
	async doTestRun() { }
	async afterTestRun() { }

	async test(...args) {
		await this.beforeTestRun(...args);
		await this.doTestRun(...args);
		await this.afterTestRun(...args);
	}
}

module.exports = AIGame;
