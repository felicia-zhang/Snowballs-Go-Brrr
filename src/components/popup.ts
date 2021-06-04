import { PlayFabClient } from "playfab-sdk";
import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle";
import { fontFamily } from "../utils/font";
import BaseItem from "../items/BaseItem";

class PopupScene extends Phaser.Scene {
	description: Phaser.GameObjects.Text;
	level: Phaser.GameObjects.Text;
	totalLevel: Phaser.GameObjects.Text;
	upgrade: Phaser.GameObjects.Text;
	constructor() {
		super("Popup");
	}

	create(data) {
		this.scene.setVisible(false);
		const background = this.add.existing(new RoundRectangle(this, 700, 300, 200, 600, 0, 0x000000, 0.5));
		this.description = this.add.text(620, 20, "item.description", { fontFamily: fontFamily });
		this.level = this.add.text(620, 40, "", { fontFamily: fontFamily });
		this.totalLevel = this.add.text(620, 60, "", { fontFamily: fontFamily });

		this.upgrade = this.add
			.text(620, 100, "Upgrade", { fontFamily: fontFamily })
			.setInteractive({ useHandCursor: true });

		this.add
			.text(700, 100, "X", { fontFamily: fontFamily })
			.setInteractive({ useHandCursor: true })
			.on("pointerdown", () => this.scene.setVisible(false));
	}

	showDetails(item: BaseItem) {
		this.scene.setVisible(true);
		this.description.setText(item.description);
		this.level.setText(item.level.toString());
		this.totalLevel.setText(item.totalLevel.toString());
		this.upgrade.on("pointerdown", item.upgrade);
	}
}

export default PopupScene;
