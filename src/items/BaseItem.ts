import GameScene from "../components/game";

export default class BaseItem extends Phaser.Scene {
	isDragging: boolean;
	item: PlayFabClientModels.ItemInstance;
	popup: Phaser.GameObjects.Container;
	sprite: Phaser.GameObjects.Sprite;

	constructor(key, sprite, item, popup) {
		super(key);
		this.item = item;
		this.popup = popup;
		this.sprite = sprite;
		this.sprite
			.setInteractive({ useHandCursor: true, draggable: true })
			.on("drag", (pointer, dragX, dragY) => {
				this.popup.setX(1000);
				this.popup.setY(0);
				this.isDragging = true;
				this.sprite.x = dragX;
				this.sprite.y = dragY;
				this.refresh();
			})
			.on("pointerover", (pointer: Phaser.Input.Pointer, localX, localY, event) => {
				this.popup.setX(pointer.x);
				this.popup.setY(pointer.y);
				this.popup.setDepth(1);
			})
			.on("pointerout", (pointer: Phaser.Input.Pointer, event) => {
				this.popup.setX(1000);
				this.popup.setY(0);
			})
			.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
				if (pointer.rightButtonDown()) {
					let game = this.scene.get("Game") as GameScene;
					game.upgradeItemLevel(item);
				}
			});
	}

	create() {
		this.cameras.main.setViewport(this.sprite.x, this.sprite.y, 100, 100);
	}

	refresh() {
		this.cameras.main.setPosition(this.sprite.x, this.sprite.y);
		this.scene.bringToTop();
	}
}
