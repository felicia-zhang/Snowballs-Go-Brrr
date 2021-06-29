import { PlayFabClient } from "playfab-sdk";
import {
	darkBackgroundColor,
	buttonClick,
	buttonHover,
	buttonNormal,
	fontFamily,
	smallFontSize,
	textStyle,
	lightBackgroundColor,
} from "../utils/constants";
import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";
import AScene from "./AScene";
import { BiomeDetail, ItemDetail } from "../utils/types";

class GameScene extends AScene {
	readonly syncDelay = 60000;
	biomeDetail: BiomeDetail;
	clickMultiplier: number;
	totalAddedSnowballs: number;
	totalManualPenguinClicks: number;
	syncTimer: Phaser.Time.TimerEvent;
	currencyItems: PlayFabClientModels.StoreItem[];
	storeItems: PlayFabClientModels.StoreItem[];
	itemsMap: { [key: number]: ItemDetail };
	snowballText: Phaser.GameObjects.Text;
	snowballIcon: Phaser.GameObjects.Image;
	icicleText: Phaser.GameObjects.Text;
	icicleIcon: Phaser.GameObjects.Image;
	currencyContainer: Phaser.GameObjects.Container;
	storeContainer: Phaser.GameObjects.Container;
	inventoryContainer: Phaser.GameObjects.Container;
	interactiveGameObjects: Phaser.GameObjects.GameObject[];

	constructor() {
		super("Game");
	}

	create({ biomeDetail }) {
		this.cameras.main.fadeIn(1000, 0, 0, 0);
		this.add.image(400, 300, "sky");
		this.biomeDetail = biomeDetail;
		this.clickMultiplier = 1;
		this.totalAddedSnowballs = 0;
		this.totalManualPenguinClicks = 0;
		this.currencyItems = [];
		this.storeItems = [];
		this.itemsMap = {};
		this.inventoryContainer = this.add.container(170, 5, []);
		this.interactiveGameObjects = [];
		this.makePenguin();
		this.makeStoreContainer();
		this.makeCurrencyContainer();

		this.registry
			.get("CatalogItems")
			.filter((item: PlayFabClientModels.CatalogItem) => item.ItemClass !== "biome")
			.forEach((item: PlayFabClientModels.CatalogItem, i) => {
				this.itemsMap[item.ItemId] = {
					ItemId: item.ItemId,
					DisplayName: item.DisplayName,
					Description: item.Description,
					Instances: {},
				} as ItemDetail;
			});

		this.registry
			.get("Inventories")
			.filter(
				(inventory: PlayFabClientModels.ItemInstance) =>
					inventory.CustomData !== undefined && inventory.CustomData.BiomeId === this.biomeDetail.ItemId
			)
			.forEach(inventory => this.makeInventoryItem(inventory));

		PlayFabClient.GetUserData({ Keys: [this.biomeDetail.ItemId] }, (error, result) => {
			if (result.data.Data[this.biomeDetail.ItemId] !== undefined) {
				const lastUpdated = result.data.Data[this.biomeDetail.ItemId].Value;
				const elapsed = new Date().valueOf() - Number(lastUpdated);
				const elapsedSeconds = elapsed / 1000;
				console.log("Elapsed seconds:", elapsedSeconds);
				const numberOfFires = Object.keys(this.itemsMap[1].Instances).length;
				const numberOfSnowmans = Object.keys(this.itemsMap[2].Instances).length;
				const numberOfIgloos = Object.keys(this.itemsMap[3].Instances).length;
				const numberOfVaults = Object.keys(this.itemsMap[4].Instances).length;
				const sb =
					Math.floor(elapsedSeconds / 10) * numberOfFires +
					Math.floor(elapsedSeconds) * numberOfSnowmans +
					Math.floor(elapsedSeconds) * numberOfIgloos * 10 +
					Math.floor(elapsedSeconds) * numberOfVaults * 100;

				this.registry.values.SB += sb;
				this.totalAddedSnowballs += sb;
				this.showToast(`${sb} snowballs added \nwhile player was away`, false);
			} else {
				this.showToast(`Welcome to ${this.biomeDetail.DisplayName}`, false);
			}
		});

		this.registry.events.on("changedata", this.updateData, this);

		this.syncTimer = this.time.addEvent({
			delay: this.syncDelay,
			loop: true,
			callback: () => this.sync(() => this.showToast("Saved", false)),
		});

		this.snowballText = this.add.text(50, 16, `: ${this.registry.get("SB")}`, textStyle);
		this.snowballIcon = this.add.image(16, 25, "snowball").setScale(0.15).setOrigin(0, 0.5);
		this.icicleText = this.add.text(44, 56, `: ${this.registry.get("IC")}`, textStyle);
		this.icicleIcon = this.add.image(16, 65, "icicle").setScale(0.15).setOrigin(0, 0.5);

		this.add.text(400, 16, this.biomeDetail.DisplayName, textStyle).setAlign("center").setOrigin(0.5, 0.5);

		this.interactiveGameObjects.push(
			this.add
				.text(16, 584, "MENU", textStyle)
				.setOrigin(0, 1)
				.setInteractive({ useHandCursor: true })
				.on("pointerup", () => {
					this.sync(() => {
						this.cameras.main.fadeOut(500, 0, 0, 0);
						this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, (cam, effect) => {
							this.scene.start("Menu");
						});
					});
				})
		);

