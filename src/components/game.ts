import { PlayFabClient } from "playfab-sdk";
import {
	darkBackgroundColor,
	darkRed,
	normalRed,
	lightRed,
	fontFamily,
	smallFontSize,
	textStyle,
	lightBackgroundColor,
	overlayDepth,
	popupDepth,
	clickAnimationDepth,
	closeButtonFill,
	lightBlue,
	normalBlue,
	darkBlue,
} from "../utils/constants";
import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";
import AScene from "./AScene";
import { BiomeDetail, ItemDetail } from "../utils/types";

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
				this.showToast(`${sb / 100} snowballs added \nwhile player was away`, false);
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

		this.snowballText = this.add.text(50, 16, `: ${this.registry.get("SB") / 100}`, textStyle);
		this.snowballIcon = this.add.image(16, 25, "snowball").setScale(0.15).setOrigin(0, 0.5);
		this.icicleText = this.add.text(44, 56, `: ${this.registry.get("IC")}`, textStyle);
		this.icicleIcon = this.add.image(16, 65, "icicle").setScale(0.15).setOrigin(0, 0.5);

		this.add
			.text(400, 16, this.biomeDetail.DisplayName.toUpperCase(), textStyle)
			.setAlign("center")
			.setOrigin(0.5, 0);

		const storeButtonUnderline = this.add.line(16, 464, 16, 464, 16, 464, 0xffffff).setAlpha(0);
		const storeButton = this.add
			.text(16, 464, "STORE", textStyle)
			.setOrigin(0, 1)
			.setInteractive({ useHandCursor: true })
			.on("pointerover", () => {
				storeButtonUnderline.setTo(0, 0, storeButton.width, 0).setPosition(16, 464).setAlpha(1);
			})
			.on("pointerout", () => {
				storeButtonUnderline.setAlpha(0);
			})
			.on("pointerup", () => {
				this.interactiveObjects.forEach(object => object.disableInteractive());
				this.showStoreContainer();
			});
		this.interactiveObjects.push(storeButton);

		const mapButtonUnderline = this.add.line(16, 504, 16, 504, 16, 504, 0xffffff).setAlpha(0);
		const mapButton = this.add
			.text(16, 504, "MAP", textStyle)
			.setOrigin(0, 1)
			.setInteractive({ useHandCursor: true })
			.on("pointerover", () => {
				mapButtonUnderline.setTo(0, 0, mapButton.width, 0).setPosition(16, 504).setAlpha(1);
			})
			.on("pointerout", () => {
				mapButtonUnderline.setAlpha(0);
			})
			.on("pointerup", () => {
				this.sync(() => {
					this.cameras.main.fadeOut(500, 0, 0, 0);
					this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, (cam, effect) => {
						this.scene.start("Map");
					});
				});
			});
		this.interactiveObjects.push(mapButton);

		const menuButtonUnderline = this.add.line(16, 544, 16, 544, 16, 544, 0xffffff).setAlpha(0);
		const menuButton = this.add
			.text(16, 544, "MENU", textStyle)
			.setOrigin(0, 1)
			.setInteractive({ useHandCursor: true })
			.on("pointerover", () => {
				menuButtonUnderline.setTo(0, 0, menuButton.width, 0).setPosition(16, 544).setAlpha(1);
			})
			.on("pointerout", () => {
				menuButtonUnderline.setAlpha(0);
			})
			.on("pointerup", () => {
				this.sync(() => {
					this.cameras.main.fadeOut(500, 0, 0, 0);
					this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, (cam, effect) => {
						this.scene.start("Menu");
					});
				});
			});
		this.interactiveObjects.push(menuButton);

		const iapButtonUnderline = this.add.line(16, 584, 16, 584, 16, 584, 0xffffff).setAlpha(0);
		const iapButton = this.add
			.text(16, 584, "IN-APP PURCHASE EXAMPLE", textStyle)
			.setOrigin(0, 1)
			.setInteractive({ useHandCursor: true })
			.on("pointerover", () => {
				iapButtonUnderline.setTo(0, 0, iapButton.width, 0).setPosition(16, 584).setAlpha(1);
			})
			.on("pointerout", () => {
				iapButtonUnderline.setAlpha(0);
			})
			.on("pointerup", () => {
				this.interactiveObjects.forEach(object => object.disableInteractive());
				this.showCurrencyContainer();
			});
		this.interactiveObjects.push(iapButton);
	}

	updateData(parent, key, data) {
		if (this.scene.isActive()) {
			key === "SB" ? this.snowballText.setText(`: ${data / 100}`) : this.icicleText.setText(`: ${data}`);
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
		const closeButton = this.add
			.existing(new RoundRectangle(this, 175, -215, 35, 35, 5, closeButtonFill).setStrokeStyle(6, lightBlue, 1))
			.setInteractive({ useHandCursor: true })
			.on("pointerover", () => {
				closeButton.setStrokeStyle(6, normalBlue, 1);
			})
			.on("pointerout", () => {
				closeButton.setStrokeStyle(6, lightBlue, 1);
			})
			.on("pointerdown", () => {
				closeButton.setStrokeStyle(6, darkBlue, 1);
			})
			.on("pointerup", () => {
				closeButton.setStrokeStyle(6, lightBlue, 1);
				this.add.tween({
					targets: [this.storeContainer],
					ease: "Sine.easeIn",
					duration: 100,
					alpha: 0,
					onComplete: () => {
						this.interactiveObjects.forEach(object => object.setInteractive({ useHandCursor: true }));
						const itemList = this.storeContainer.getAt(3) as Phaser.GameObjects.Container;
						itemList.removeAll(true);
						this.storeItems = [];
					},
					callbackScope: this,
				});
			});
		const line1 = this.add.line(0, 0, 175, -197.5, 192, -214.5, darkBlue).setLineWidth(3, 3);
		const line2 = this.add.line(0, 0, 175, -214.5, 192, -197.5, darkBlue).setLineWidth(3, 3);
		this.storeContainer.add([closeButton, line1, line2]);
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
				}
			});
		this.interactiveObjects.push(sprite);
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
			.text(118, y, `${maybeItemDiscountPrice / 100} x`, textStyle)
			.setAlign("right")
			.setOrigin(1, 0.5);
		const w = priceText.width + 50;
		const x = 160 - w / 2;
		const highlight = this.add
			.existing(new RoundRectangle(this, x, y, w, priceText.height + 16, 10, 0xffffff))
			.setAlpha(0);
		const priceButton = this.add
			.existing(new RoundRectangle(this, x, y, w, priceText.height + 16, 10, lightRed))
			.setInteractive({ useHandCursor: true })
			.on("pointerover", () => {
				priceButton.setFillStyle(normalRed, 1);
			})
			.on("pointerout", () => {
				priceButton.setFillStyle(lightRed, 1);
			})
			.on("pointerdown", () => {
				priceButton.setFillStyle(darkRed, 1);
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
					this.setItemLoading(
						true,
						maybeItemDiscountPrice / 100,
						priceButton,
						priceText,
						snowballIcon,
						highlight,
						x
					);
					this.sync(() =>
						this.purchaseItem(itemDetail, maybeItemDiscountPrice, storeId, () =>
							this.setItemLoading(
								false,
								maybeItemDiscountPrice / 100,
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
				.text(121, -192 + index * 85, `${storeItem.CustomData.FullPrice / 100} x`, {
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

	setItemLoading(
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
			button.setFillStyle(darkRed, 1).disableInteractive().removeListener("pointerout");
			icon.setAlpha(0);
		} else {
			text.setText(`${price} x`)
				.setX(118)
				.setAlign("right")
				.setOrigin(1, 0.5)
				.setStyle({ ...textStyle, strokeThickness: 0 });
			button
				.setFillStyle(lightRed, 1)
				.setInteractive({ useHandCursor: true })
				.on("pointerout", () => {
					button.setFillStyle(lightRed, 1);
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
							FunctionName: "updateInventoryCustomData",
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
	}

	makeMittens(index: number) {
		this.clickMultiplier += 100;
		return this.add.sprite(170 + index * 100, 50, "mittens");
	}

	makeFire(index: number) {
		const snowballsToAdd = 100 + this.resetBonus;
		const amountText = this.add
			.text(220 + index * 100, 150, `+${snowballsToAdd / 100}`, textStyle)
			.setAlpha(0)
			.setAlign("center")
			.setOrigin(0.5, 0.5)
			.setDepth(clickAnimationDepth);
		this.time.addEvent({
			delay: 10000,
			loop: true,
			callback: () => {
				amountText.setY(150);
				this.registry.values.SB += snowballsToAdd;
				this.totalAddedSnowballs += snowballsToAdd;
				this.showClickAnimation(amountText);
			},
		});
		return this.add.sprite(170 + index * 100, 150, "fire");
	}

	makeSnowman(index: number) {
		const snowballsToAdd = 100 + this.resetBonus;
		const amountText = this.add
			.text(220 + index * 100, 250, `+${snowballsToAdd / 100}`, textStyle)
			.setAlpha(0)
			.setAlign("center")
			.setOrigin(0.5, 0.5)
			.setDepth(clickAnimationDepth);
		this.time.addEvent({
			delay: 1000,
			loop: true,
			callback: () => {
				amountText.setY(250);
				this.registry.values.SB += snowballsToAdd;
				this.totalAddedSnowballs += snowballsToAdd;
				this.showClickAnimation(amountText);
			},
		});
		return this.add.sprite(170 + index * 100, 250, "snowman");
	}

	makeIgloo(index: number) {
		const snowballsToAdd = 1000 + this.resetBonus;
		const amountText = this.add
			.text(220 + index * 100, 350, `+${snowballsToAdd / 100}`, textStyle)
			.setAlpha(0)
			.setAlign("center")
			.setOrigin(0.5, 0.5)
			.setDepth(clickAnimationDepth);
		this.time.addEvent({
			delay: 1000,
			loop: true,
			callback: () => {
				amountText.setY(350);
				this.registry.values.SB += snowballsToAdd;
				this.totalAddedSnowballs += snowballsToAdd;
				this.showClickAnimation(amountText);
			},
		});
		return this.add.sprite(170 + index * 100, 350, "igloo");
	}

	makeVault(index: number) {
		const snowballsToAdd = 10000 + this.resetBonus;
		const amountText = this.add
			.text(220 + index * 100, 450, `+${snowballsToAdd / 100}`, textStyle)
			.setAlpha(0)
			.setAlign("center")
			.setOrigin(0.5, 0.5)
			.setDepth(clickAnimationDepth);
		this.time.addEvent({
			delay: 1000,
			loop: true,
			callback: () => {
				amountText.setY(450);
				this.registry.values.SB += snowballsToAdd;
				this.totalAddedSnowballs += snowballsToAdd;
				this.showClickAnimation(amountText);
			},
		});
		return this.add.sprite(170 + index * 100, 450, "vault");
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
