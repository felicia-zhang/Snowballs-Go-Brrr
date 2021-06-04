import GameScene from "../components/game";
import { fontFamily } from "../utils/font";

export default abstract class BaseItem extends Phaser.GameObjects.Sprite {
	level: number;
	totalLevel: number;
	scene: GameScene;
	description: string;
	descriptionBox: Phaser.GameObjects.Text;

	constructor(scene: GameScene, x, y, texture, level, totalLevel, description) {
		super(scene, x, y, texture);
		this.scene = scene;
		this.description = description;
		this.level = level;
		this.totalLevel = totalLevel;

		this.setInteractive({ useHandCursor: true })
			.on("pointerover", this.createDescriptionBox)
			.on("pointerout", () => {
				this.descriptionBox.destroy(true);
			});

		this.useItem();
	}

	createDescriptionBox(pointer: Phaser.Input.Pointer, localX, localY, event) {
		this.descriptionBox = this.scene.add.text(pointer.x, pointer.y, this.description, { fontFamily: fontFamily });
	}

	abstract useItem();
}
