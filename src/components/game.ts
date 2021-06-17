import { PlayFabClient } from "playfab-sdk";
import { fontFamily } from "../utils/font";
import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";

interface ItemDetail {
	ItemId: string;
	DisplayName: string;
	Description: string;
	Levels: { [key: string]: { Cost: string; Effect: string } };
	Instances: { [key: string]: PlayFabClientModels.ItemInstance };
}

class GameScene extends Phaser.Scene {
	readonly syncDelay = 60000;
	clickMultiplier: number;
	totalSnowballs: number;
	totalAddedSnowballs: number;
	totalManualPenguinClicks: number;
	syncTimer: Phaser.Time.TimerEvent;
	storeItems: PlayFabClientModels.StoreItem[];
	itemsMap: { [key: number]: ItemDetail };
	snowballText: Phaser.GameObjects.Text;
	popup: Phaser.GameObjects.Container;
	toast: Phaser.GameObjects.Container;
	storeContainer: Phaser.GameObjects.Container;
	inventoryContainer: Phaser.GameObjects.Container;
	storeButton: Phaser.GameObjects.Text;
	overlay: Phaser.GameObjects.Rectangle;

	constructor() {
		super("Game");
	}

	create() {
		this.add.image(400, 300, "sky");
		this.clickMultiplier = 1;
		this.totalAddedSnowballs = 0;
		this.totalManualPenguinClicks = 0;
		this.storeItems = [];
		this.itemsMap = {};
		this.makeToast();
		this.makePopup();
		this.storeContainer = this.add.container(400, 300, []).setAlpha(0).setDepth(20);
		this.inventoryContainer = this.add.container(140, 0, []);
		this.overlay = this.add.rectangle(0, 0, 800, 600, 0x000000).setOrigin(0, 0).setDepth(19).setAlpha(0);
		this.makeSnowball();

		const scene = this;
		PlayFabClient.GetCatalogItems({ CatalogVersion: "1" }, (error, result) => {
			result.data.Catalog.forEach((item: PlayFabClientModels.CatalogItem, i) => {
				this.itemsMap[item.ItemId] = {
					ItemId: item.ItemId,
					DisplayName: item.DisplayName,
					Description: item.Description,
					Levels: JSON.parse(item.CustomData)["Levels"],
					Instances: {},
				};
			});

			PlayFabClient.GetUserInventory({}, (error, result) => {
				const inventories: PlayFabClientModels.ItemInstance[] = result.data.Inventory;
				const sb = result.data.VirtualCurrency.SB;
				scene.totalSnowballs = sb;
				inventories.forEach(inventory => this.makeInventoryItem(inventory));

				PlayFabClient.GetUserData({ Keys: ["auto"] }, (error, result) => {
					if (result.data.Data["auto"] !== undefined) {
						const lastUpdated = result.data.Data["auto"].Value;
						const elapsed = new Date().valueOf() - Number(lastUpdated);
						const elapsedSeconds = elapsed / 1000;
						console.log("Elapsed seconds:", elapsedSeconds);
						this.calculateAwaySnowballs(elapsedSeconds);
					}
				});
			});
		});

		this.syncTimer = this.time.addEvent({
			delay: this.syncDelay,
			loop: true,
			callback: () => this.sync(() => this.showToast("Saved", false)),
		});

		this.snowballText = this.add.text(16, 16, `Snowballs: ${this.totalSnowballs}`, { fontFamily: fontFamily });

		this.add
			.text(16, 550, "MENU", { fontFamily: fontFamily })
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => {
				this.scene.start("Menu");
			});

