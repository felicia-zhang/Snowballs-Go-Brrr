import GameScene from "../components/game";
import { fontFamily } from "../utils/font";
import PopUp from "phaser3-rex-plugins/plugins/popup.js";
import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle";
import { Dialog } from "phaser3-rex-plugins/templates/ui/ui-components.js";

export default abstract class BaseItem extends Phaser.GameObjects.Sprite {
	level: number;
	totalLevel: number;
	game: GameScene;
	description: string;
	isDragging: boolean;

	constructor(game: GameScene, x, y, texture, level, totalLevel, description) {
		super(game, x, y, texture);
		this.game = game;
		this.description = description;
		this.level = level;
		this.totalLevel = totalLevel;

		this.game.input.mouse.disableContextMenu();

		this.setInteractive({ useHandCursor: true, draggable: true })
			.on("drag", (pointer, dragX, dragY) => {
				this.isDragging = true;
				this.x = dragX;
				this.y = dragY;
			})
			.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
				if (pointer.rightButtonDown()) {
					this.game.getDetails(this.description);
				}
			});

		this.useItem();
	}

	abstract useItem();
}
