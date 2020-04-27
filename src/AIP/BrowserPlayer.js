const stream = require("stream");
const pngjs = require("pngjs");
const fs = require("fs");

const AIPlayer = require("./AIPlayer.js");

class BrowserPlayer extends AIPlayer {
	// onPage is both the View and the Controller
	constructor(onPage, perceive, think, decide, act, learn, initialState) {
		const takeScreenshot = (path = "") => {
			return new Promise(async (resolve, reject) => {
				await onPage.screenshot().then(buffer => {
					let img = new stream.PassThrough();
					img.end(buffer);
					img.pipe(new pngjs.PNG({
						filterType : 4
					})).on("parsed", function () {
						if (path) {
							fs.writeFileSync(path, buffer);
						}

						resolve(this);
					});
				}).catch(reject);
			});
		};

		// let count = 0;
		super(onPage, async () => {
			// return await takeScreenshot("./screenshots/" + count++ + ".png");
			return await takeScreenshot().catch(console.error);
		}, perceive, think, decide, act, learn, initialState);
	}
}

module.exports = BrowserPlayer;
