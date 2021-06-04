import { PlayFabClient } from "playfab-sdk";
import { fontFamily } from "../utils/font";

class MenuScene extends Phaser.Scene {
	constructor() {
		super("Menu");
	}

	create() {
		this.add.image(400, 300, "sky");
		const title = this.add.text(300, 9, "Menu", { fontFamily: fontFamily });

		const gameButton = this.add.text(700, 450, "game", { fontFamily: fontFamily });
		gameButton.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
			this.scene.start("Game");
		});
	}

	update() {
		if (!PlayFabClient.IsClientLoggedIn()) {
			this.scene.start("Signin");
		}
	}
}

export default MenuScene;
