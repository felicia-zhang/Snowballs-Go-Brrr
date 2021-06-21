import { textStyle } from "../utils/font";

abstract class AScene extends Phaser.Scene {
	toast: Phaser.GameObjects.Text;
	constructor(key: string) {
		super(key);
	}

	init() {
		this.toast = this.add
			.text(400, 16, "", textStyle)
			.setAlpha(0)
			.setDepth(22)
			.setAlign("center")
			.setOrigin(0.5, 0);
	}

	showToast(message: string, isError: boolean) {
		this.toast.setText(message);
		if (isError) {
			this.toast.setColor("#ff7360");
		} else {
			this.toast.setColor("#ffffff");
		}

		this.add.tween({
			targets: [this.toast],
			ease: "Sine.easeIn",
			duration: 300,
			alpha: 1,
			completeDelay: 1000,
			onComplete: () => {
				this.toast.setAlpha(0);
			},
			callbackScope: this,
		});
	}
}

export default AScene;
