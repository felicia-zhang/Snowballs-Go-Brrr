import GameScene from "../components/game";
import { fontFamily } from "../utils/font";
import PopUp from "phaser3-rex-plugins/plugins/popup.js";
import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle";
import { Dialog } from "phaser3-rex-plugins/templates/ui/ui-components.js";

export default abstract class BaseItem extends Phaser.GameObjects.Sprite {
	level: number;
	totalLevel: number;
	scene: GameScene;
	description: string;
	isDragging: boolean;

	constructor(scene: GameScene, x, y, texture, level, totalLevel, description) {
		super(scene, x, y, texture);
		this.scene = scene;
		this.description = description;
		this.level = level;
		this.totalLevel = totalLevel;

		this.scene.input.mouse.disableContextMenu();

		this.setInteractive({ useHandCursor: true, draggable: true })
			.on("drag", (pointer, dragX, dragY) => {
				this.isDragging = true;
				this.x = dragX;
				this.y = dragY;
			})
			.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
				if (pointer.rightButtonDown()) {
					this.scene.getDetails(this.description);
				}
			});

		this.useItem();
	}

	// createPopup(pointer: Phaser.Input.Pointer, localX, localY, event) {
	// 	const background = this.scene.add.existing(new RoundRectangle(this.scene, 80, 35, 160, 70, 5, 0xf57f17));
	// 	const description = this.scene.add.text(0, 0, this.description, { fontFamily: fontFamily });
	// 	const upgrade = this.scene.add
	// 		.text(0, 40, "UPGRADE", { fontFamily: fontFamily })
	// 		.setInteractive({ useHandCursor: true })
	// 		.on("pointerup", () => console.log("upgrade", this.description));
	// 	const container = this.scene.add
	// 		.container(pointer.x, pointer.y, [background, description, upgrade])
	// 		.setInteractive(new Phaser.Geom.Rectangle(0, 0, 160, 70), Phaser.Geom.Rectangle.Contains);

	// 	this.popup = container;
	// }

	abstract useItem();
}
