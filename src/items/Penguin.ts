import BaseItem from "./BaseItem";

export default class Penguin extends BaseItem {
	timerEvent: Phaser.Time.TimerEvent;
	constructor(game, x, y, item) {
		super(game, x, y, item, "penguin3");

		this.anims.create({
			key: "bounce",
			frames: [{ key: "penguin3" }, { key: "penguin2" }, { key: "penguin1" }, { key: "penguin2" }],
			frameRate: 8,
			repeat: -1,
		});
	}

	useItem() {
		this.on("pointerup", (pointer: Phaser.Input.Pointer) => {
			if (pointer.leftButtonReleased()) {
				if (this.isDragging) {
					this.isDragging = false;
				} else {
					this.anims.play("bounce");
					this.disableInteractive();
					this.timerEvent = this.game.time.addEvent({
						delay: 3000,
						callback() {
							this.anims.pause();
							this.setInteractive({ useHandCursor: true });
							this.game.totalSnowballs += 1;
						},
						callbackScope: this,
					});
				}
			}
		});
	}
}