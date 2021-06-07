import GameScene from "../components/game";
import BaseItem from "./BaseItem";

export default class Penguin extends BaseItem {
	constructor(key, image, item, popup) {
		super(key, image, item, popup);

		this.sprite.anims.create({
			key: "bounce",
			frames: [{ key: "penguin3" }, { key: "penguin2" }, { key: "penguin1" }, { key: "penguin2" }],
			frameRate: 8,
			repeat: -1,
		});

		this.sprite.on("pointerup", (pointer: Phaser.Input.Pointer) => {
			if (pointer.leftButtonReleased()) {
				if (this.isDragging) {
					this.isDragging = false;
				} else {
					this.sprite.anims.play("bounce");
					this.sprite.disableInteractive();
					let game = this.scene.get("Game") as GameScene;
					game.time.addEvent({
						delay: 3000,
						callback: () => {
							this.sprite.anims.pause();
							this.sprite.setInteractive({ useHandCursor: true, draggable: true });
							game.totalSnowballs += 1;
						},
					});
				}
			}
		});
	}
}
