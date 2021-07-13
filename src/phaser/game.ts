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
import { BiomeDetail, BundleDetail, ItemDetail } from "../utils/types";
import Button from "../utils/button";
import CloseButton from "../utils/closeButton";
import { numberWithCommas, wrapString } from "../utils/stringFormat";
import TextButton from "../utils/textButton";

class GameScene extends AScene {
	readonly syncDelay = 60000;
	resetBonus: number;
	biomeDetail: BiomeDetail;
	clickMultiplier: number;
	totalAddedSnowballs: number;
	syncTimer: Phaser.Time.TimerEvent;
	storeItems: PlayFabClientModels.StoreItem[];
	snowballText: Phaser.GameObjects.Text;
	snowballIcon: Phaser.GameObjects.Image;
	icicleText: Phaser.GameObjects.Text;
	icicleIcon: Phaser.GameObjects.Image;
	storeContainer: Phaser.GameObjects.Container;

	constructor() {
		super("Game");
	}

	create({ biomeDetail }) {
		this.cameras.main.fadeIn(1000, 0, 0, 0);
		this.add.image(400, 300, "sky");
		this.resetBonus = this.registry.get("ResetBonus") === 0 ? 0 : this.registry.get("ResetBonus");
		this.biomeDetail = biomeDetail;
		this.clickMultiplier = 100;
		this.totalAddedSnowballs = 0;
		this.storeItems = [];
		this.makePenguin();
		this.makeStoreContainer();

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
					inventory.CustomData !== undefined && inventory.CustomData.BiomeId === this.biomeDetail.ItemId
			)
			.forEach(inventory => this.inventoryItemFactory(inventory));

		PlayFabClient.GetUserData({ Keys: [`${this.biomeDetail.ItemId}LastUpdated`] }, (error, result) => {
			if (result.data.Data[`${this.biomeDetail.ItemId}LastUpdated`] !== undefined) {
				const lastUpdated = result.data.Data[`${this.biomeDetail.ItemId}LastUpdated`].Value;
				const elapsed = new Date().valueOf() - Number(lastUpdated);
				const elapsedSeconds = elapsed / 1000;
				console.log("Elapsed seconds:", elapsedSeconds);
				const numberOfFires = Object.keys(this.itemsMap[1].Instances).length;
				const numberOfSnowmans = Object.keys(this.itemsMap[2].Instances).length;
				const numberOfIgloos = Object.keys(this.itemsMap[3].Instances).length;
				const numberOfVaults = Object.keys(this.itemsMap[4].Instances).length;
				const sb =
					Math.floor(elapsedSeconds / 10) * numberOfFires * (100 + this.resetBonus) +
					Math.floor(elapsedSeconds) * numberOfSnowmans * (100 + this.resetBonus) +
					Math.floor(elapsedSeconds) * numberOfIgloos * (1000 + this.resetBonus) +
					Math.floor(elapsedSeconds) * numberOfVaults * (10000 + this.resetBonus);

				this.registry.values.SB += sb;
				this.totalAddedSnowballs += sb;
				this.showToast(`${numberWithCommas(sb / 100)} snowballs added \nwhile player was away`, false);
			} else {
				this.showToast(`Welcome to ${this.biomeDetail.DisplayName}`, false);
			}
		});

		this.registry.events.on("changedata", this.updateData, this);

		this.syncTimer = this.time.addEvent({
			delay: this.syncDelay,
			loop: true,
			callback: () => this.syncData(() => this.showToast("Saved", false)),
		});

		this.snowballText = this.add.text(50, 16, `: ${numberWithCommas(this.registry.get("SB") / 100)}`, textStyle);
		this.snowballIcon = this.add.image(16, 25, "snowball").setScale(0.15).setOrigin(0, 0.5);
		this.icicleText = this.add.text(44, 56, `: ${numberWithCommas(this.registry.get("IC"))}`, textStyle);
		this.icicleIcon = this.add.image(16, 65, "icicle").setScale(0.15).setOrigin(0, 0.5);

		if (this.resetBonus !== 0) {
			this.add.text(50, 96, `: +${numberWithCommas(this.resetBonus / 100)}`, textStyle);
			this.add.image(16, 105, "star").setScale(0.15).setOrigin(0, 0.5);
		}

		this.add
			.text(400, 16, this.biomeDetail.DisplayName.toUpperCase(), textStyle)
			.setAlign("center")
			.setOrigin(0.5, 0);

		const storeButton = this.add.existing(
			new TextButton(this, 16, 464, "STORE", "left").addCallback(() => {
				this.interactiveObjects.forEach(object => object.disableInteractive());
				this.showStoreContainer();
			})
		);
		this.interactiveObjects.push(storeButton);

