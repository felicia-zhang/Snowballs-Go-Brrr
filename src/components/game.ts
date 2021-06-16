import { PlayFabClient } from "playfab-sdk";
import { fontFamily } from "../utils/font";
import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";

interface ItemDetail {
	Description: string;
	Levels: { [key: string]: { Cost: string; Effect: string } };
	Instances: { [key: string]: PlayFabClientModels.ItemInstance };
}

class GameScene extends Phaser.Scene {
	SYNC_DELAY = 60000;
	AUTO_DELAY = 30000;
	CLICK_MULTIPLIER = 1;
	totalSnowballs: number;
	totalAddedSnowballs: number;
	totalManualPenguinClicks: number;
	syncTimer: Phaser.Time.TimerEvent;
	catalogItems: PlayFabClientModels.CatalogItem[];
	itemsMap: { [key: number]: ItemDetail };
	snowballText: Phaser.GameObjects.Text;
	popup: Phaser.GameObjects.Container;
	toast: Phaser.GameObjects.Container;
	storeContainer: Phaser.GameObjects.Container;
	inventoryContainer: Phaser.GameObjects.Container;

	constructor() {
		super("Game");
	}

	create() {
		this.add.image(400, 300, "sky");
		this.totalAddedSnowballs = 0;
		this.totalManualPenguinClicks = 0;
		this.catalogItems = [];
		this.itemsMap = {};
		this.makeToast();
		this.makePopup();
		this.add.text(600, 20, "STORE", { fontFamily: fontFamily });
		const background = this.add.existing(new RoundRectangle(this, 0, 330, 180, 520, 15, 0x1a252e));
		this.storeContainer = this.add.container(690, 0, [background]);
		this.inventoryContainer = this.add.container(200, 0, []);
		this.makeSnowball();

		const scene = this;
		PlayFabClient.GetCatalogItems({ CatalogVersion: "1" }, (error, result) => {
			result.data.Catalog.forEach((item: PlayFabClientModels.CatalogItem, i) => {
				this.makeCatalogItem(item);
				this.itemsMap[item.ItemId] = {
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
						//TODO: needs to be fixed
						// const numberOfIgloos = Object.keys(this.itemsMap.3.Instances).length;
						// const numberOfTorches = Object.keys(this.itemsMap.1.Instances).length;
						// const sb =
						// 	Math.floor(elapsedSeconds / (this.AUTO_DELAY / 1000)) * numberOfIgloos +
						// 	Math.floor(elapsedSeconds / (this.AUTO_DELAY / 1000)) * numberOfTorches;
						// this.totalSnowballs += sb;
						// this.totalAddedSnowballs += sb;
						// this.showToast(`${sb} snowballs added by \nIgloo factories while \nplayer was gone`);
					}
				});
			});
		});

		this.syncTimer = this.time.addEvent({
			delay: this.SYNC_DELAY,
			loop: true,
			callback: () => this.sync(),
		});

		this.snowballText = this.add.text(16, 16, `Snowballs: ${this.totalSnowballs}`, { fontFamily: fontFamily });

		this.add
			.text(16, 550, "MENU", { fontFamily: fontFamily })
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => {
				this.scene.start("Menu");
			});
	}

	update() {
		this.snowballText.setText(`Snowballs: ${this.totalSnowballs}`);
		if (!PlayFabClient.IsClientLoggedIn()) {
			this.scene.start("Signin");
		}
	}

	makeSnowball() {
		const sprite = this.add
			.sprite(0, 60, "snowball")
			.setOrigin(0, 0)
			.setScale(0.5)
			.setInteractive({ useHandCursor: true })
			.on("pointerup", (pointer: Phaser.Input.Pointer) => {
				if (pointer.leftButtonReleased()) {
					this.totalManualPenguinClicks += 1;
					this.totalAddedSnowballs += 1;
					this.totalSnowballs += 1;
					if (!sprite.anims.isPlaying) {
						sprite.anims.play("penguin_bounce");
					}
				}
			});
		return sprite;
	}

	makeCatalogItem(item: PlayFabClientModels.CatalogItem) {
		const index = this.catalogItems.length;
		this.catalogItems.push(item);
		let image: Phaser.GameObjects.Image;
		if (item.DisplayName === "Igloo Factory") {
			image = this.add.image(10, 100 + index * 100, "igloo").setScale(0.3);
		} else if (item.DisplayName === "Bonfire") {
			image = this.add.image(10, 100 + index * 100, "fire").setScale(0.3);
		} else if (item.DisplayName === "Snowman") {
			image = this.add.image(10, 100 + index * 100, "snowman").setScale(0.3);
		} else if (item.DisplayName === "Mittens") {
			image = this.add.image(10, 100 + index * 100, "mittens").setScale(0.3);
		} else if (item.DisplayName === "Arctic Vault") {
			image = this.add.image(10, 100 + index * 100, "fire").setScale(0.3);
		}
		image
			.setInteractive()
			.on("pointerover", (pointer: Phaser.Input.Pointer, localX, localY, event) =>
				this.showCatalogItemDetails(pointer, localX, localY, event, item)
			)
			.on("pointerout", (pointer: Phaser.Input.Pointer, event) => {
				const levelsContainer = this.popup.getAt(3) as Phaser.GameObjects.Container;
				levelsContainer.removeAll(true);
				this.popup.setVisible(false);
			});

		const priceText = this.add
			.text(0, 0, `${item.VirtualCurrencyPrices.SB} snowballs`, { fontFamily: fontFamily })
			.setOrigin(0.5, 0.5);
		const background = this.add.existing(new RoundRectangle(this, 0, 0, priceText.width + 16, 36, 15, 0x385666));
		const priceTag = this.add
			.container(10, 150 + index * 100, [background, priceText])
			.setDepth(2)
			.setSize(70, 36)
			.setInteractive({ useHandCursor: true })
			.on("pointerup", (pointer: Phaser.Input.Pointer) => {
				this.sync(() => this.purchaseItem(item));
			});

		this.storeContainer.add([image, priceTag]);
	}

	purchaseItem(item: PlayFabClientModels.CatalogItem) {
		const price = item.VirtualCurrencyPrices.SB;
		PlayFabClient.PurchaseItem({ ItemId: item.ItemId, Price: price, VirtualCurrency: "SB" }, (e, r) => {
			if (e !== null) {
				this.showToast("Not enough snowballs");
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
						this.showToast(`1 ${item.DisplayName.toLowerCase()} successfully purchased`);
					}
				);

				PlayFabClient.ExecuteCloudScript(
					{
						FunctionName: "updateStatistics",
						FunctionParameter: {
							[`${item.ItemId}_purchased`]: 1,
							//TODO: cloudscript needs update
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
		this.inventoryContainer.add(sprite);
	}

	makeMittens(index: number, inventory: PlayFabClientModels.ItemInstance) {
		this.CLICK_MULTIPLIER += 1;
		return this.add
			.sprite(index * 100, 50, "mittens")
			.setOrigin(0, 0)
			.setScale(0.5)
			.setInteractive({ useHandCursor: true });
	}

	makeFire(index: number, inventory: PlayFabClientModels.ItemInstance) {
		this.time.addEvent({
			delay: this.AUTO_DELAY,
			loop: true,
			callback: () => {
				console.log(`Bonfire ${inventory.ItemInstanceId} added 1 snowball`);
				this.totalSnowballs += 1;
				this.totalAddedSnowballs += 1;
			},
		});
		return this.add
			.sprite(index * 100, 150, "fire")
			.setOrigin(0, 0)
			.setScale(0.5)
			.setInteractive({ useHandCursor: true });
	}

	makeSnowman(index: number, inventory: PlayFabClientModels.ItemInstance) {
		return this.add
			.sprite(index * 100, 250, "snowman")
			.setOrigin(0, 0)
			.setScale(0.5)
			.setInteractive({ useHandCursor: true });
	}

	makeIgloo(index: number, inventory: PlayFabClientModels.ItemInstance) {
		this.time.addEvent({
			delay: this.AUTO_DELAY,
			loop: true,
			callback: () => {
				console.log(`Igloo ${inventory.ItemInstanceId} added 10 snowball`);
				this.totalSnowballs += 10;
				this.totalAddedSnowballs += 10;
			},
		});
		return this.add
			.sprite(index * 100, 350, "igloo")
			.setOrigin(0, 0)
			.setScale(0.5)
			.setInteractive();
	}

	makeVault(index: number, inventory: PlayFabClientModels.ItemInstance) {
		this.CLICK_MULTIPLIER += 1;
		return this.add
			.sprite(index * 100, 450, "fish")
			.setOrigin(0, 0)
			.setScale(0.5)
			.setInteractive({ useHandCursor: true });
	}

	makePopup() {
		const nameText = this.add.text(0, 0, "", { fontFamily: fontFamily });
		const descriptionText = this.add.text(0, 20, "", { fontFamily: fontFamily });
		const currentLevelText = this.add.text(0, 40, "", { fontFamily: fontFamily });
		const levelsContainer = this.add.container(0, 60, []);
		const container = this.add.container(0, 0, [nameText, descriptionText, currentLevelText, levelsContainer]);
		this.popup = container;
		this.popup.setVisible(false);
		this.popup.setDepth(1);
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

	showCatalogItemDetails(
		pointer: Phaser.Input.Pointer,
		localX,
		localY,
		event,
		item: PlayFabClientModels.CatalogItem
	) {
		const nameText = this.popup.getAt(0) as Phaser.GameObjects.Text;
		nameText.setText(`Name: ${item.DisplayName}`);
		const descriptionText = this.popup.getAt(1) as Phaser.GameObjects.Text;
		descriptionText.setText(`Description: ${item.Description}`);
		const priceText = this.popup.getAt(2) as Phaser.GameObjects.Text;
		priceText.setText(`Price: ${item.VirtualCurrencyPrices.SB}`);

		const levelsContainer = this.popup.getAt(3) as Phaser.GameObjects.Container;
		const levels = JSON.parse(item.CustomData)["Levels"];
		Object.keys(levels).forEach((key, i) => {
			const levelText = this.add.text(0, i * 20, key, { fontFamily: fontFamily });
			const costText = this.add.text(50, i * 20, `Cost: ${levels[key]["Cost"]}`, { fontFamily: fontFamily });
			const effectText = this.add.text(200, i * 20, `Effect: ${levels[key]["Effect"]}`, {
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
				this.showToast(`${newLevel} is not a valid level`);
				return;
			}
			const cost = itemType.Levels[newLevel].Cost;
			if (Number(cost) > sb) {
				this.showToast("Insufficient funds");
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

	showToast(message: string) {
		const toastText = this.toast.getAt(1) as Phaser.GameObjects.Text;
		toastText.setText(message).setAlign("center").setOrigin(0.5, 0.5);

		const bg = this.toast.getAt(0) as RoundRectangle;
		bg.width = toastText.width + 16;
		bg.height = toastText.height + 8;

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

	sync(func?: () => any) {
		PlayFabClient.UpdateUserData({ Data: { auto: new Date().valueOf().toString() } }, (e, r) => {
			this.showToast("Saved");
		});

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