		this.storeButton = this.add
			.text(700, 550, "STORE", { fontFamily: fontFamily })
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => {
				this.add.tween({
					targets: [this.overlay],
					ease: "Sine.easeIn",
					duration: 800,
					alpha: 0.6,
					callbackScope: this,
				});
				this.sync(() => this.showStore());
			});
	}

	calculateAwaySnowballs(elapsedSeconds: number) {
		const numberOfFires = Object.keys(this.itemsMap[1].Instances).length;
		const numberOfSnowmans = Object.keys(this.itemsMap[2].Instances).length;
		const numberOfIgloos = Object.keys(this.itemsMap[3].Instances).length;
		const numberOfVaults = Object.keys(this.itemsMap[4].Instances).length;
		const sb =
			Math.floor(elapsedSeconds / 10) * numberOfFires +
			Math.floor(elapsedSeconds) * numberOfSnowmans +
			Math.floor(elapsedSeconds) * numberOfIgloos * 10 +
			Math.floor(elapsedSeconds) * numberOfVaults * 100;

		this.totalSnowballs += sb;
		this.totalAddedSnowballs += sb;
		this.showToast(`${sb} snowballs added \nwhile player was away`, false);
	}

	showStore() {
		this.storeButton.disableInteractive();
		const background = this.add.existing(new RoundRectangle(this, 0, 0, 370, 510, 15, 0x1a252e));
		const close = this.add
			.image(170, -250, "close")
			.setScale(0.3)
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => {
				this.add.tween({
					targets: [this.storeContainer, this.overlay],
					ease: "Sine.easeIn",
					duration: 100,
					alpha: 0,
					onComplete: () => {
						this.storeButton.setInteractive({ useHandCursor: true });
						this.time.paused = false;
						this.storeContainer.removeAll(true);
						this.storeItems = [];
					},
					callbackScope: this,
				});
			});
		this.storeContainer.add([background, close]);
		PlayFabClient.GetStoreItems({ StoreId: "Main" }, (error, result) => {
			result.data.Store.forEach((storeItem: PlayFabClientModels.StoreItem) => {
				this.makeStoreItem(storeItem);
			});
			this.add.tween({
				targets: [this.storeContainer],
				ease: "Sine.easeIn",
				duration: 300,
				alpha: 1,
				onComplete: () => {
					this.time.paused = true;
				},
				callbackScope: this,
			});
		});
	}

	update() {
		const totalSnowballs = this.totalSnowballs | 0;
		this.snowballText.setText(`Snowballs: ${totalSnowballs}`);
		if (!PlayFabClient.IsClientLoggedIn()) {
			this.scene.start("Signin");
		}
	}

	makeSnowball() {
		this.anims.create({
			key: "squish",
			frames: [
				{ key: "snowball1" },
				{ key: "snowball2" },
				{ key: "snowball3" },
				{ key: "snowball2" },
				{ key: "snowball1" },
			],
			frameRate: 8,
		});

		const sprite = this.add
			.sprite(0, 60, "snowball1")
			.setOrigin(0, 0)
			.setScale(0.5)
			.setInteractive({ useHandCursor: true })
			.on("pointerup", (pointer: Phaser.Input.Pointer) => {
				if (pointer.leftButtonReleased()) {
					const currentClickMultiplier = this.clickMultiplier;
					this.totalManualPenguinClicks += 1;
					this.totalAddedSnowballs += currentClickMultiplier;
					this.totalSnowballs += currentClickMultiplier;
					const amountText = this.add
						.text(pointer.x, pointer.y, currentClickMultiplier.toString(), { fontFamily: fontFamily })
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
		return sprite;
	}

	makeStoreItem(storeItem: PlayFabClientModels.StoreItem) {
		const itemDetail: ItemDetail = this.itemsMap[storeItem.ItemId];

		const index = this.storeItems.length;
		this.storeItems.push(storeItem);
		const background = this.add
			.existing(new RoundRectangle(this, 0, -200 + index * 100, 340, 80, 15, 0x385666))
			.setInteractive({ useHandCursor: true })
			.on("pointerup", (pointer: Phaser.Input.Pointer) => {
				this.sync(() => this.purchaseItem(itemDetail, storeItem.VirtualCurrencyPrices.SB));
			});

		let image: Phaser.GameObjects.Image;
		if (storeItem.ItemId === "0") {
			image = this.add.image(-60, -200 + index * 100, "mittens").setScale(0.3);
		} else if (storeItem.ItemId === "1") {
			image = this.add.image(-60, -200 + index * 100, "fire").setScale(0.3);
		} else if (storeItem.ItemId === "2") {
			image = this.add.image(-60, -200 + index * 100, "snowman").setScale(0.3);
		} else if (storeItem.ItemId === "3") {
			image = this.add.image(-60, -200 + index * 100, "igloo").setScale(0.3);
		} else if (storeItem.ItemId === "4") {
			image = this.add.image(-60, -200 + index * 100, "vault").setScale(0.3);
		}
		image
			.setInteractive()
			.on("pointerover", (pointer: Phaser.Input.Pointer, localX, localY, event) =>
				this.showStoreItemDetails(
					pointer,
					localX,
					localY,
					event,
					itemDetail,
					storeItem.VirtualCurrencyPrices.SB
				)
			)
			.on("pointerout", (pointer: Phaser.Input.Pointer, event) => {
				const levelsContainer = this.popup.getAt(3) as Phaser.GameObjects.Container;
				levelsContainer.removeAll(true);
				this.popup.setVisible(false);
			});

		const nameText = this.add.text(-20, -215 + index * 100, itemDetail.DisplayName, {
			fontFamily: fontFamily,
		});
		const priceText = this.add.text(-20, -185 + index * 100, `${storeItem.VirtualCurrencyPrices.SB} snowballs`, {
			fontFamily: fontFamily,
		});

		const row = this.add.container(0, 0, [background, image, nameText, priceText]);
		this.storeContainer.add(row);
	}

	purchaseItem(itemDetail: ItemDetail, price: number) {
		PlayFabClient.PurchaseItem({ ItemId: itemDetail.ItemId, Price: price, VirtualCurrency: "SB" }, (e, r) => {
			if (e !== null) {
				this.showToast("Not enough snowballs", true);
			} else {
				this.totalSnowballs -= price;
				PlayFabClient.ExecuteCloudScript(
					{
						FunctionName: "updateItemLevel",
						FunctionParameter: {
							cost: "0",
							instanceId: r.data.Items[0].ItemInstanceId,
							level: "1",
						},
					},
					(a, b) => {
						const newItem: PlayFabClientModels.ItemInstance = b.data.FunctionResult;
						this.makeInventoryItem(newItem);
						this.showToast(`1 ${itemDetail.DisplayName} successfully purchased`, false);
					}
				);

				PlayFabClient.ExecuteCloudScript(
					{
						FunctionName: "updateStatistics",
						FunctionParameter: {
							[`${itemDetail.ItemId}_purchased`]: 1,
						},
					},
					() => {}
				);
			}
		});
	}

	makeInventoryItem(inventory: PlayFabClientModels.ItemInstance) {
		const itemType = this.itemsMap[inventory.ItemId];
		const index = Object.keys(itemType.Instances).length;
		itemType.Instances[inventory.ItemInstanceId] = inventory;
		let sprite: Phaser.GameObjects.Sprite;
		if (inventory.DisplayName === "Igloo Factory") {
			sprite = this.makeIgloo(index, inventory);
		} else if (inventory.DisplayName === "Bonfire") {
			sprite = this.makeFire(index, inventory);
		} else if (inventory.DisplayName === "Snowman") {
			sprite = this.makeSnowman(index, inventory);
		} else if (inventory.DisplayName === "Mittens") {
			sprite = this.makeMittens(index, inventory);
		} else if (inventory.DisplayName === "Arctic Vault") {
			sprite = this.makeVault(index, inventory);
		}
		sprite
			.on("pointerover", (pointer: Phaser.Input.Pointer, localX, localY, event) =>
				this.showItemDetails(pointer, localX, localY, event, inventory)
			)
			.on("pointerout", (pointer: Phaser.Input.Pointer, event) => {
				const levelsContainer = this.popup.getAt(3) as Phaser.GameObjects.Container;
				levelsContainer.removeAll(true);
				this.popup.setVisible(false);
			})
			.on("pointerup", (pointer: Phaser.Input.Pointer) => {
				if (pointer.rightButtonReleased()) {
					this.sync(() => this.upgradeItemLevel(inventory));
				}
			});
	}

	makeMittens(index: number, inventory: PlayFabClientModels.ItemInstance) {
		this.clickMultiplier += 1;
		const sprite = this.add
			.sprite(index * 100, 50, "mittens")
			.setOrigin(0, 0)
			.setScale(0.5)
			.setInteractive({ useHandCursor: true });
		this.inventoryContainer.add(sprite);
		return sprite;
	}

	makeFire(index: number, inventory: PlayFabClientModels.ItemInstance) {
		const amountText = this.add
			.text(50 + index * 100, 150, "+1", { fontFamily: fontFamily })
			.setAlpha(0)
			.setAlign("center")
			.setOrigin(0.5, 0.5)
			.setDepth(10);
		this.time.addEvent({
			delay: 10000,
			loop: true,
			callback: () => {
				amountText.setPosition(50 + index * 100, 150);
				this.totalSnowballs += 1;
				this.totalAddedSnowballs += 1;
				this.showClickAnimation(amountText);
			},
		});
		const sprite = this.add
			.sprite(index * 100, 150, "fire")
			.setOrigin(0, 0)
			.setScale(0.5)
			.setInteractive({ useHandCursor: true });
		this.inventoryContainer.add(sprite);
		this.inventoryContainer.add(amountText);
		return sprite;
	}

	makeSnowman(index: number, inventory: PlayFabClientModels.ItemInstance) {
		const amountText = this.add
			.text(50 + index * 100, 250, "+1", { fontFamily: fontFamily })
			.setAlpha(0)
			.setAlign("center")
			.setOrigin(0.5, 0.5)
			.setDepth(10);
		this.time.addEvent({
			delay: 1000,
			loop: true,
			callback: () => {
				amountText.setPosition(50 + index * 100, 250);
				this.totalSnowballs += 1;
				this.totalAddedSnowballs += 1;
				this.showClickAnimation(amountText);
			},
		});
		const sprite = this.add
			.sprite(index * 100, 250, "snowman")
			.setOrigin(0, 0)
			.setScale(0.5)
			.setInteractive({ useHandCursor: true });
		this.inventoryContainer.add(sprite);
		this.inventoryContainer.add(amountText);
		return sprite;
	}

	makeIgloo(index: number, inventory: PlayFabClientModels.ItemInstance) {
		const amountText = this.add
			.text(50 + index * 100, 350, "+10", { fontFamily: fontFamily })
			.setAlpha(0)
			.setAlign("center")
			.setOrigin(0.5, 0.5)
			.setDepth(10);
		this.time.addEvent({
			delay: 1000,
			loop: true,
			callback: () => {
				amountText.setPosition(50 + index * 100, 350);
				this.totalSnowballs += 10;
				this.totalAddedSnowballs += 10;
				this.showClickAnimation(amountText);
			},
		});
		const sprite = this.add
			.sprite(index * 100, 350, "igloo")
			.setOrigin(0, 0)
			.setScale(0.5)
			.setInteractive();
		this.inventoryContainer.add(sprite);
		this.inventoryContainer.add(amountText);
		return sprite;
	}

	makeVault(index: number, inventory: PlayFabClientModels.ItemInstance) {
		const amountText = this.add
			.text(50 + index * 100, 450, "+100", { fontFamily: fontFamily })
			.setAlpha(0)
			.setAlign("center")
			.setOrigin(0.5, 0.5)
			.setDepth(10);
		this.time.addEvent({
			delay: 1000,
			loop: true,
			callback: () => {
				amountText.setPosition(50 + index * 100, 450);
				this.totalSnowballs += 100;
				this.totalAddedSnowballs += 100;
				this.showClickAnimation(amountText);
			},
		});
		const sprite = this.add
			.sprite(index * 100, 450, "vault")
			.setOrigin(0, 0)
			.setScale(0.5)
			.setInteractive({ useHandCursor: true });
		this.inventoryContainer.add(sprite);
		this.inventoryContainer.add(amountText);
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

	makePopup() {
		const nameText = this.add.text(0, 0, "", { fontFamily: fontFamily });
		const descriptionText = this.add.text(0, 20, "", { fontFamily: fontFamily });
		const currentLevelText = this.add.text(0, 40, "", { fontFamily: fontFamily });
		const levelsContainer = this.add.container(0, 60, []);
		const container = this.add.container(0, 0, [nameText, descriptionText, currentLevelText, levelsContainer]);
		this.popup = container;
		this.popup.setVisible(false);
		this.popup.setDepth(21);
	}

	showItemDetails(pointer: Phaser.Input.Pointer, localX, localY, event, item: PlayFabClientModels.ItemInstance) {
		const itemType = this.itemsMap[item.ItemId];

		const nameText = this.popup.getAt(0) as Phaser.GameObjects.Text;
		nameText.setText(`Name: ${item.DisplayName}`);
		const descriptionText = this.popup.getAt(1) as Phaser.GameObjects.Text;
		descriptionText.setText(`Description: ${itemType.Description}`);
		const currentLevelText = this.popup.getAt(2) as Phaser.GameObjects.Text;
		currentLevelText.setText(`Current level: ${item.CustomData["Level"]}`);

		const levelsContainer = this.popup.getAt(3) as Phaser.GameObjects.Container;
		const levels = itemType.Levels as { [key: string]: { Cost: string; Effect: string } };
		Object.keys(levels).forEach((key, i) => {
			const levelText = this.add.text(0, i * 20, key, { fontFamily: fontFamily });
			const costText = this.add.text(50, i * 20, `Cost: ${levels[key].Cost}`, { fontFamily: fontFamily });
			const effectText = this.add.text(200, i * 20, `Effect: ${levels[key].Effect}`, {
				fontFamily: fontFamily,
			});
			levelsContainer.add([levelText, costText, effectText]);
		});

		this.popup.setX(pointer.x);
		this.popup.setY(pointer.y);
		this.popup.setVisible(true);
	}

	showStoreItemDetails(pointer: Phaser.Input.Pointer, localX, localY, event, itemDetail: ItemDetail, price: number) {
		const nameText = this.popup.getAt(0) as Phaser.GameObjects.Text;
		nameText.setText(`Name: ${itemDetail.DisplayName}`);
		const descriptionText = this.popup.getAt(1) as Phaser.GameObjects.Text;
		descriptionText.setText(`Description: ${itemDetail.Description}`);
		const priceText = this.popup.getAt(2) as Phaser.GameObjects.Text;
		priceText.setText(`Price: ${price}`);

		const levelsContainer = this.popup.getAt(3) as Phaser.GameObjects.Container;
		const levels = itemDetail.Levels;
		Object.keys(levels).forEach((key, i) => {
			const levelText = this.add.text(0, i * 20, key, { fontFamily: fontFamily });
			const costText = this.add.text(50, i * 20, `Cost: ${levels[key].Cost}`, { fontFamily: fontFamily });
			const effectText = this.add.text(200, i * 20, `Effect: ${levels[key].Effect}`, {
				fontFamily: fontFamily,
			});
			levelsContainer.add([levelText, costText, effectText]);
		});

		this.popup.setX(pointer.x);
		this.popup.setY(pointer.y);
		this.popup.setVisible(true);
	}

	upgradeItemLevel(item: PlayFabClientModels.ItemInstance) {
		const itemType = this.itemsMap[item.ItemId];

		const newLevel = Number(item.CustomData["Level"]) + 1;
		PlayFabClient.GetUserInventory({}, (error, result) => {
			const sb = result.data.VirtualCurrency.SB;
			if (!(newLevel.toString() in itemType.Levels)) {
				this.showToast(`${newLevel} is not a valid level`, true);
				return;
			}
			const cost = itemType.Levels[newLevel].Cost;
			if (Number(cost) > sb) {
				this.showToast("Not enough snowballs", true);
				return;
			}
			PlayFabClient.ExecuteCloudScript(
				{
					FunctionName: "updateItemLevel",
					FunctionParameter: {
						instanceId: item.ItemInstanceId,
						level: newLevel,
						cost: cost,
					},
				},
				(error, result) => {
					console.log("Update item level result:", result);
					this.totalSnowballs -= Number(cost);
					const i: PlayFabClientModels.ItemInstance = itemType.Instances[item.ItemInstanceId];
					i.CustomData["Level"] = newLevel.toString();
					const currentLevelText = this.popup.getAt(2) as Phaser.GameObjects.Text;
					currentLevelText.setText(`Current level: ${newLevel}`);
				}
			);
		});
	}

	makeToast() {
		const toastText = this.add.text(0, 0, "", { fontFamily: fontFamily });
		const bg = this.add.existing(
			new RoundRectangle(this, 0, 0, 0, 0, 15, 0xffffff, 0.1).setStrokeStyle(2, 0xffffff, 1)
		);
		this.toast = this.add.container(0, 0, [bg, toastText]).setAlpha(0).setDepth(1);
	}

	showToast(message: string, isError: boolean) {
		const toastText = this.toast.getAt(1) as Phaser.GameObjects.Text;
		toastText.setText(message).setAlign("center").setOrigin(0.5, 0.5);

		const bg = this.toast.getAt(0) as RoundRectangle;
		bg.width = toastText.width + 16;
		bg.height = toastText.height + 8;

		if (isError) {
			toastText.setColor("#ff7360");
			bg.setStrokeStyle(2, 0xff7360, 1);
		} else {
			toastText.setColor("#ffffff");
			bg.setStrokeStyle(2, 0xffffff, 1);
		}

		this.toast.setPosition(400, 8 + bg.height / 2);
		this.add.tween({
			targets: [this.toast],
			ease: "Sine.easeIn",
			duration: 300,
			alpha: 1,
			completeDelay: 1000,
			onComplete: () => {
				this.toast.setAlpha(0);
			},
			callbackScope: this,
		});
	}

	sync(func: () => any) {
		PlayFabClient.UpdateUserData({ Data: { auto: new Date().valueOf().toString() } }, () => {});

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
								current_snowballs: this.totalSnowballs,
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
