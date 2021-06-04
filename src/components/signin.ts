import { PlayFabClient } from "playfab-sdk";

class SigninScene extends Phaser.Scene {
	playerName: string;
	constructor() {
		super("Signin");
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

export default SigninScene;
