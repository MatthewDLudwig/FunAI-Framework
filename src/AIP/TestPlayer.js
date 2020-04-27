const AIPlayer = require("./AIPlayer.js");

class TestPlayer extends AIPlayer {
	// onPage is both the View and the Controller
	constructor(onImage, perceive, think, decide, act, learn, initialState) {
		super(null, () => {
			return this.testImage;
		}, perceive, think, decide, act, learn, initialState);

		this.testImage = onImage;
	}
}

module.exports = TestPlayer;
