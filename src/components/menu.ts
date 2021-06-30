import { PlayFabClient } from "playfab-sdk";
import {
	buttonClick,
	buttonHover,
	buttonNormal,
	darkBackgroundColor,
	overlayDepth,
	popupDepth,
	textStyle,
} from "../utils/constants";
import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";
import AScene from "./AScene";

class MenuScene extends AScene {
	resetConfirmationContainer: Phaser.GameObjects.Container;
	constructor() {
		super("Menu");
	}

	create() {
		this.cameras.main.fadeIn(500, 0, 0, 0);
		this.add.image(400, 300, "sky");
		this.add.text(400, 16, "MENU", textStyle).setAlign("center").setOrigin(0.5, 0);
		this.makeResetConfirmationContainer();

		PlayFabClient.GetCatalogItems({ CatalogVersion: "1" }, (error, result) => {
			this.registry.set("CatalogItems", result.data.Catalog);

			PlayFabClient.GetUserInventory({}, (error, result) => {
				this.registry.set("SB", result.data.VirtualCurrency.SB);
				this.registry.set("IC", result.data.VirtualCurrency.IC);
				this.registry.set("Inventories", result.data.Inventory);

				const startButtonUnderline = this.add.line(400, 200, 400, 200, 400, 200, 0xffffff).setAlpha(0);
				const startButton = this.add
					.text(400, 200, "START", textStyle)
					.setOrigin(0.5, 0.5)
					.setAlign("center")
					.setInteractive({ useHandCursor: true })
					.on("pointerover", () => {
						startButtonUnderline
							.setTo(0, 0, startButton.width, 0)
							.setPosition(400 - startButton.width / 2, 200 + startButton.height / 2)
							.setAlpha(1);
					})
					.on("pointerout", () => {
						startButtonUnderline.setAlpha(0);
					})
					.on("pointerup", () => {
						this.cameras.main.fadeOut(500, 0, 0, 0);
						this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, (cam, effect) => {
							this.scene.start("Map");
						});
					});
				this.interactiveObjects.push(startButton);

				const leaderboardButtonUnderline = this.add.line(400, 250, 400, 250, 400, 250, 0xffffff).setAlpha(0);
				const leaderboardButton = this.add
					.text(400, 250, "LEADERBOARD", textStyle)
					.setOrigin(0.5, 0.5)
					.setAlign("center")
					.setInteractive({ useHandCursor: true })
					.on("pointerover", () => {
						leaderboardButtonUnderline
							.setTo(0, 0, leaderboardButton.width, 0)
							.setPosition(400 - leaderboardButton.width / 2, 250 + leaderboardButton.height / 2)
							.setAlpha(1);
					})
					.on("pointerout", () => {
						leaderboardButtonUnderline.setAlpha(0);
					})
					.on("pointerup", () => {
						this.cameras.main.fadeOut(500, 0, 0, 0);
						this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, (cam, effect) => {
							this.scene.start("Leaderboard");
						});
					});
				this.interactiveObjects.push(leaderboardButton);

				const resetButtonUnderline = this.add.line(400, 300, 400, 300, 400, 300, 0xffffff).setAlpha(0);
				const resetButton = this.add
					.text(400, 300, "RESET", textStyle)
					.setOrigin(0.5, 0.5)
					.setAlign("center")
					.setInteractive({ useHandCursor: true })
					.on("pointerover", () => {
						resetButtonUnderline
							.setTo(0, 0, resetButton.width, 0)
							.setPosition(400 - resetButton.width / 2, 300 + resetButton.height / 2)
							.setAlpha(1);
					})
					.on("pointerout", () => {
						resetButtonUnderline.setAlpha(0);
					})
					.on("pointerup", () => {
						this.interactiveObjects.forEach(object => object.disableInteractive());
						this.add.tween({
							targets: [this.resetConfirmationContainer],
							ease: "Sine.easeIn",
							duration: 500,
							alpha: 1,
							callbackScope: this,
						});
					});
				this.interactiveObjects.push(resetButton);
			});
		});
	}

	makeResetConfirmationContainer() {
		const overlay = this.add.rectangle(0, 0, 800, 600, 0x000000).setDepth(overlayDepth).setAlpha(0.6);
		const bg = this.add.existing(new RoundRectangle(this, 0, 0, 520, 340, 15, darkBackgroundColor));
		this.resetConfirmationContainer = this.add.container(400, 300, [overlay, bg]).setDepth(popupDepth).setAlpha(0);
		this.makeButton("yes");
		this.makeButton("cancel");
	}

	makeButton(type: string) {
		const highlight = this.add.existing(new RoundRectangle(this, 0, 0, 58, 36, 10, 0xffffff)).setAlpha(0);
		const buttonText = this.add.text(0, 0, "", textStyle).setAlign("center").setOrigin(0.5, 0.5);
		const button = this.add
			.existing(new RoundRectangle(this, 0, 0, 58, 36, 10, buttonNormal))
			.setInteractive({ useHandCursor: true })
			.on("pointerover", () => {
				button.setFillStyle(buttonHover, 1);
			})
			.on("pointerout", () => {
				button.setFillStyle(buttonNormal, 1);
			})
			.on("pointerdown", () => {
				button.setFillStyle(buttonClick, 1);
				this.add.tween({
					targets: [highlight],
					ease: "Sine.easeIn",
					props: {
						width: {
							value: 63,
							duration: 150,
							ease: "Sine.easeIn",
						},
						height: {
							value: 41,
							duration: 150,
							ease: "Sine.easeIn",
						},
						alpha: {
							value: 0.3,
							duration: 150,
							ease: "Sine.easeIn",
						},
					},
					callbackScope: this,
				});
			});
		if (type === "yes") {
			highlight.x = 0;
			buttonText.setText("YES").setX(0);
			button.setX(0);
		} else {
			highlight.x = 120;
			buttonText.setText("CANCEL").setX(120);
			button.setX(120).on("pointerup", () => {
				this.add.tween({
					targets: [this.resetConfirmationContainer],
					ease: "Sine.easeIn",
					duration: 100,
					alpha: 0,
					onComplete: () => {
						this.interactiveObjects.forEach(object => object.setInteractive({ useHandCursor: true }));
						highlight.setAlpha(0);
					},
					callbackScope: this,
				});
			});
		}
		this.resetConfirmationContainer.add([highlight, button, buttonText]);
	}

	update() {
		if (!this.registry.has("FinishedSignIn")) {
			this.scene.start("Signin");
		}
	}
}

export default MenuScene;
