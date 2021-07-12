import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";
import { darkBlue, darkRed, fontFamily, lightBlue, lightRed, normalBlue, normalRed, textStyle } from "./constants";

export default class Button extends Phaser.GameObjects.Container {
	highlight: RoundRectangle;
	background: RoundRectangle;
	textObject: Phaser.GameObjects.Text;
	text: string;
	icon?: Phaser.GameObjects.Image;
	private color: "red" | "blue";

	constructor(scene: Phaser.Scene, x: number, y: number, color: "red" | "blue") {
		super(scene, x, y, []);

		this.text = "";
		this.textObject = new Phaser.GameObjects.Text(this.scene, 0, 0, "", textStyle)
			.setAlign("left")
			.setOrigin(0, 0.5);

		this.color = color;
		this.highlight = new RoundRectangle(scene, 0, 0, 0, 0, 10, 0xffffff).setAlpha(0);
		this.background = new RoundRectangle(scene, 0, 0, 0, 0, 10, color === "red" ? lightRed : lightBlue)
			.setInteractive({ useHandCursor: true })
			.on("pointerover", () =>
				color === "red"
					? this.background.setFillStyle(normalRed, 1)
					: this.background.setFillStyle(normalBlue, 1)
			)
			.on("pointerout", () => this.resetButton())
			.on("pointerdown", () => {
				color === "red" ? this.background.setFillStyle(darkRed, 1) : this.background.setFillStyle(darkBlue, 1);
				scene.add.tween({
					targets: [this.highlight],
					ease: "Sine.easeIn",
					props: {
						width: {
							value: this.background.width + 5,
							duration: 150,
							ease: "Sine.easeIn",
						},
						height: {
							value: this.background.height + 5,
							duration: 150,
							ease: "Sine.easeIn",
						},
						alpha: {
							value: 0.3,
							duration: 150,
							ease: "Sine.easeIn",
						},
					},
				});
			});

		this.add([this.highlight, this.background, this.textObject]);
	}

	resetButton(): this {
		this.color === "red" ? this.background.setFillStyle(lightRed, 1) : this.background.setFillStyle(lightBlue, 1);
		this.highlight.setAlpha(0);
		this.highlight.width = this.background.width;
		this.highlight.height = this.background.height;

		return this;
	}

	addIcon(imageKey: string): this {
		if (this.icon !== undefined) {
			return this;
		}
		this.icon = new Phaser.GameObjects.Image(this.scene, 0, 0, imageKey).setScale(0.15).setOrigin(1, 0.5);
		const textX = (this.textObject.width + this.icon.displayWidth + 6) / 2;
		this.textObject.setX(-textX);
		this.icon.setX(textX);
		this.background.width = this.textObject.width + 50;
		this.background.height = this.textObject.height + 16;
		this.highlight.width = this.background.width;
		this.highlight.height = this.background.height;

		this.add(this.icon);
		return this;
	}

	setText(text: string): this {
		this.text = text;
		this.textObject.setText(text);
		if (this.icon !== undefined) {
			const textX = (this.textObject.width + this.icon.displayWidth + 6) / 2;
			this.textObject.setX(-textX);
			this.icon.setX(textX);
			this.background.width = this.textObject.width + 50;
		} else {
			const textX = this.textObject.width / 2;
			this.textObject.setX(-textX);
			this.background.width = this.textObject.width + 16;
		}
		this.background.height = this.textObject.height + 16;
		this.highlight.width = this.background.width;
		this.highlight.height = this.background.height;

		return this;
	}

	addCallback(callback: () => any): this {
		this.background.on("pointerup", () => {
			this.resetButton();
			callback();
		});

		return this;
	}

	removeListener(event: string): this {
		this.background.removeListener(event);
		return this;
	}

	toggleLoading(isLoading: boolean) {
		if (isLoading) {
			this.textObject
				.setText(". . .")
				.setOrigin(0, 0.725)
				.setStyle({ fontFamily: fontFamily, fontSize: "32px", stroke: "#ffffff", strokeThickness: 3 });
			const textX = this.textObject.width / 2;
			this.textObject.setX(-textX);

			this.color === "red" ? this.background.setFillStyle(darkRed, 1) : this.background.setFillStyle(darkBlue, 1);
			this.background.disableInteractive().removeListener("pointerout");

			if (this.icon !== undefined) {
				this.icon.setAlpha(0);
			}
		} else {
			this.textObject
				.setText(this.text)
				.setOrigin(0, 0.5)
				.setStyle({ ...textStyle, strokeThickness: 0 });
			if (this.icon !== undefined) {
				const textX = (this.textObject.width + this.icon.displayWidth + 6) / 2;
				this.textObject.setX(-textX);
				this.icon.setX(textX);
			} else {
				const textX = this.textObject.width / 2;
				this.textObject.setX(-textX);
			}

			this.color === "red"
				? this.background.setFillStyle(lightRed, 1)
				: this.background.setFillStyle(lightBlue, 1);
			this.background.setInteractive({ useHandCursor: true }).on("pointerout", () => this.resetButton());

			this.scene.add.tween({
				targets: [this.highlight],
				ease: "Sine.easeIn",
				props: {
					width: {
						value: this.background.width,
						duration: 300,
						ease: "Sine.easeIn",
					},
					height: {
						value: this.background.height,
						duration: 300,
						ease: "Sine.easeIn",
					},
					alpha: {
						value: 0,
						duration: 300,
						ease: "Sine.easeIn",
					},
				},
			});

			if (this.icon !== undefined) {
				this.icon.setAlpha(1);
			}
		}
	}
}
