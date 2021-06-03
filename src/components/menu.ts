import { PlayFabClient } from "playfab-sdk";
import { fontFamily } from "../utils/font";

class MenuScene extends Phaser.Scene {
	constructor() {
		super("Menu");
	}

	create() {
		this.add.image(400, 300, "sky");
		const title = this.add.text(300, 9, "Menu", { fontFamily: fontFamily });
	}

	update() {
		if (!PlayFabClient.IsClientLoggedIn()) {
			this.scene.start("Login");
		}
	}
}

export default MenuScene;