		const mapButton = this.add.existing(
			new TextButton(this, 16, 504, "MAP", "left").addCallback(() => {
				this.syncData(() => {
					this.cameras.main.fadeOut(500, 0, 0, 0);
					this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, (cam, effect) => {
						this.scene.start("Map");
					});
				});
			})
		);
		this.interactiveObjects.push(mapButton);

		const menuButton = this.add.existing(
			new TextButton(this, 16, 544, "MENU", "left").addCallback(() => {
				this.syncData(() => {
					this.cameras.main.fadeOut(500, 0, 0, 0);
					this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, (cam, effect) => {
						this.scene.start("Menu");
					});
				});
			})
		);
		this.interactiveObjects.push(menuButton);

		const iapButton = this.add.existing(
			new TextButton(this, 16, 584, "IN-APP PURCHASE EXAMPLE", "left").addCallback(() => {
				this.interactiveObjects.forEach(object => object.disableInteractive());
				this.showCurrencyContainer();
			})
		);
		this.interactiveObjects.push(iapButton);
	}

	updateData(parent, key, data) {
		if (this.scene.isActive()) {
			key === "SB"
				? this.snowballText.setText(`: ${numberWithCommas(data / 100)}`)
				: this.icicleText.setText(`: ${numberWithCommas(data)}`);
		}
	}

	update() {
		if (!this.registry.has("FinishedSignIn")) {
			this.scene.start("Signin");
		}
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
		PlayFabClient.GetStoreItems({ StoreId: this.biomeDetail.ItemId }, (error, result) => {
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

		let image: Phaser.GameObjects.Image;
		if (storeItem.ItemId === "0") {
			image = this.add.image(-135, y, "mittens").setScale(0.25);
		} else if (storeItem.ItemId === "1") {
			image = this.add.image(-135, y, "fire").setScale(0.25);
		} else if (storeItem.ItemId === "2") {
			image = this.add.image(-135, y, "snowman").setScale(0.25);
		} else if (storeItem.ItemId === "3") {
			image = this.add.image(-135, y, "igloo").setScale(0.25);
		} else if (storeItem.ItemId === "4") {
			image = this.add.image(-135, y, "vault").setScale(0.25);
		}
		const nameText = this.add
			.text(-100, y, itemDetail.DisplayName.toUpperCase(), textStyle)
			.setAlign("left")
			.setOrigin(0, 0.5);
		const button = this.add.existing(
			new Button(this, 150, y, "red")
				.addIcon("snowball")
				.setText(`${numberWithCommas(maybeItemDiscountPrice / 100)} x`)
				.addCallback(() => this.purchaseItem(itemDetail, maybeItemDiscountPrice, storeId, button))
		);
		button.setX(160 - button.background.width / 2);
		const itemList = this.storeContainer.getAt(3) as Phaser.GameObjects.Container;
		itemList.add([background, image, nameText, button]);

		if (storeId === `${this.biomeDetail.ItemId}WithDiscount`) {
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
										biomeId: this.biomeDetail.ItemId,
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
		const itemType = this.itemsMap[inventory.ItemId];
		const index = Object.keys(itemType.Instances).length;
		itemType.Instances[inventory.ItemInstanceId] = inventory;
		let sprite: Phaser.GameObjects.Sprite;
		if (inventory.ItemId === "0") {
			sprite = this.makeMittens(index);
		} else if (inventory.ItemId === "1") {
			sprite = this.makeItem(index, 100, 150, 10000, "fire");
		} else if (inventory.ItemId === "2") {
			sprite = this.makeItem(index, 100, 250, 1000, "snowman");
		} else if (inventory.ItemId === "3") {
			sprite = this.makeItem(index, 1000, 350, 1000, "igloo");
		} else if (inventory.ItemId === "4") {
			sprite = this.makeItem(index, 10000, 450, 1000, "vault");
		}
		sprite.setOrigin(0, 0).setScale(0.5);
	}

	makeMittens(index: number) {
		this.clickMultiplier += 100;
		return this.add.sprite(170 + index * 100, 50, "mittens");
	}

	makeItem(index: number, effect: number, y: number, delay: number, imageKey: string) {
		const snowballsToAdd = effect + this.resetBonus;
		const amountText = this.add
			.text(220 + index * 100, y, `+${snowballsToAdd / 100}`, textStyle)
			.setAlpha(0)
			.setAlign("center")
			.setOrigin(0.5, 0.5)
			.setDepth(clickAnimationDepth);
		this.time.addEvent({
			delay: delay,
			loop: true,
			callback: () => {
				amountText.setY(y);
				this.registry.values.SB += snowballsToAdd;
				this.totalAddedSnowballs += snowballsToAdd;
				this.showClickAnimation(amountText);
			},
		});
		return this.add.sprite(170 + index * 100, y, imageKey);
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
			{ Data: { [`${this.biomeDetail.ItemId}LastUpdated`]: new Date().valueOf().toString() } },
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
								snowballs: this.registry.values.SB,
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
