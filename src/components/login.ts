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
		var inputText = new InputText(this, 400, 300, 100, 20, {
			type: "textarea",
			text: "hello world",
			fontFamily: fontFamily,
		}).on("textchange", function (inputText) {
			this.playerName = inputText.text;
		});
		this.add.existing(inputText);
	}

	update() {
		if (PlayFabClient.IsClientLoggedIn()) {
			this.scene.start("Store");
		} else {
			this.scene.start("Login");
		}
	}
}

export default LoginScene;
