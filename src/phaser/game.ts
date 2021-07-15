import { PlayFabClient } from "playfab-sdk";
import {
	darkBackgroundColor,
	fontFamily,
	smallFontSize,
	textStyle,
	lightBackgroundColor,
	overlayDepth,
	popupDepth,
	clickAnimationDepth,
} from "../utils/constants";
import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";
import AScene from "./AScene";
import { BundleDetail, ItemDetail } from "../utils/types";
import Button from "../utils/button";
import CloseButton from "../utils/closeButton";
import { numberWithCommas, wrapString } from "../utils/stringFormat";
import TextButton from "../utils/textButton";

class GameScene extends AScene {
	readonly syncDelay = 60000;
	resetBonus: number;
	biomeId: string;
	biomeName: string;
	clickMultiplier: number;
	totalAddedSnowballs: number;
	syncTimer: Phaser.Time.TimerEvent;
	storeItems: PlayFabClientModels.StoreItem[];
	inventoryObjects: Phaser.GameObjects.GameObject[];
	inventoryTimers: Phaser.Time.TimerEvent[];
	snowballText: Phaser.GameObjects.Text;
	snowballIcon: Phaser.GameObjects.Image;
	icicleText: Phaser.GameObjects.Text;
	icicleIcon: Phaser.GameObjects.Image;
	resetBonusText: Phaser.GameObjects.Text;
	resetBonusIcon: Phaser.GameObjects.Image;
	storeContainer: Phaser.GameObjects.Container;
	resetConfirmationContainer: Phaser.GameObjects.Container;
	leaderboardContainer: Phaser.GameObjects.Container;
	isNewPlayer: boolean;
	clickPenguinInstruction?: Phaser.GameObjects.Text;

	constructor() {
		super("Game");
	}

