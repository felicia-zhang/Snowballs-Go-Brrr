import { PlayFabClient } from "playfab-sdk";
import { textStyle } from "../utils/font";

class MenuScene extends Phaser.Scene {
	constructor() {
		super("Menu");
	}

	create() {
		this.add.image(400, 300, "sky");
		this.add.text(300, 50, "Menu", textStyle);

		this.add
			.text(300, 200, "GAME", textStyle)
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => {
				this.scene.start("Game");
			});
		this.add
			.text(300, 250, "LEADERBOARD", textStyle)
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => {
				this.scene.start("Leaderboard");
			});
		this.add.text(300, 300, "SETTINGS", textStyle);
		// TODO:
		// .setInteractive({ useHandCursor: true }).on("pointerup", () => {
		// 	this.scene.start("Settings");
		// });
	}

	update() {
		if (!PlayFabClient.IsClientLoggedIn()) {
			this.scene.start("Signin");
		}
	}
}

export default MenuScene;
