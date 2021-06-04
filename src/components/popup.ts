import { PlayFabClient } from "playfab-sdk";
import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle";
import { fontFamily } from "../utils/font";

class PopupScene extends Phaser.Scene {
	constructor() {
		super("Popup");
	}

	create(data) {
		const background = this.add.existing(new RoundRectangle(this, 0, 0, 100, 600, 5, 0xf57f17));
		const description = this.add.text(20, 20, data.description, { fontFamily: fontFamily });
		const close = this.add
			.text(20, 200, "close", { fontFamily: fontFamily })
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => this.scene.remove("Popup"));
	}
}

export default PopupScene;
