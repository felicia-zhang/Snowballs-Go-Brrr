import BaseItem from "./BaseItem";

export default class Penguin extends BaseItem {
	timerEvent: Phaser.Time.TimerEvent;
	constructor(scene, x, y, level, totalLevel, description) {
		super(scene, x, y, "penguin3", level, totalLevel, description);

		this.anims.create({
			key: "bounce",
			frames: [{ key: "penguin3" }, { key: "penguin2" }, { key: "penguin1" }, { key: "penguin2" }],
			frameRate: 8,
			repeat: -1,
		});
	}

	useItem() {
		this.on("pointerdown", () => {
			this.anims.play("bounce");
			this.disableInteractive();
			this.timerEvent = this.scene.time.addEvent({
				delay: 3000,
				callback() {
					this.anims.pause();
					this.setInteractive({ useHandCursor: true });
				},
				callbackScope: this,
			});
		});
	}
}
