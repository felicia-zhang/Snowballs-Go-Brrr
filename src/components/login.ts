import { fontFamily } from "../utils/font";
import InputText from "phaser3-rex-plugins/plugins/inputtext.js";
import * as PlayFab from "playfab-sdk/Scripts/PlayFab/PlayFabClient.js";
import { PlayFabClient } from "playfab-sdk";

class LoginScene extends Phaser.Scene {
	playerName: string;
	constructor() {
		super("Login");
	}

	create() {
		this.add.image(400, 300, "sky");
	}

	update() {
		if (PlayFabClient.IsClientLoggedIn()) {
			this.scene.start("Menu");
		}
	}
}

export default LoginScene;
