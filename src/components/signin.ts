import { PlayFabClient } from "playfab-sdk";
import AScene from "./AScene";

class SigninScene extends AScene {
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
