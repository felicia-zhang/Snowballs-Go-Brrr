import { fontFamily } from "../utils/font";
import InputText from "phaser3-rex-plugins/plugins/inputtext.js";

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

		const loginButton = this.add.text(700, 400, "login", { fontFamily: fontFamily });
		loginButton.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
			this.scene.start("Game");
		});
	}
}

export default LoginScene;
