import GameScene from "../components/game";
import { fontFamily } from "../utils/font";

export default abstract class BaseItem extends Phaser.GameObjects.Sprite {
	level: number;
	totalLevel: number;
	scene: GameScene;
	description: string;
	descriptionBox: Phaser.GameObjects.Text;
	isDragging: boolean;

	constructor(scene: GameScene, x, y, texture, level, totalLevel, description) {
		super(scene, x, y, texture);
		this.scene = scene;
		this.description = description;
		this.level = level;
		this.totalLevel = totalLevel;

		this.setInteractive({ useHandCursor: true, draggable: true })
			.on("pointerover", this.createDescriptionBox)
			.on("pointerout", () => {
				this.descriptionBox.destroy(true);
			})
			.on("drag", (pointer, dragX, dragY) => {
				this.descriptionBox.destroy(true);
				this.isDragging = true;
				this.x = dragX;
				this.y = dragY;
			});

		this.useItem();
	}

	createDescriptionBox(pointer: Phaser.Input.Pointer, localX, localY, event) {
		this.descriptionBox = this.scene.add.text(pointer.x, pointer.y, this.description, { fontFamily: fontFamily });
	}

	abstract useItem();
}