		this.interactiveGameObjects.push(
			this.add
				.text(16, 544, "MAP", textStyle)
				.setOrigin(0, 1)
				.setInteractive({ useHandCursor: true })
				.on("pointerup", () => {
					this.sync(() => {
						this.cameras.main.fadeOut(500, 0, 0, 0);
						this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, (cam, effect) => {
							this.scene.start("Map");
						});
					});
				})
		);

		this.interactiveGameObjects.push(
			this.add
				.text(784, 544, "IN-APP PURCHASE EXAMPLE", textStyle)
				.setOrigin(1, 1)
				.setInteractive({ useHandCursor: true })
				.on("pointerup", () => {
					this.interactiveGameObjects.forEach(object => object.disableInteractive());
					this.showCurrencyContainer();
				})
		);

		this.interactiveGameObjects.push(
			this.add
				.text(784, 584, "STORE", textStyle)
				.setOrigin(1, 1)
				.setInteractive({ useHandCursor: true })
				.on("pointerup", () => {
					this.interactiveGameObjects.forEach(object => object.disableInteractive());
					this.showStoreContainer();
				})
		);
	}

	updateData(parent, key, data) {
		if (this.scene.isActive()) {
			key === "SB" ? this.snowballText.setText(`: ${data}`) : this.icicleText.setText(`: ${data}`);
		}
	}

	update() {
		if (!this.registry.has("FinishedSignIn")) {
			this.scene.start("Signin");
		}
	}

	makeCurrencyContainer() {
		const overlay = this.add.rectangle(0, 0, 800, 600, 0x000000).setDepth(19).setAlpha(0.6);
		const mainBackground = this.add.existing(new RoundRectangle(this, 0, 0, 665, 255, 15, darkBackgroundColor));
		const currencyList = this.add.container(0, 0, []);
		const text = this.add
			.text(
				0,
				160,
				"*This is a mock of the payment process. \nNo real transaction will take place in the PlayFab backend.",
				textStyle
			)
			.setAlign("center")
			.setOrigin(0.5, 0.5);
		this.currencyContainer = this.add
			.container(400, 300, [overlay, mainBackground, currencyList, text])
			.setAlpha(0)
			.setDepth(20);
		const closeButton = this.add
			.image(320, -115, "close")
			.setScale(0.35)
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => {
				this.add.tween({
					targets: [this.currencyContainer],
					ease: "Sine.easeIn",
					duration: 100,
					alpha: 0,
					onComplete: () => {
						this.interactiveGameObjects.forEach(object => object.setInteractive({ useHandCursor: true }));
						const currencyList = this.currencyContainer.getAt(2) as Phaser.GameObjects.Container;
						currencyList.removeAll(true);
						this.currencyItems = [];
					},
					callbackScope: this,
				});
			});
		this.currencyContainer.add(closeButton);
	}

	showCurrencyContainer() {
		PlayFabClient.GetStoreItems({ StoreId: "CurrenciesWithDiscount" }, (error, result) => {
			result.data.Store.forEach((storeItem: PlayFabClientModels.StoreItem) => {
				this.makeCurrency(storeItem);
			});
			const overlay = this.currencyContainer.getAt(0) as Phaser.GameObjects.Rectangle;
			const bg = this.currencyContainer.getAt(1) as RoundRectangle;
			const closeButton = this.currencyContainer.getAt(4) as Phaser.GameObjects.Image;
			if (result.data.StoreId === "CurrenciesWithDiscount") {
				overlay.setY(-25);
				bg.height = 305;
				bg.y = -25;
				closeButton.setY(-165);
				this.currencyContainer.setY(325);
				const discountText = this.add
					.text(
						0,
						-145,
						"ONE TIME OFFER!!\nReceive 10% off ALL in-game items after your first icicle purchase!",
						textStyle
					)
					.setAlign("center")
					.setOrigin(0.5, 0.5);
				const currencyList = this.currencyContainer.getAt(2) as Phaser.GameObjects.Container;
				currencyList.add(discountText);
			} else {
				overlay.setY(0);
				bg.height = 255;
				bg.y = 0;
				closeButton.setY(-115);
				this.currencyContainer.setY(300);
			}
		});
		this.add.tween({
			targets: [this.currencyContainer],
			ease: "Sine.easeIn",
			duration: 500,
			alpha: 1,
			callbackScope: this,
		});
	}

	makeStoreContainer() {
		const overlay = this.add.rectangle(0, 0, 800, 600, 0x000000).setDepth(19).setAlpha(0.6);
		const mainBackground = this.add.existing(new RoundRectangle(this, 0, 0, 380, 450, 15, darkBackgroundColor));
		const itemDescriptionPopup = this.add.text(200, -60, "", textStyle).setAlpha(0);
		const itemList = this.add.container(0, 0, []);
		this.storeContainer = this.add
			.container(400, 300, [overlay, mainBackground, itemDescriptionPopup, itemList])
			.setAlpha(0)
			.setDepth(20);
		const closeButton = this.add
			.image(175, -215, "close")
			.setScale(0.35)
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => {
				this.add.tween({
					targets: [this.storeContainer],
					ease: "Sine.easeIn",
					duration: 100,
					alpha: 0,
					onComplete: () => {
						this.interactiveGameObjects.forEach(object => object.setInteractive({ useHandCursor: true }));
						const itemList = this.storeContainer.getAt(3) as Phaser.GameObjects.Container;
						itemList.removeAll(true);
						this.storeItems = [];
					},
					callbackScope: this,
				});
			});
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
				if (pointer.leftButtonReleased()) {
					const currentClickMultiplier = this.clickMultiplier;
					this.totalManualPenguinClicks += 1;
					this.totalAddedSnowballs += currentClickMultiplier;
					this.registry.values.SB += currentClickMultiplier;
					const amountText = this.add
						.text(pointer.x, pointer.y, currentClickMultiplier.toString(), textStyle)
						.setAlpha(0)
						.setAlign("center")
						.setOrigin(0.5, 0.5)
						.setDepth(10);
					this.showClickAnimation(amountText);
					if (!sprite.anims.isPlaying) {
						sprite.anims.play("squish");
					}
				}
			});
		this.interactiveGameObjects.push(sprite);
		return sprite;
	}

	makeStoreItem(storeItem: PlayFabClientModels.StoreItem, storeId: string) {
		const itemDescriptionPopup = this.storeContainer.getAt(2) as Phaser.GameObjects.Text;
		const itemDetail: ItemDetail = this.itemsMap[storeItem.ItemId];
		const maybeItemDiscountPrice = storeItem.VirtualCurrencyPrices.SB;
		const wrap = (s: string) => s.replace(/(?![^\n]{1,22}$)([^\n]{1,22})\s/g, "$1\n");

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
						itemDescriptionPopup.setText(wrap(itemDetail.Description));
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
		const priceText = this.add
			.text(118, y, `${maybeItemDiscountPrice} x`, textStyle)
			.setAlign("right")
			.setOrigin(1, 0.5);
		const w = priceText.width + 50;
		const x = 160 - w / 2;
		const highlight = this.add
			.existing(new RoundRectangle(this, x, y, w, priceText.height + 16, 10, 0xffffff))
			.setAlpha(0);
		const priceButton = this.add
			.existing(new RoundRectangle(this, x, y, w, priceText.height + 16, 10, buttonNormal))
			.setInteractive({ useHandCursor: true })
			.on("pointerover", () => {
				priceButton.setFillStyle(buttonHover, 1);
			})
			.on("pointerout", () => {
				priceButton.setFillStyle(buttonNormal, 1);
			})
			.on("pointerdown", () => {
				priceButton.setFillStyle(buttonClick, 1);
				this.add.tween({
					targets: [highlight],
					ease: "Sine.easeIn",
					props: {
						width: {
							value: priceText.width + 55,
							duration: 150,
							ease: "Sine.easeIn",
						},
						height: {
							value: priceText.height + 21,
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
			})
			.on("pointerup", (pointer: Phaser.Input.Pointer) => {
				if (Object.keys(itemDetail.Instances).length === 6) {
					this.showToast("Not enough room", true);
				} else {
					this.toggleLoading(
						true,
						maybeItemDiscountPrice,
						priceButton,
						priceText,
						snowballIcon,
						highlight,
						x
					);
					this.sync(() =>
						this.purchaseItem(itemDetail, maybeItemDiscountPrice, storeId, () =>
							this.toggleLoading(
								false,
								maybeItemDiscountPrice,
								priceButton,
								priceText,
								snowballIcon,
								highlight,
								x
							)
						)
					);
				}
				this.add.tween({
					targets: [highlight],
					ease: "Sine.easeIn",
					duration: 300,
					alpha: 0,
					delay: 300,
					callbackScope: this,
				});
			});
		const snowballIcon = this.add.image(138, y, "snowball").setScale(0.15);
		const itemList = this.storeContainer.getAt(3) as Phaser.GameObjects.Container;
		itemList.add([background, image, nameText, highlight, priceButton, priceText, snowballIcon]);

		if (storeId === `${this.biomeDetail.ItemId}WithDiscount`) {
			const newY = -160 + index * 85;
			highlight.y = newY;
			priceText.setY(newY);
			priceButton.y = newY;
			snowballIcon.setY(newY);

			const fullPriceText = this.add
				.text(121, -192 + index * 85, `${storeItem.CustomData.FullPrice} x`, {
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

	makeCurrency(storeItem: PlayFabClientModels.StoreItem) {
		const itemDetail: ItemDetail = this.itemsMap[storeItem.ItemId];
		const usd = storeItem.VirtualCurrencyPrices.RM;

		const index = this.currencyItems.length;
		this.currencyItems.push(storeItem);
		const background = this.add.existing(
			new RoundRectangle(this, 160 * index - 240, 0, 140, 220, 15, lightBackgroundColor)
		);

		let imageKey: string;
		if (storeItem.ItemId === "100") {
			imageKey = "icicle1";
		} else if (storeItem.ItemId === "101") {
			imageKey = "icicle2";
		} else if (storeItem.ItemId === "102") {
			imageKey = "icicle3";
		} else if (storeItem.ItemId === "103") {
			imageKey = "icicle4";
		}
		const image = this.add.image(160 * index - 240, -10, imageKey).setScale(0.7);
		const nameText = this.add
			.text(160 * index - 240, -90, itemDetail.DisplayName.toUpperCase(), textStyle)
			.setAlign("center")
			.setOrigin(0.5, 0.5);
		const usdText = this.add
			.text(160 * index - 240, 80, `$${usd}`, textStyle)
			.setAlign("center")
			.setOrigin(0.5, 0.5);
		const highlight = this.add
			.existing(
				new RoundRectangle(this, 160 * index - 240, 80, usdText.width + 16, usdText.height + 16, 10, 0xffffff)
			)
			.setAlpha(0);
		const usdButton = this.add
			.existing(
				new RoundRectangle(
					this,
					160 * index - 240,
					80,
					usdText.width + 16,
					usdText.height + 16,
					10,
					buttonNormal
				)
			)
			.setInteractive({ useHandCursor: true })
			.on("pointerover", () => {
				usdButton.setFillStyle(buttonHover, 1);
			})
			.on("pointerout", () => {
				usdButton.setFillStyle(buttonNormal, 1);
			})
			.on("pointerdown", () => {
				usdButton.setFillStyle(buttonClick, 1);
				this.add.tween({
					targets: [highlight],
					ease: "Sine.easeIn",
					props: {
						width: {
							value: usdText.width + 21,
							duration: 150,
							ease: "Sine.easeIn",
						},
						height: {
							value: usdText.height + 21,
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
			})
			.on("pointerup", (pointer: Phaser.Input.Pointer) => {
				PlayFabClient.ExecuteCloudScript(
					{
						FunctionName: "grantIcicleBundle",
						FunctionParameter: { itemId: itemDetail.ItemId, usd: usd },
					},
					(error, result) => {
						PlayFabClient.UnlockContainerItem({ ContainerItemId: itemDetail.ItemId }, (e, r) => {
							this.registry.values.IC += r.data.VirtualCurrency.IC;
							this.showToast(`${itemDetail.DisplayName} successfully purchased`, false);
						});
					}
				);
				usdButton.setFillStyle(buttonNormal, 1);
				this.add.tween({
					targets: [highlight],
					ease: "Sine.easeIn",
					duration: 300,
					alpha: 0,
					delay: 300,
					callbackScope: this,
				});
			});
		const currencyList = this.currencyContainer.getAt(2) as Phaser.GameObjects.Container;
		currencyList.add([background, image, nameText, highlight, usdButton, usdText]);
	}

	toggleLoading(
		isLoading: boolean,
		price: number,
		button: RoundRectangle,
		text: Phaser.GameObjects.Text,
		icon: Phaser.GameObjects.Image,
		highlight: RoundRectangle,
		x: number
	) {
		if (isLoading) {
			text.setText(". . .")
				.setX(x)
				.setAlign("center")
				.setOrigin(0.5, 0.725)
				.setStyle({ fontFamily: fontFamily, fontSize: "32px", stroke: "#ffffff", strokeThickness: 3 });
			button.setFillStyle(buttonClick, 1).disableInteractive().removeListener("pointerout");
			icon.setAlpha(0);
		} else {
			text.setText(`${price} x`)
				.setX(118)
				.setAlign("right")
				.setOrigin(1, 0.5)
				.setStyle({ ...textStyle, strokeThickness: 0 });
			button
				.setFillStyle(buttonNormal, 1)
				.setInteractive({ useHandCursor: true })
				.on("pointerout", () => {
					button.setFillStyle(buttonNormal, 1);
				});
			highlight.setAlpha(0);
			icon.setAlpha(1);
		}
	}

	purchaseItem(itemDetail: ItemDetail, maybeItemDiscountPrice: number, storeId: string, toggleLoadingToFalse) {
		const delay = this.time.addEvent({ delay: 500 });
		PlayFabClient.PurchaseItem(
			{ ItemId: itemDetail.ItemId, Price: maybeItemDiscountPrice, StoreId: storeId, VirtualCurrency: "SB" },
			(e, r) => {
				if (e !== null) {
					const remaining = delay.getRemaining();
					if (remaining > 0) {
						this.time.addEvent({
							delay: remaining,
							callback: () => {
								toggleLoadingToFalse();
								this.showToast("Not enough snowballs", true);
							},
						});
					} else {
						toggleLoadingToFalse();
						this.showToast("Not enough snowballs", true);
					}
				} else {
					PlayFabClient.ExecuteCloudScript(
						{
							FunctionName: "updateCustomData",
							FunctionParameter: {
								instanceId: r.data.Items[0].ItemInstanceId,
								biomeId: this.biomeDetail.ItemId,
							},
						},
						(error, result) => {
							const remaining = delay.getRemaining();
							if (remaining > 0) {
								this.time.addEvent({
									delay: remaining,
									callback: () => {
										toggleLoadingToFalse();
										this.registry.values.SB -= maybeItemDiscountPrice;
										this.registry.values.Inventories.push(result.data.FunctionResult); // mutating the array will not fire registry changedata event
										this.makeInventoryItem(result.data.FunctionResult);
										this.showToast(`1 ${itemDetail.DisplayName} successfully purchased`, false);
									},
								});
							} else {
								toggleLoadingToFalse();
								this.registry.values.SB -= maybeItemDiscountPrice;
								this.registry.values.Inventories.push(result.data.FunctionResult);
								this.makeInventoryItem(result.data.FunctionResult);
								this.showToast(`1 ${itemDetail.DisplayName} successfully purchased`, false);
							}
						}
					);
				}
			}
		);
	}

	makeInventoryItem(inventory: PlayFabClientModels.ItemInstance) {
		const itemType = this.itemsMap[inventory.ItemId];
		const index = Object.keys(itemType.Instances).length;
		itemType.Instances[inventory.ItemInstanceId] = inventory;
		let sprite: Phaser.GameObjects.Sprite;
		if (inventory.ItemId === "0") {
			sprite = this.makeMittens(index);
		} else if (inventory.ItemId === "1") {
			sprite = this.makeFire(index);
		} else if (inventory.ItemId === "2") {
			sprite = this.makeSnowman(index);
		} else if (inventory.ItemId === "3") {
			sprite = this.makeIgloo(index);
		} else if (inventory.ItemId === "4") {
			sprite = this.makeVault(index);
		}
		sprite.setOrigin(0, 0).setScale(0.5);
		this.inventoryContainer.add(sprite);
	}

	makeMittens(index: number) {
		this.clickMultiplier += 1;
		return this.add.sprite(index * 100, 50, "mittens");
	}

	makeFire(index: number) {
		const amountText = this.add
			.text(50 + index * 100, 150, "+1", textStyle)
			.setAlpha(0)
			.setAlign("center")
			.setOrigin(0.5, 0.5)
			.setDepth(10);
		this.inventoryContainer.add(amountText);
		this.time.addEvent({
			delay: 10000,
			loop: true,
			callback: () => {
				amountText.setY(150);
				this.registry.values.SB += 1;
				this.totalAddedSnowballs += 1;
				this.showClickAnimation(amountText);
			},
		});
		return this.add.sprite(index * 100, 150, "fire");
	}

	makeSnowman(index: number) {
		const amountText = this.add
			.text(50 + index * 100, 250, "+1", textStyle)
			.setAlpha(0)
			.setAlign("center")
			.setOrigin(0.5, 0.5)
			.setDepth(10);
		this.inventoryContainer.add(amountText);
		this.time.addEvent({
			delay: 1000,
			loop: true,
			callback: () => {
				amountText.setY(250);
				this.registry.values.SB += 1;
				this.totalAddedSnowballs += 1;
				this.showClickAnimation(amountText);
			},
		});
		return this.add.sprite(index * 100, 250, "snowman");
	}

	makeIgloo(index: number) {
		const amountText = this.add
			.text(50 + index * 100, 350, "+10", textStyle)
			.setAlpha(0)
			.setAlign("center")
			.setOrigin(0.5, 0.5)
			.setDepth(10);
		this.inventoryContainer.add(amountText);
		this.time.addEvent({
			delay: 1000,
			loop: true,
			callback: () => {
				amountText.setY(350);
				this.registry.values.SB += 10;
				this.totalAddedSnowballs += 10;
				this.showClickAnimation(amountText);
			},
		});
		return this.add.sprite(index * 100, 350, "igloo");
	}

	makeVault(index: number) {
		const amountText = this.add
			.text(50 + index * 100, 450, "+100", textStyle)
			.setAlpha(0)
			.setAlign("center")
			.setOrigin(0.5, 0.5)
			.setDepth(10);
		this.inventoryContainer.add(amountText);
		this.time.addEvent({
			delay: 1000,
			loop: true,
			callback: () => {
				amountText.setY(450);
				this.registry.values.SB += 100;
				this.totalAddedSnowballs += 100;
				this.showClickAnimation(amountText);
			},
		});
		return this.add.sprite(index * 100, 450, "vault");
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

	sync(func: () => any) {
		PlayFabClient.UpdateUserData(
			{ Data: { [this.biomeDetail.ItemId]: new Date().valueOf().toString() } },
			() => {}
		);

		const totalAdded = this.totalAddedSnowballs;
		const totalClicks = this.totalManualPenguinClicks;
		if (totalAdded === 0) {
			console.log("No change to snowballs since last sync");
			if (func !== undefined) {
				func();
			}
		} else {
			PlayFabClient.ExecuteCloudScript(
				{
					FunctionName: "addUserVirtualCurrency",
					FunctionParameter: { amount: totalAdded, virtualCurrency: "SB" },
				},
				(error, result) => {
					console.log("Amount of snowballs added:", totalAdded);
					this.totalAddedSnowballs -= totalAdded;
					this.totalManualPenguinClicks -= totalClicks;
					PlayFabClient.ExecuteCloudScript(
						{
							FunctionName: "updateStatistics",
							FunctionParameter: {
								current_snowballs: this.registry.values.SB,
								total_added_snowballs: totalAdded,
								total_manual_penguin_clicks: totalClicks,
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
