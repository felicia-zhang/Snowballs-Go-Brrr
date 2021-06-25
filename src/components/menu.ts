import { PlayFabClient } from "playfab-sdk";
import { textStyle } from "../utils/font";
import AScene from "./AScene";

class MenuScene extends AScene {
	constructor() {
		super("Menu");
	}

	create() {
		this.add.image(400, 300, "sky");
		this.add.text(400, 16, "Menu", textStyle).setOrigin(0.5, 0.5).setAlign("center");

		this.add
			.text(400, 200, "START", textStyle)
			.setOrigin(0.5, 0.5)
			.setAlign("center")
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => {
				this.scene.start("Map");
			});
		this.add
			.text(400, 250, "LEADERBOARD", textStyle)
			.setOrigin(0.5, 0.5)
			.setAlign("center")
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => {
				this.scene.start("Leaderboard");
			});
		this.add.text(400, 300, "SETTINGS", textStyle).setOrigin(0.5, 0.5).setAlign("center");
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
