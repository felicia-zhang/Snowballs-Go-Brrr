import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";
import {
	darkBlue,
	darkRed,
	fontFamily,
	lightBlue,
	lightRed,
	normalBlue,
	normalRed,
	normalTextStyle,
	toastDepth,
	smallTextStyle,
} from "./constants";

export default class Button extends Phaser.GameObjects.Container {
	highlight: RoundRectangle;
	background: RoundRectangle;
	hoverBackground: RoundRectangle;
	hoverText: Phaser.GameObjects.Text;
	textObject: Phaser.GameObjects.Text;
	text: string;
	icon?: Phaser.GameObjects.Image;
	isBlue: boolean;

	constructor(scene: Phaser.Scene, x: number, y: number, isBlue: boolean = true) {
		super(scene, x, y, []);

		this.text = "";
		this.isBlue = isBlue;
		this.textObject = new Phaser.GameObjects.Text(this.scene, 0, 0, "", normalTextStyle)
			.setAlign("left")
			.setOrigin(0, 0.5);

		this.highlight = new RoundRectangle(scene, 0, 0, 0, 0, 10, 0xffffff).setAlpha(0);
		this.hoverBackground = new RoundRectangle(scene, 0, 0, 0, 0, 5, isBlue ? darkBlue : darkRed)
			.setAlpha(0)
			.setDepth(toastDepth);
		this.hoverText = new Phaser.GameObjects.Text(this.scene, 0, 0, "", smallTextStyle)
			.setAlign("center")
			.setOrigin(0.5, 0.5)
			.setAlpha(0)
			.setDepth(toastDepth);
		this.background = new RoundRectangle(scene, 0, 0, 0, 0, 10, isBlue ? lightBlue : lightRed);

		this.add([this.highlight, this.background, this.textObject, this.hoverBackground, this.hoverText])
			.on("pointerover", () => this.background.setFillStyle(isBlue ? normalBlue : normalRed, 1))
			.on("pointerout", () => this.resetButton())
			.on("pointerdown", () => {
				this.background.setFillStyle(isBlue ? darkBlue : darkRed, 1);
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
	}

	invoke() {
		this.listeners("pointerup").forEach(event => event());
	}

	resetButton(): this {
		this.background.setFillStyle(this.isBlue ? lightBlue : lightRed, 1);
		this.highlight.setAlpha(0);
		this.highlight.width = this.background.width;
		this.highlight.height = this.background.height;

		return this;
	}

	addIcon(imageKey: string): this {
		if (this.icon !== undefined) {
			return this;
		}
		this.icon = new Phaser.GameObjects.Image(this.scene, 0, 0, imageKey).setScale(0.15);
		const textX = (this.textObject.width + 36) / 2;
		this.textObject.setX(-textX);
		if (this.textObject.text === "") {
			this.icon.setX(0);
			this.background.width = 40;
		} else {
			this.icon.setX(textX - 15);
			this.background.width = this.textObject.width + 50;
		}
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
			const textX = (this.textObject.width + 36) / 2;
			this.textObject.setX(-textX);
			this.icon.setX(textX - 15);
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
		this.setSize(this.background.width, this.background.height)
			.setInteractive({
				useHandCursor: true,
			})
			.on("pointerup", () => {
				this.resetButton();
				callback();
			});

		return this;
	}

	addCloseCallback(
		container: Phaser.GameObjects.Container,
		interactiveObjects: Phaser.GameObjects.GameObject[],
		callback: () => any
	): this {
		this.setSize(this.background.width, this.background.height)
			.setInteractive({
				useHandCursor: true,
			})
			.on("pointerup", () => {
				this.scene.add.tween({
					targets: [container],
					ease: "Sine.easeIn",
					duration: 300,
					alpha: 0,
					onComplete: () => {
						interactiveObjects.forEach(object => object.setInteractive({ useHandCursor: true }));
						this.resetButton();
						callback();
					},
				});
			});

		return this;
	}

	addHoverText(text: string): this {
		this.hoverText.setText(text).setY(-32);
		this.hoverBackground.setSize(this.hoverText.width + 8, this.hoverText.height + 8);
		this.hoverBackground.y = -32;

		this.on("pointerover", () => {
			this.hoverText.setAlpha(1);
			this.hoverBackground.setAlpha(1);
		}).on("pointerout", () => {
			this.hoverText.setAlpha(0);
			this.hoverBackground.setAlpha(0);
		});

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

			this.background.setFillStyle(this.isBlue ? darkBlue : darkRed, 1);
			this.disableInteractive().removeListener("pointerout");

			if (this.icon !== undefined) {
				this.icon.setAlpha(0);
			}
		} else {
			this.textObject
				.setText(this.text)
				.setOrigin(0, 0.5)
				.setStyle({ ...normalTextStyle, strokeThickness: 0 });
			if (this.icon !== undefined) {
				const textX = (this.textObject.width + 36) / 2;
				this.textObject.setX(-textX);
				this.icon.setX(textX - 15);
			} else {
				const textX = this.textObject.width / 2;
				this.textObject.setX(-textX);
			}

			this.background.setFillStyle(this.isBlue ? lightBlue : lightRed, 1);
			this.setInteractive({ useHandCursor: true }).on("pointerout", () => this.resetButton());

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
