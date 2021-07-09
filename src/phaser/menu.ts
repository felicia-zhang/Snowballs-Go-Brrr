import { PlayFabClient } from "playfab-sdk";
import { darkBackgroundColor, overlayDepth, popupDepth, textStyle, lightBackgroundColor } from "../utils/constants";
import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";
import AScene from "./AScene";
import Button from "../utils/button";
import CloseButton from "../utils/closeButton";
import { numberWithCommas } from "../utils/stringFormat";

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
						this.showResetConfirmationContainer();
					});
				this.interactiveObjects.push(resetButton);
			});
		});
	}

	showResetConfirmationContainer() {
		const snowballBalance = this.registry.get("SB");
		const resetBonus = Math.floor(snowballBalance / 1000000);

		const snowballText = this.resetConfirmationContainer.getAt(4) as Phaser.GameObjects.Text;
		snowballText.setText(`${numberWithCommas(snowballBalance / 100)} x`);

		const snowballIcon = this.resetConfirmationContainer.getAt(5) as Phaser.GameObjects.Image;
		const snowballX = (snowballText.width + snowballIcon.displayWidth + 6) / 2;
		snowballText.setX(-snowballX);
		snowballIcon.setX(snowballX);

		const resetBonusText = this.resetConfirmationContainer.getAt(6) as Phaser.GameObjects.Text;
		resetBonusText.setText(`${numberWithCommas(resetBonus / 100)} x`);

		const resetBonusIcon = this.resetConfirmationContainer.getAt(7) as Phaser.GameObjects.Image;
		const resetX = (resetBonusText.width + resetBonusIcon.displayWidth + 6) / 2;
		resetBonusText.setX(-resetX);
		resetBonusIcon.setX(resetX);

		this.add.tween({
			targets: [this.resetConfirmationContainer],
			ease: "Sine.easeIn",
			duration: 500,
			alpha: 1,
			callbackScope: this,
		});
	}

	makeResetConfirmationContainer() {
		const overlay = this.add.rectangle(0, 0, 800, 600, 0x000000).setDepth(overlayDepth).setAlpha(0.6);
		const darkBg = this.add.existing(new RoundRectangle(this, 0, 0, 380, 340, 15, darkBackgroundColor));
		const lightBg = this.add.existing(new RoundRectangle(this, 0, 45, 340, 210, 15, lightBackgroundColor));
		const description = this.add
			.text(
				0,
				-150,
				`Reset game to earn 0.01 reset bonus\nfor every 10,000 snowballs in your balance.\nThe reset bonus will be applied to\nmanual clicks and item effects.\n\nYour current snowball balance is:\n\n\nReset will award you with:`,
				textStyle
			)
			.setAlign("center")
			.setOrigin(0.5, 0);
		const snowballText = this.add.text(0, -15, "", textStyle).setAlign("left").setOrigin(0, 0.5);
		const snowballIcon = this.add.image(0, -15, "snowball").setScale(0.15).setOrigin(1, 0.5);
		const resetBonusText = this.add.text(0, 45, "", textStyle).setAlign("left").setOrigin(0, 0.5);
		const resetBonusIcon = this.add.image(0, 45, "star").setScale(0.15).setOrigin(1, 0.5);
		const footnote = this.add
			.text(0, 180, "*Reset will NOT affect\nyour in-app purchase history\nor your icicle balance", textStyle)
			.setAlign("center")
			.setOrigin(0.5, 0);
		this.resetConfirmationContainer = this.add
			.container(400, 300, [
				overlay,
				darkBg,
				lightBg,
				description,
				snowballText,
				snowballIcon,
				resetBonusText,
				resetBonusIcon,
				footnote,
			])
			.setDepth(popupDepth)
			.setAlpha(0);

		const resetButton = new Button(this, 0, 114, "blue")
			.setText("RESET")
			.addCallback(() => this.reset(resetButton));
		const closeButton = new CloseButton(this, 177.5, -157.5).addCallback(this.resetConfirmationContainer, () => {
			resetButton.resetButton();
		});
		this.resetConfirmationContainer.add([resetButton, closeButton]);
	}

	reset(button: Button) {
		button.toggleLoading(true);
		const bonus = Math.floor(this.registry.get("SB") / 1000000);
		const inventoryGroupsToRevoke: string[][] = [];
		let i = 0;
		const inventoryIds: string[] = this.registry
			.get("Inventories")
			.filter((inventory: PlayFabClientModels.ItemInstance) => inventory.ItemId !== "5")
			.map((inventory: PlayFabClientModels.ItemInstance) => inventory.ItemInstanceId);
		while (i < inventoryIds.length) {
			inventoryGroupsToRevoke.push(inventoryIds.slice(i, i + 25));
			i += 25;
		}
		PlayFabClient.ExecuteCloudScript(
			{
				FunctionName: "resetGame",
				FunctionParameter: {
					inventoryGroupsToRevoke: inventoryGroupsToRevoke,
					bonus: bonus,
					snowballs: this.registry.get("SB"),
				},
			},
			(e, r) => {
				const icebiome: PlayFabClientModels.ItemInstance = this.registry
					.get("Inventories")
					.find((inventory: PlayFabClientModels.ItemInstance) => inventory.ItemId === "5");
				this.registry.set("Inventories", [icebiome]);
				const currentResetBonus = this.registry.get("ResetBonus");
				this.registry.set("ResetBonus", currentResetBonus + bonus);
				this.registry.set("SB", 0);

				const result = r.data.FunctionResult;
				console.log("Revoked items errors: ", result.revokeItemsErrors);
				console.log("Added reset bonus statistics", bonus);
				console.log("Cleared biomes LastUpdated data");
				console.log("Revoked all snowballs: ", result.subtractSBResult);
				button.toggleLoading(false);
				this.add.tween({
					targets: [this.resetConfirmationContainer],
					ease: "Sine.easeIn",
					duration: 300,
					alpha: 0,
					onComplete: () => {
						this.interactiveObjects.forEach(object => object.setInteractive({ useHandCursor: true }));
						this.showToast("Reset Game", false);
					},
					callbackScope: this,
				});
			}
		);
	}

	update() {
		if (!this.registry.has("FinishedSignIn")) {
			this.scene.start("Signin");
		}
	}
}

export default MenuScene;
