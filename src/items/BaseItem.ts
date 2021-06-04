import GameScene from "../components/game";
import { fontFamily } from "../utils/font";
import * as PlayFab from "playfab-sdk/Scripts/PlayFab/PlayFabClient.js";

export default abstract class BaseItem extends Phaser.GameObjects.Sprite {
	item: PlayFabClientModels.ItemInstance;
	game: GameScene;
	isDragging: boolean;
	popup: Phaser.GameObjects.Container;

	constructor(game: GameScene, x, y, item: PlayFab.ItemInstance, texture) {
		super(game, x, y, texture);
		this.game = game;
		this.item = item;

		this.game.input.mouse.disableContextMenu();

		this.setInteractive({ useHandCursor: true, draggable: true })
			.on("drag", (pointer, dragX, dragY) => {
				this.popup.destroy(true);
				this.isDragging = true;
				this.x = dragX;
				this.y = dragY;
			})
			.on("pointerover", this.showDetails)
			.on("pointerout", (pointer: Phaser.Input.Pointer, event) => {
				this.popup.destroy(true);
			})
			.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
				if (pointer.rightButtonDown()) {
					this.game.upgradeItemLevel(this.item);
				}
			});

		this.useItem();
	}

	abstract useItem();

	showDetails(pointer: Phaser.Input.Pointer, localX, localY, event) {
		const level = this.game.add.text(20, 20, `Current level: ${this.item.CustomData["Level"]}`, {
			fontFamily: fontFamily,
		});
		const name = this.game.add.text(20, 60, `Name: ${this.item.DisplayName}`, { fontFamily: fontFamily });
		const container = this.game.add.container(pointer.x, pointer.y, [level, name]);
		this.popup = container;
	}
}