	create({ biomeId, biomeName }) {
		this.cameras.main.fadeIn(1000, 0, 0, 0);
		this.add.image(400, 300, "sky");

		this.isNewPlayer = this.registry.get("isNewPlayer") ? true : false;
		this.resetBonus = this.registry.get("ResetBonus") === 0 ? 0 : this.registry.get("ResetBonus");
		this.biomeId = biomeId;
		this.biomeName = biomeName;
		this.clickMultiplier = 100;
		this.totalAddedSnowballs = 0;
		this.storeItems = [];
		this.inventoryObjects = [];
		this.inventoryTimers = [];
		this.makePenguin();
		this.makeStoreContainer();
		this.makeResetConfirmationContainer();
		this.makeLeaderboardContainer();

		this.registry
			.get("CatalogItems")
			.filter((item: PlayFabClientModels.CatalogItem) => item.ItemClass !== "biome")
			.forEach((item: PlayFabClientModels.CatalogItem, i) => {
				if (item.ItemClass === "item") {
					this.itemsMap[item.ItemId] = {
						ItemId: item.ItemId,
						DisplayName: item.DisplayName,
						Description: item.Description,
						Instances: {},
					} as ItemDetail;
				} else if (item.ItemClass === "bundle") {
					this.bundlesMap[item.ItemId] = {
						ItemId: item.ItemId,
						DisplayName: item.DisplayName,
						Icicles: item.Bundle.BundledVirtualCurrencies.IC,
					} as BundleDetail;
				}
			});

		this.registry
			.get("Inventories")
			.filter(
				(inventory: PlayFabClientModels.ItemInstance) =>
					inventory.CustomData !== undefined && inventory.CustomData.BiomeId === this.biomeId
			)
			.forEach(inventory => this.inventoryItemFactory(inventory));

		PlayFabClient.GetUserData({ Keys: [`${this.biomeId}LastUpdated`] }, (error, result) => {
			if (result.data.Data[`${this.biomeId}LastUpdated`] !== undefined) {
				const lastUpdated = result.data.Data[`${this.biomeId}LastUpdated`].Value;
				const elapsed = new Date().valueOf() - Number(lastUpdated);
				const elapsedSeconds = elapsed / 1000;
				console.log("Elapsed seconds:", elapsedSeconds);
				const numberOfBonfires = Object.keys(this.itemsMap.bonfire.Instances).length;
				const numberOfSnowmans = Object.keys(this.itemsMap.snowman.Instances).length;
				const numberOfIgloos = Object.keys(this.itemsMap.igloo.Instances).length;
				const numberOfVaults = Object.keys(this.itemsMap.vault.Instances).length;
				const sb =
					Math.floor(elapsedSeconds / 10) * numberOfBonfires * (100 + this.resetBonus) +
					Math.floor(elapsedSeconds) * numberOfSnowmans * (100 + this.resetBonus) +
					Math.floor(elapsedSeconds) * numberOfIgloos * (1000 + this.resetBonus) +
					Math.floor(elapsedSeconds) * numberOfVaults * (10000 + this.resetBonus);

				this.registry.values.SB += sb;
				this.totalAddedSnowballs += sb;
				this.showToast(`${numberWithCommas(sb / 100)} snowballs added \nwhile player was away`, false);
			} else {
				this.showToast(`Welcome to ${this.biomeName}`, false);
			}
		});

		this.registry.events.on("changedata", this.updateData, this);

		this.syncTimer = this.time.addEvent({
			delay: this.syncDelay,
			loop: true,
			callback: () => this.syncData(() => this.showToast("Saved", false)),
		});

		this.snowballText = this.add.text(50, 16, `: ${numberWithCommas(this.registry.get("SB") / 100)}`, textStyle);
		this.snowballIcon = this.add.image(31, 25, "snowball").setScale(0.15);
		this.icicleText = this.add.text(44, 56, `: ${numberWithCommas(this.registry.get("IC"))}`, textStyle);
		this.icicleIcon = this.add.image(31, 65, "icicle").setScale(0.15);
		this.resetBonusText = this.add.text(50, 96, "", textStyle);
		this.resetBonusIcon = this.add.image(31, 105, "star").setScale(0.15).setAlpha(0);
		if (this.resetBonus !== 0) {
			this.resetBonusText.setText(`: +${numberWithCommas(this.resetBonus / 100)}`);
			this.resetBonusIcon.setAlpha(1);
		}

		this.add.text(400, 16, this.biomeName.toUpperCase(), textStyle).setAlign("center").setOrigin(0.5, 0);

		const storeButton = this.add.existing(
			new TextButton(this, 16, 424, "STORE", "left").addCallback(() => {
				this.interactiveObjects.forEach(object => object.disableInteractive());
				this.showStoreContainer();
			})
		);
		this.interactiveObjects.push(storeButton);

		const mapButton = this.add.existing(
			new TextButton(this, 16, 464, "MAP", "left").addCallback(() => {
				this.syncData(() => {
					this.cameras.main.fadeOut(500, 0, 0, 0);
					this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, (cam, effect) => {
						this.scene.start("Map");
					});
				});
			})
		);
		this.interactiveObjects.push(mapButton);

		const leaderboardButton = this.add.existing(
			new TextButton(this, 16, 504, "LEADERBOARD", "left").addCallback(() => {
				this.interactiveObjects.forEach(object => object.disableInteractive());
				this.showLeaderboardContainer();
			})
		);
		this.interactiveObjects.push(leaderboardButton);

		const resetButton = this.add.existing(
			new TextButton(this, 16, 544, "RESET", "left").addCallback(() => {
				this.interactiveObjects.forEach(object => object.disableInteractive());
				this.showResetConfirmationContainer();
			})
		);
		this.interactiveObjects.push(resetButton);

		const iapButton = this.add.existing(
			new TextButton(this, 16, 584, "IN-APP PURCHASE EXAMPLE", "left").addCallback(() => {
				this.interactiveObjects.forEach(object => object.disableInteractive());
				this.showCurrencyContainer();
			})
		);
		this.interactiveObjects.push(iapButton);

