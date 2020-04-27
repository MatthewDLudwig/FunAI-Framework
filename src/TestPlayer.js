const AIPlayer = require("./AIPlayer.js");

class TestPlayer extends AIPlayer {
	constructor(testWith, BrainClass) {
		super(null, () => {
			return this.testImage;
		}, BrainClass);

		this.testImage = testWith;
	}
}

module.exports = TestPlayer;
