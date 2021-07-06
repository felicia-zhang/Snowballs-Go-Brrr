import { PlayFabClient } from "playfab-sdk";
import {
	darkRed,
	normalRed,
	lightRed,
	darkBackgroundColor,
	darkBlue,
	normalBlue,
	lightBlue,
	overlayDepth,
	popupDepth,
	textStyle,
	fontFamily,
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

		PlayFabClient.GetCatalogItems({ CatalogVersion: "1" }, (error, result) => {
			this.registry.set("CatalogItems", result.data.Catalog);

			PlayFabClient.GetPlayerStatistics({ StatisticNames: ["resetBonus"] }, (e, r) => {
				const resetStat = r.data.Statistics.find(
					(stat: PlayFabClientModels.StatisticValue) => stat.StatisticName === "resetBonus"
				);
				if (resetStat !== undefined) {
					this.registry.set("ResetBonus", resetStat.Value);
				} else {
					this.registry.set("ResetBonus", 0);
				}
			});

			PlayFabClient.GetUserInventory({}, (error, result) => {
				this.registry.set("SB", result.data.VirtualCurrency.SB);
				this.registry.set("IC", result.data.VirtualCurrency.IC);
				this.registry.set("Inventories", result.data.Inventory);

				this.makeResetConfirmationContainer();

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
		const snowballBalance = this.registry.get("SB") / 100;
		const overlay = this.add.rectangle(0, 0, 800, 600, 0x000000).setDepth(overlayDepth).setAlpha(0.6);
		const bg = this.add.existing(new RoundRectangle(this, 0, 0, 380, 340, 15, darkBackgroundColor));
		const description = this.add
			.text(
				0,
				-150,
				`Reset game to generate +0.01 more snowballs\nfor every 10000 snowballs in your balance\n\nYour current snowball balance is:\n${snowballBalance}\n\nReset will award you with:\n+${
					Math.floor(this.registry.get("SB") / 1000000) / 100
				} snowballs\n\n*Reset will NOT\naffect your in-app purchase history\nor your icicle balance`,
				textStyle
			)
			.setAlign("center")
			.setOrigin(0.5, 0);
		this.resetConfirmationContainer = this.add
			.container(400, 300, [overlay, bg, description])
			.setDepth(popupDepth)
			.setAlpha(0);
		this.makeButton("yes");
		this.makeButton("cancel");
	}

	makeButton(type: string) {
		const isConfirm = type === "yes";
		const highlight = this.add.existing(new RoundRectangle(this, 0, 134, 68, 36, 10, 0xffffff)).setAlpha(0);
		const buttonText = this.add.text(0, 134, "", textStyle).setAlign("center").setOrigin(0.5, 0.5);
		const button = this.add
			.existing(new RoundRectangle(this, 0, 134, 68, 36, 10, isConfirm ? lightBlue : lightRed))
			.setInteractive({ useHandCursor: true })
			.on("pointerover", () => {
				isConfirm ? button.setFillStyle(normalBlue, 1) : button.setFillStyle(normalRed, 1);
			})
			.on("pointerout", () => {
				isConfirm ? button.setFillStyle(lightBlue, 1) : button.setFillStyle(lightRed, 1);
			})
			.on("pointerdown", () => {
				isConfirm ? button.setFillStyle(darkBlue, 1) : button.setFillStyle(darkRed, 1);
				this.add.tween({
					targets: [highlight],
					ease: "Sine.easeIn",
					props: {
						width: {
							value: 73,
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
		if (isConfirm) {
			highlight.x = 70;
			buttonText.setText("RESET").setX(70);
			button.setX(70).on("pointerup", () => {
				this.setLoading(true);
				const inventoriesToRevoke: { [key: number]: Set<string> } = {};
				this.registry
					.get("Inventories")
					.filter((inventory: PlayFabClientModels.ItemInstance) => inventory.ItemId !== "5")
					.forEach((inventory: PlayFabClientModels.ItemInstance, i) => {
						const group = Math.floor(i / 25);
						if (!(group in inventoriesToRevoke)) {
							inventoriesToRevoke[group] = new Set();
						}
						inventoriesToRevoke[group].add(inventory.ItemInstanceId);
					});
				this.revokeInventoryItems(0, inventoriesToRevoke, () => this.reset());
			});
		} else {
			highlight.x = -70;
			buttonText.setText("CANCEL").setX(-70);
			button.setX(-70).on("pointerup", () => {
				button.setFillStyle(lightRed, 1);
				highlight.setAlpha(0);
				this.closeResetConfirmationContainer();
			});
		}
		this.resetConfirmationContainer.add([highlight, button, buttonText]);
	}

	setLoading(isLoading: boolean) {
		const highlight = this.resetConfirmationContainer.getAt(3) as RoundRectangle;
		const button = this.resetConfirmationContainer.getAt(4) as RoundRectangle;
		const text = this.resetConfirmationContainer.getAt(5) as Phaser.GameObjects.Text;
		if (isLoading) {
			text.setText(". . .").setOrigin(0.5, 0.725).setStyle({
				fontFamily: fontFamily,
				fontSize: "32px",
				stroke: "#ffffff",
				strokeThickness: 3,
			});
			button.setFillStyle(darkBlue, 1).disableInteractive().removeListener("pointerout");
		} else {
			text.setText("RESET")
				.setOrigin(0.5, 0.5)
				.setStyle({ ...textStyle, strokeThickness: 0 });
			button
				.setFillStyle(lightBlue, 1)
				.setInteractive({ useHandCursor: true })
				.on("pointerout", () => {
					button.setFillStyle(lightBlue, 1);
				});
			highlight.setAlpha(0);
			this.closeResetConfirmationContainer();
		}
	}

	closeResetConfirmationContainer() {
		this.add.tween({
			targets: [this.resetConfirmationContainer],
			ease: "Sine.easeIn",
			duration: 100,
			alpha: 0,
			onComplete: () => {
				this.interactiveObjects.forEach(object => object.setInteractive({ useHandCursor: true }));
			},
			callbackScope: this,
		});
	}

	reset() {
		const bonus = Math.floor(this.registry.get("SB") / 1000000);
		PlayFabClient.ExecuteCloudScript(
			{
				FunctionName: "updateResetStatistics",
				FunctionParameter: {
					bonus: bonus,
				},
			},
			(e, r) => {
				const currentResetBonus = this.registry.get("ResetBonus");
				this.registry.set("ResetBonus", currentResetBonus + bonus);
				console.log("Added reset bonus statistics", bonus);
				PlayFabClient.UpdateUserData(
					{ KeysToRemove: ["5LastUpdated", "6LastUpdated", "7LastUpdated", "8LastUpdated", "9LastUpdated"] },
					(e, r) => {
						console.log("Cleared biomes LastUpdated data");
						PlayFabClient.ExecuteCloudScript(
							{
								FunctionName: "subtractSnowballs",
								FunctionParameter: { amount: this.registry.get("SB") },
							},
							(e, r) => {
								console.log("Revoked all snowballs");
								this.registry.set("SB", 0);
								this.setLoading(false);
								this.showToast("Reset Game", false);
							}
						);
					}
				);
			}
		);
	}

	revokeInventoryItems(key: number, inventoriesToRevoke: { [key: number]: Set<string> }, callback) {
		if (!(key in inventoriesToRevoke)) {
			callback();
		} else {
			const idsToRevoke: Set<string> = inventoriesToRevoke[key];
			PlayFabClient.ExecuteCloudScript(
				{
					FunctionName: "revokeInventoryItems",
					FunctionParameter: { itemInstanceIds: Array.from(idsToRevoke) },
				},
				(e, r) => {
					console.log("Revoked items", idsToRevoke);
					const newInventories = this.registry
						.get("Inventories")
						.filter(
							(inventory: PlayFabClientModels.ItemInstance) => !idsToRevoke.has(inventory.ItemInstanceId)
						);
					this.registry.set("Inventories", newInventories);
					if (key + 1 in inventoriesToRevoke) {
						this.revokeInventoryItems(key + 1, inventoriesToRevoke, callback);
					} else {
						callback();
					}
				}
			);
		}
	}

	update() {
		if (!this.registry.has("FinishedSignIn")) {
			this.scene.start("Signin");
		}
	}
}

export default MenuScene;
