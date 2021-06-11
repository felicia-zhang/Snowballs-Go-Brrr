import { PlayFabClient } from "playfab-sdk";
import { fontFamily } from "../utils/font";

class MenuScene extends Phaser.Scene {
	constructor() {
		super("Menu");
	}

	create() {
		this.add.image(400, 300, "sky");
		this.add.text(300, 50, "Menu", { fontFamily: fontFamily });

		this.add
			.text(300, 200, "GAME", { fontFamily: fontFamily })
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => {
				if (!this.scene.isActive("Game")) {
					this.scene.launch("Game");
				}
				this.scene.bringToTop("Game");
			});
		this.add
			.text(300, 250, "LEADERBOARD", { fontFamily: fontFamily })
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => {
				this.scene.start("Leaderboard");
			});
		this.add.text(300, 300, "SETTINGS", { fontFamily: fontFamily });
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
