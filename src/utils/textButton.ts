import { textStyle } from "./constants";

export default class TextButton extends Phaser.GameObjects.Container {
	underline: Phaser.GameObjects.Line;
	textObject: Phaser.GameObjects.Text;

	constructor(scene: Phaser.Scene, x: number, y: number, text: string, align: "left" | "right" | "center") {
		super(scene, x, y, []);

		this.underline = new Phaser.GameObjects.Line(scene, 0, 0, 0, 0, 0, 0, 0xffffff).setAlpha(0);
		this.textObject = new Phaser.GameObjects.Text(scene, 0, 0, text, textStyle).setInteractive({
			useHandCursor: true,
		});

		if (align === "left") {
			this.textObject
				.setOrigin(0, 1)
				.on("pointerover", () => {
					this.underline.setTo(0, 0, this.textObject.width, 0).setAlpha(1);
				})
				.on("pointerout", () => {
					this.underline.setAlpha(0);
				});
		} else if (align === "right") {
			this.textObject
				.setOrigin(1, 1)
				.on("pointerover", () => {
					this.underline
						.setTo(0, 0, this.textObject.width, 0)
						.setPosition(-this.textObject.width, 0)
						.setAlpha(1);
				})
				.on("pointerout", () => {
					this.underline.setAlpha(0);
				});
		} else {
			this.textObject
				.setOrigin(0.5, 0.5)
				.setAlign("center")
				.on("pointerover", () => {
					this.underline
						.setTo(0, 0, this.textObject.width, 0)
						.setPosition(-this.textObject.width / 2, this.textObject.height / 2)
						.setAlpha(1);
				})
				.on("pointerout", () => {
					this.underline.setAlpha(0);
				});
		}

		this.add([this.underline, this.textObject]);
	}

	addCallback(callback: () => any): this {
		this.textObject.on("pointerup", () => {
			callback();
		});

		return this;
	}

	disableInteractive(): this {
		this.textObject.disableInteractive();
		return this;
	}

	setInteractive(hitArea?: Phaser.Types.Input.InputConfiguration | any): this {
		this.textObject.setInteractive(hitArea);
		return this;
	}
}