		if (this.isNewPlayer) {
			this.clickPenguinInstruction = this.add
				.text(200, 300, wrapString("Click on the penguin to generate snowballs"), textStyle)
				.setAlign("left");
		}
	}

	updateData(parent, key, data) {
		if (this.scene.isActive()) {
			if (key === "SB") {
				this.snowballText.setText(`: ${numberWithCommas(data / 100)}`);
			} else if (key === "IC") {
				this.icicleText.setText(`: ${numberWithCommas(data)}`);
			} else if (key === "ResetBonus") {
				if (data !== 0) {
					this.resetBonus = data;
					this.resetBonusText.setText(`: +${numberWithCommas(data / 100)}`);
					this.resetBonusIcon.setAlpha(1);
				}
			}
		}
	}

	update() {
		if (!this.registry.has("FinishedSignIn")) {
			this.scene.start("Signin");
		}
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
		const resetX = (resetBonusText.width + 36) / 2;
		resetBonusText.setX(-resetX);
		resetBonusIcon.setX(resetX + 7.5);

		this.add.tween({
			targets: [this.resetConfirmationContainer],
			ease: "Sine.easeIn",
			duration: 500,
			alpha: 1,
			callbackScope: this,
		});
	}

	makeLeaderboardContainer() {
		const overlay = this.add.rectangle(0, 0, 800, 600, 0x000000).setDepth(overlayDepth).setAlpha(0.6);
		const darkBg = this.add.existing(new RoundRectangle(this, 0, 0, 440, 420, 15, darkBackgroundColor));
		const statList = this.add.container(0, 0, []);

		this.leaderboardContainer = this.add
			.container(400, 300, [overlay, darkBg, statList])
			.setDepth(popupDepth)
			.setAlpha(0);

		const closeButton = this.add.existing(
			new CloseButton(this, 207.5, -197.5).addCallback(this.leaderboardContainer, () => {
				const statList = this.leaderboardContainer.getAt(2) as Phaser.GameObjects.Container;
				statList.removeAll(true);
			})
		);
		this.leaderboardContainer.add(closeButton);
	}

	showLeaderboardContainer() {
		const statList = this.leaderboardContainer.getAt(2) as Phaser.GameObjects.Container;

		PlayFabClient.GetLeaderboard(
			{ StatisticName: "snowballs", StartPosition: 0, MaxResultsCount: 5 },
			(error, result) => {
				const players = result.data.Leaderboard;
				players.forEach((player, i) => {
					const lightBg = this.add.existing(
						new RoundRectangle(this, 0, i * 80 - 160, 400, 60, 15, lightBackgroundColor)
					);
					const rankText = this.add
						.text(-184, i * 80 - 160, `#${(i + 1).toString()}`, textStyle)
						.setOrigin(0, 0.5)
						.setAlign("left");
					const playerText = this.add
						.text(0, i * 80 - 160, player.DisplayName, textStyle)
						.setAlign("Center")
						.setOrigin(0.5, 0.5);
					const statText = this.add
						.text(184, i * 80 - 160, `${numberWithCommas(player.StatValue / 100)}`, textStyle)
						.setOrigin(1, 0.5)
						.setAlign("right");
					statList.add([lightBg, rankText, playerText, statText]);
				});
			}
		);
		this.add.tween({
			targets: [this.leaderboardContainer],
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

		const resetButton = this.add.existing(
			new Button(this, 0, 114).setText("RESET").addCallback(() => this.reset(resetButton))
		);
		const closeButton = this.add.existing(
			new CloseButton(this, 177.5, -157.5).addCallback(this.resetConfirmationContainer, () => {
				resetButton.resetButton();
			})
		);
		this.resetConfirmationContainer.add([resetButton, closeButton]);
	}

	reset(button: Button) {
		button.toggleLoading(true);
		this.inventoryObjects.forEach((object: Phaser.GameObjects.GameObject) => {
			object.destroy(true);
		});
		this.inventoryObjects = [];
		this.inventoryTimers.forEach((timer: Phaser.Time.TimerEvent) => {
			timer.destroy();
		});
		this.inventoryTimers = [];

		this.syncData(() => {
			const bonus = Math.floor(this.registry.get("SB") / 1000000);
			const inventoryGroupsToRevoke: string[][] = [];
			let i = 0;
			const inventoryIds: string[] = this.registry
				.get("Inventories")
				.filter((inventory: PlayFabClientModels.ItemInstance) => inventory.ItemId !== "icebiome")
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
						snowballsToRevoke: this.registry.get("SB"),
					},
				},
				(e, r) => {
					this.clickMultiplier = 100;
					this.totalAddedSnowballs = 0;
					const icebiome: PlayFabClientModels.ItemInstance = this.registry
						.get("Inventories")
						.find((inventory: PlayFabClientModels.ItemInstance) => inventory.ItemId === "icebiome");
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

							if (this.biomeId !== "icebiome") {
								this.cameras.main.fadeOut(500, 0, 0, 0);
								this.cameras.main.once(
									Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
									(cam, effect) => {
										this.scene.start("Game", { biomeId: "icebiome", biomeName: "Ice Biome" });
									}
								);
							}
						},
						callbackScope: this,
					});
				}
			);
		});
	}

	makeStoreContainer() {
		const overlay = this.add.rectangle(0, 0, 800, 600, 0x000000).setDepth(overlayDepth).setAlpha(0.6);
		const mainBackground = this.add.existing(new RoundRectangle(this, 0, 0, 380, 450, 15, darkBackgroundColor));
		const itemDescriptionPopup = this.add.text(200, -60, "", textStyle).setAlpha(0);
		const itemList = this.add.container(0, 0, []);
		this.storeContainer = this.add
			.container(400, 300, [overlay, mainBackground, itemDescriptionPopup, itemList])
			.setAlpha(0)
			.setDepth(popupDepth);
		const closeButton = this.add.existing(
			new CloseButton(this, 177.5, -212.5).addCallback(this.storeContainer, () => {
				const itemList = this.storeContainer.getAt(3) as Phaser.GameObjects.Container;
				itemList.removeAll(true);
				this.storeItems = [];
			})
		);
		this.storeContainer.add(closeButton);
	}

	showStoreContainer() {
		PlayFabClient.GetStoreItems({ StoreId: this.biomeId }, (error, result) => {
			const storeId = result.data.StoreId;
			result.data.Store.forEach((storeItem: PlayFabClientModels.StoreItem) => {
				this.makeStoreItem(storeItem, storeId);
			});
		});
		this.add.tween({
			targets: [this.storeContainer],
			ease: "Sine.easeIn",
			duration: 500,
			alpha: 1,
			callbackScope: this,
		});
	}

	makePenguin() {
		this.anims.create({
			key: "squish",
			frames: [
				{ key: "penguin1" },
				{ key: "penguin2" },
				{ key: "penguin3" },
				{ key: "penguin2" },
				{ key: "penguin1" },
			],
			frameRate: 8,
		});

		const sprite = this.add
			.sprite(35, 300, "penguin1")
			.setOrigin(0, 0.5)
			.setScale(0.5)
			.setInteractive({ useHandCursor: true })
			.on("pointerup", (pointer: Phaser.Input.Pointer) => {
				if (this.clickPenguinInstruction !== undefined) {
					this.clickPenguinInstruction.setAlpha(0);
				}
				const currentClickMultiplier = this.clickMultiplier + this.resetBonus;
				this.totalAddedSnowballs += currentClickMultiplier;
				this.registry.values.SB += currentClickMultiplier;
				const amountText = this.add
					.text(pointer.x, pointer.y, (currentClickMultiplier / 100).toString(), textStyle)
					.setAlpha(0)
					.setAlign("center")
					.setOrigin(0.5, 0.5)
					.setDepth(clickAnimationDepth);
				this.showClickAnimation(amountText);
				if (!sprite.anims.isPlaying) {
					sprite.anims.play("squish");
				}
			});
		this.interactiveObjects.push(sprite);
		return sprite;
	}

	makeStoreItem(storeItem: PlayFabClientModels.StoreItem, storeId: string) {
		const itemDescriptionPopup = this.storeContainer.getAt(2) as Phaser.GameObjects.Text;
		const itemDetail: ItemDetail = this.itemsMap[storeItem.ItemId];
		const maybeItemDiscountPrice = storeItem.VirtualCurrencyPrices.SB;

		const index = this.storeItems.length;
		const y = -170 + index * 85;
		this.storeItems.push(storeItem);
		const background = this.add
			.existing(new RoundRectangle(this, 0, y, 340, 70, 15, lightBackgroundColor))
			.setInteractive()
			.on("pointerover", (pointer: Phaser.Input.Pointer, localX, localY, event) => {
				this.add.tween({
					targets: [itemDescriptionPopup],
					ease: "Sine.easeIn",
					alpha: 1,
					duration: 300,
					onStart: () => {
						itemDescriptionPopup.setText(wrapString(itemDetail.Description));
						itemDescriptionPopup.setY(pointer.y - 330);
					},
					callbackScope: this,
				});
			})
			.on("pointerout", (pointer: Phaser.Input.Pointer, event) => {
				itemDescriptionPopup.setAlpha(0);
			});

		const image = this.add.image(-135, y, storeItem.ItemId).setScale(0.25);
		const nameText = this.add
			.text(-100, y, itemDetail.DisplayName.toUpperCase(), textStyle)
			.setAlign("left")
			.setOrigin(0, 0.5);
		const button = this.add.existing(
			new Button(this, 150, y)
				.addIcon("snowball")
				.setText(`${numberWithCommas(maybeItemDiscountPrice / 100)} x`)
				.addCallback(() => this.purchaseItem(itemDetail, maybeItemDiscountPrice, storeId, button))
		);
		button.setX(160 - button.background.width / 2);
		const itemList = this.storeContainer.getAt(3) as Phaser.GameObjects.Container;
		itemList.add([background, image, nameText, button]);

		if (storeId === `${this.biomeId}WithDiscount`) {
			button.setY(-160 + index * 85);

			const fullPriceText = this.add
				.text(121, -192 + index * 85, `${numberWithCommas(storeItem.CustomData.FullPrice / 100)} x`, {
					fontSize: smallFontSize,
					fontFamily: fontFamily,
				})
				.setAlign("right")
				.setOrigin(1, 0.5);
			const oldSnowballIcon = this.add.image(135, -191 + index * 85, "snowball").setScale(0.09);
			const yPosition = -96 + index * 42.5;
			const line = this.add
				.line(75, yPosition, 75, yPosition, 110 + fullPriceText.width, yPosition, 0xffffff)
				.setOrigin(1, 0.5);
			itemList.add([fullPriceText, oldSnowballIcon, line]);
		}
	}

	purchaseItem(itemDetail: ItemDetail, maybeItemDiscountPrice: number, storeId: string, button: Button) {
		if (Object.keys(itemDetail.Instances).length === 6) {
			this.showToast("Not enough room", true);
		} else {
			button.toggleLoading(true);
			this.syncData(() => {
				PlayFabClient.PurchaseItem(
					{
						ItemId: itemDetail.ItemId,
						Price: maybeItemDiscountPrice,
						StoreId: storeId,
						VirtualCurrency: "SB",
					},
					(e, r) => {
						if (e !== null) {
							this.time.addEvent({
								delay: 400,
								callback: () => {
									button.toggleLoading(false);
									this.showToast("Not enough snowballs", true);
								},
							});
						} else {
							PlayFabClient.ExecuteCloudScript(
								{
									FunctionName: "updateInventoryCustomData",
									FunctionParameter: {
										instanceId: r.data.Items[0].ItemInstanceId,
										biomeId: this.biomeId,
									},
								},
								(error, result) => {
									button.toggleLoading(false);
									this.registry.values.SB -= maybeItemDiscountPrice;
									this.registry.values.Inventories.push(result.data.FunctionResult);
									this.inventoryItemFactory(result.data.FunctionResult);
									this.showToast(`1 ${itemDetail.DisplayName} successfully purchased`, false);
								}
							);
						}
					}
				);
			});
		}
	}

	inventoryItemFactory(inventory: PlayFabClientModels.ItemInstance) {
		const itemDetail: ItemDetail = this.itemsMap[inventory.ItemId];
		const index = Object.keys(itemDetail.Instances).length;
		itemDetail.Instances[inventory.ItemInstanceId] = inventory;
		let sprite: Phaser.GameObjects.Sprite;
		if (inventory.ItemId === "mittens") {
			sprite = this.makeMittens(index);
		} else if (inventory.ItemId === "bonfire") {
			sprite = this.makeItem(index, 150, 100, 10000, inventory.ItemId);
		} else if (inventory.ItemId === "snowman") {
			sprite = this.makeItem(index, 250, 100, 1000, inventory.ItemId);
		} else if (inventory.ItemId === "igloo") {
			sprite = this.makeItem(index, 350, 1000, 1000, inventory.ItemId);
		} else if (inventory.ItemId === "vault") {
			sprite = this.makeItem(index, 450, 10000, 1000, inventory.ItemId);
		}
		sprite.setOrigin(0, 0).setScale(0.5);
	}

	makeMittens(index: number) {
		this.clickMultiplier += 100;
		return this.add.sprite(170 + index * 100, 50, "mittens");
	}

	makeItem(index: number, y: number, snowballGeneration: number, delay: number, imageKey: string) {
		const snowballsToAdd = snowballGeneration + this.resetBonus;
		const amountText = this.add
			.text(220 + index * 100, y, `+${snowballsToAdd / 100}`, textStyle)
			.setAlpha(0)
			.setAlign("center")
			.setOrigin(0.5, 0.5)
			.setDepth(clickAnimationDepth);
		const timer = this.time.addEvent({
			delay: delay,
			loop: true,
			callback: () => {
				amountText.setY(y);
				this.registry.values.SB += snowballsToAdd;
				this.totalAddedSnowballs += snowballsToAdd;
				this.showClickAnimation(amountText);
			},
		});
		const sprite = this.add.sprite(170 + index * 100, y, imageKey);
		this.inventoryObjects.push(sprite, amountText);
		this.inventoryTimers.push(timer);
		return sprite;
	}

	showClickAnimation(amountText: Phaser.GameObjects.Text) {
		const startingY = amountText.y;
		this.add.tween({
			targets: [amountText],
			props: {
				y: {
					value: startingY - 100,
					duration: 500,
					ease: "Sine.easeIn",
				},
				alpha: {
					value: 0,
					duration: 500,
					ease: "Sine.easeIn",
				},
			},
			onStart: () => {
				amountText.setAlpha(1);
			},
			callbackScope: this,
		});
	}

	syncData(func: () => any) {
		PlayFabClient.UpdateUserData(
			{ Data: { [`${this.biomeId}LastUpdated`]: new Date().valueOf().toString() } },
			() => {}
		);

		const totalAdded = this.totalAddedSnowballs;
		if (totalAdded === 0) {
			console.log("No change to snowballs since last sync");
			if (func !== undefined) {
				func();
			}
		} else {
			PlayFabClient.ExecuteCloudScript(
				{
					FunctionName: "addSnowballs",
					FunctionParameter: { amount: totalAdded },
				},
				(error, result) => {
					console.log("Amount of snowballs added:", totalAdded);
					this.totalAddedSnowballs -= totalAdded;
					PlayFabClient.ExecuteCloudScript(
						{
							FunctionName: "updateSnowballStatistics",
							FunctionParameter: {
								amount: this.registry.values.SB,
							},
						},
						() => {
							if (func !== undefined) {
								func();
							}
						}
					);
				}
			);
		}
	}
}

export default GameScene;
