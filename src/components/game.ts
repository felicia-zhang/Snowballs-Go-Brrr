import { PlayFabClient } from "playfab-sdk";
import { textStyle } from "../utils/font";
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
	snowballIcon: Phaser.GameObjects.Image;
	toast: Phaser.GameObjects.Text;
	storeContainer: Phaser.GameObjects.Container;
	inventoryContainer: Phaser.GameObjects.Container;
	overlay: Phaser.GameObjects.Rectangle;
	interactiveGameSceneObjects: Phaser.GameObjects.GameObject[];

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
		this.toast = this.add
			.text(400, 16, "", textStyle)
			.setAlpha(0)
			.setDepth(22)
			.setAlign("center")
			.setOrigin(0.5, 0);
		this.storeContainer = this.add.container(400, 300, []).setAlpha(0).setDepth(20);
		this.inventoryContainer = this.add.container(170, 5, []);
		this.overlay = this.add.rectangle(0, 0, 800, 600, 0x000000).setOrigin(0, 0).setDepth(19).setAlpha(0);
		this.interactiveGameSceneObjects = [];
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

		this.snowballText = this.add.text(16, 16, `Snowballs: ${this.totalSnowballs} x`, textStyle);
		this.snowballIcon = this.add.image(36 + this.snowballText.width, 25, "snowball1").setScale(0.15);

		this.interactiveGameSceneObjects.push(
			this.add
				.text(16, 584, "MENU", textStyle)
				.setOrigin(0, 1)
				.setInteractive({ useHandCursor: true })
				.on("pointerup", () => {
					this.scene.start("Menu");
				})
		);

		this.interactiveGameSceneObjects.push(
			this.add
				.text(784, 584, "STORE", textStyle)
				.setOrigin(1, 1)
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
				})
		);
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
		this.interactiveGameSceneObjects.forEach(object => object.disableInteractive());

		const mainBackground = this.add.existing(new RoundRectangle(this, 0, 0, 380, 450, 15, 0x16252e));
		const itemDescriptionPopup = this.add.text(200, -60, "", textStyle).setAlpha(0);
		this.storeContainer.add([mainBackground, itemDescriptionPopup]);

		PlayFabClient.GetStoreItems({ StoreId: "Main" }, (error, result) => {
			result.data.Store.forEach((storeItem: PlayFabClientModels.StoreItem) => {
				this.makeStoreItem(storeItem, itemDescriptionPopup);
			});
			const closeButton = this.add
				.image(175, -215, "close")
				.setScale(0.35)
				.setInteractive({ useHandCursor: true })
				.on("pointerup", () => {
					this.add.tween({
						targets: [this.storeContainer, this.overlay],
						ease: "Sine.easeIn",
						duration: 100,
						alpha: 0,
						onComplete: () => {
							this.interactiveGameSceneObjects.forEach(object =>
								object.setInteractive({ useHandCursor: true })
							);
							this.time.paused = false;
							this.storeContainer.removeAll(true);
							this.storeItems = [];
						},
						callbackScope: this,
					});
				});
			this.storeContainer.add(closeButton);
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
		this.snowballText.setText(`Snowballs: ${totalSnowballs} x`);
		this.snowballIcon.setX(36 + this.snowballText.width);
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
			.sprite(35, 300, "snowball1")
			.setOrigin(0, 0.5)
			.setScale(0.5)
			.setInteractive({ useHandCursor: true })
			.on("pointerup", (pointer: Phaser.Input.Pointer) => {
				if (pointer.leftButtonReleased()) {
					const currentClickMultiplier = this.clickMultiplier;
					this.totalManualPenguinClicks += 1;
					this.totalAddedSnowballs += currentClickMultiplier;
					this.totalSnowballs += currentClickMultiplier;
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
		this.interactiveGameSceneObjects.push(sprite);
		return sprite;
	}

	makeStoreItem(storeItem: PlayFabClientModels.StoreItem, itemDescriptionPopup: Phaser.GameObjects.Text) {
		const itemDetail: ItemDetail = this.itemsMap[storeItem.ItemId];
		const itemPrice = storeItem.VirtualCurrencyPrices.SB;
		const wrap = (s: string) => s.replace(/(?![^\n]{1,22}$)([^\n]{1,22})\s/g, "$1\n");

		const index = this.storeItems.length;
		this.storeItems.push(storeItem);
		const background = this.add
			.existing(new RoundRectangle(this, 0, -170 + index * 85, 340, 70, 15, 0x2e5767))
			.on("pointerup", (pointer: Phaser.Input.Pointer) => {
				this.sync(() => this.purchaseItem(itemDetail, itemPrice));
			})
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

		const nameText = this.add
			.text(-100, -170 + index * 85, "", textStyle)
			.setAlign("left")
			.setOrigin(0, 0.5);
		const priceText = this.add
			.text(125, -170 + index * 85, "", textStyle)
			.setAlign("right")
			.setOrigin(1, 0.5);

		let image: Phaser.GameObjects.Image;
		if (itemPrice === 0) {
			background.disableInteractive();
			nameText.setText("???");
			priceText.setText("??? x");
			image = this.add.image(-135, -170 + index * 85, "lock").setScale(0.25);
		} else {
			background.setInteractive({ useHandCursor: true });
			nameText.setText(itemDetail.DisplayName.toUpperCase());
			priceText.setText(`${itemPrice} x`);
			if (storeItem.ItemId === "0") {
				image = this.add.image(-135, -170 + index * 85, "mittens").setScale(0.25);
			} else if (storeItem.ItemId === "1") {
				image = this.add.image(-135, -170 + index * 85, "fire").setScale(0.25);
			} else if (storeItem.ItemId === "2") {
				image = this.add.image(-135, -170 + index * 85, "snowman").setScale(0.25);
			} else if (storeItem.ItemId === "3") {
				image = this.add.image(-135, -170 + index * 85, "igloo").setScale(0.25);
			} else if (storeItem.ItemId === "4") {
				image = this.add.image(-135, -170 + index * 85, "vault").setScale(0.25);
			}
		}
		const snowballIcon = this.add.image(145, -170 + index * 85, "snowball1").setScale(0.15);

		const row = this.add.container(0, 0, [background, image, nameText, priceText, snowballIcon]);
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
		sprite.setOrigin(0, 0).setScale(0.5);
		this.inventoryContainer.add(sprite);
	}

	makeMittens(index: number, inventory: PlayFabClientModels.ItemInstance) {
		this.clickMultiplier += 1;
		const sprite = this.add.sprite(index * 100, 50, "mittens");
		return sprite;
	}

	makeFire(index: number, inventory: PlayFabClientModels.ItemInstance) {
		const amountText = this.add
			.text(50 + index * 100, 150, "+1", textStyle)
			.setAlpha(0)
			.setAlign("center")
			.setOrigin(0.5, 0.5)
			.setDepth(10);
		this.time.addEvent({
			delay: 10000,
			loop: true,
			callback: () => {
				amountText.setY(150);
				this.totalSnowballs += 1;
				this.totalAddedSnowballs += 1;
				this.showClickAnimation(amountText);
			},
		});
		const sprite = this.add.sprite(index * 100, 150, "fire");
		this.inventoryContainer.add(amountText);
		return sprite;
	}

	makeSnowman(index: number, inventory: PlayFabClientModels.ItemInstance) {
		const amountText = this.add
			.text(50 + index * 100, 250, "+1", textStyle)
			.setAlpha(0)
			.setAlign("center")
			.setOrigin(0.5, 0.5)
			.setDepth(10);
		this.time.addEvent({
			delay: 1000,
			loop: true,
			callback: () => {
				amountText.setY(250);
				this.totalSnowballs += 1;
				this.totalAddedSnowballs += 1;
				this.showClickAnimation(amountText);
			},
		});
		const sprite = this.add.sprite(index * 100, 250, "snowman");
		this.inventoryContainer.add(amountText);
		return sprite;
	}

	makeIgloo(index: number, inventory: PlayFabClientModels.ItemInstance) {
		const amountText = this.add
			.text(50 + index * 100, 350, "+10", textStyle)
			.setAlpha(0)
			.setAlign("center")
			.setOrigin(0.5, 0.5)
			.setDepth(10);
		this.time.addEvent({
			delay: 1000,
			loop: true,
			callback: () => {
				amountText.setY(350);
				this.totalSnowballs += 10;
				this.totalAddedSnowballs += 10;
				this.showClickAnimation(amountText);
			},
		});
		const sprite = this.add.sprite(index * 100, 350, "igloo");
		this.inventoryContainer.add(amountText);
		return sprite;
	}

	makeVault(index: number, inventory: PlayFabClientModels.ItemInstance) {
		const amountText = this.add
			.text(50 + index * 100, 450, "+100", textStyle)
			.setAlpha(0)
			.setAlign("center")
			.setOrigin(0.5, 0.5)
			.setDepth(10);
		this.time.addEvent({
			delay: 1000,
			loop: true,
			callback: () => {
				amountText.setY(450);
				this.totalSnowballs += 100;
				this.totalAddedSnowballs += 100;
				this.showClickAnimation(amountText);
			},
		});
		const sprite = this.add.sprite(index * 100, 450, "vault");
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

	showToast(message: string, isError: boolean) {
		this.toast.setText(message);
		if (isError) {
			this.toast.setColor("#ff7360");
		} else {
			this.toast.setColor("#ffffff");
		}

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
