import { PlayFabClient } from "playfab-sdk";
import { fontFamily } from "../utils/font";

enum itemType {
	Penguin = "Penguin",
	Igloo = "Igloo",
	Torch = "Torch",
	Fishie = "Fishie",
}

enum consumableItemType {
	Torch = "Torch",
	Fishie = "Fishie",
}

class GameScene extends Phaser.Scene {
	SYNC_DELAY = 60000;
	PENGUIN_DELAY = 3000;
	IGLOO_DELAY = 30000;
	TORCH_DELAY = 9000;
	FISHIE_DELAY = 9000;
	TIME_SCALE = 1;
	totalSnowballs: number = 0;
	totalAddedSnowballs: number = 0;
	syncTimer: Phaser.Time.TimerEvent;
	isAuto = false;
	penguinRegularTimers: { [key: string]: { Sprite: Phaser.GameObjects.Sprite; Timer: Phaser.Time.TimerEvent } };
	penguinLoopTimers: Phaser.Time.TimerEvent[];
	consumableItemsSprites: { [key in consumableItemType]: { [key: string]: Phaser.GameObjects.Sprite } };
	itemsMap: {
		[key in itemType]: {
			Description: string;
			Levels: { [key: string]: { Cost: string; Effect: string } };
			Instances: { [key: string]: PlayFabClientModels.ItemInstance };
		};
	};
	snowballText: Phaser.GameObjects.Text;
	popup: Phaser.GameObjects.Container;

	constructor() {
		super("Game");
	}

	create() {
		this.consumableItemsSprites = { Torch: {}, Fishie: {} };
		this.itemsMap = {
			Penguin: { Description: "", Levels: {}, Instances: {} },
			Igloo: { Description: "", Levels: {}, Instances: {} },
			Torch: { Description: "", Levels: {}, Instances: {} },
			Fishie: { Description: "", Levels: {}, Instances: {} },
		};
		this.isAuto = false;
		this.penguinRegularTimers = {};
		this.penguinLoopTimers = [];
		this.anims.create({
			key: "penguin_bounce",
			frames: [{ key: "penguin3" }, { key: "penguin2" }, { key: "penguin1" }, { key: "penguin2" }],
			frameRate: 8,
			repeat: -1,
		});
		this.anims.create({
			key: "fire_flame",
			frames: [{ key: "fire2" }, { key: "fire1" }, { key: "fire3" }],
			frameRate: 8,
			repeat: -1,
		});

		this.makePopup();

		PlayFabClient.GetCatalogItems({ CatalogVersion: "1" }, (error, result) => {
			result.data.Catalog.forEach((item: PlayFabClientModels.CatalogItem, i) => {
				const itemType = this.itemsMap[item.DisplayName];
				itemType.Description = item.Description;
				itemType.Levels = JSON.parse(item.CustomData)["Levels"];
			});
		});

		const scene = this;
		PlayFabClient.GetUserInventory({}, (error, result) => {
			const inventories: PlayFabClientModels.ItemInstance[] = result.data.Inventory;
			const sb = result.data.VirtualCurrency.SB;
			scene.totalSnowballs = sb;
			inventories.forEach(inventory => this.makeItem(inventory));

			PlayFabClient.GetUserData({ Keys: ["auto"] }, (error, result) => {
				if (result.data.Data["auto"] !== undefined) {
					const lastUpdated = result.data.Data["auto"].Value;
					const elapsed = new Date().valueOf() - Number(lastUpdated);
					const elapsedSeconds = elapsed / 1000;
					console.log("Elapsed seconds:", elapsedSeconds);
					const numberOfIgloos = Object.keys(this.itemsMap.Igloo.Instances).length;
					const sb = Math.floor(elapsedSeconds / (this.IGLOO_DELAY / 1000)) * numberOfIgloos;
					this.totalSnowballs += sb;
					this.totalAddedSnowballs += sb;
					console.log("Amount of snowballs added by Igloo factories while player was gone", sb);
				}
			});
		});

		this.syncTimer = this.time.addEvent({
			delay: this.SYNC_DELAY,
			loop: true,
			callback: () => this.sync(),
		});

		this.add.image(400, 300, "sky");

		this.snowballText = this.add.text(16, 16, `Snowballs: ${this.totalSnowballs}`, { fontFamily: fontFamily });

		this.add
			.text(700, 400, "STORE", { fontFamily: fontFamily })
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => {
				if (!this.scene.isActive("Store")) {
					this.scene.launch("Store");
				}
				this.scene.bringToTop("Store");
			});

		this.add
			.text(700, 450, "MENU", { fontFamily: fontFamily })
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => {
				this.scene.bringToTop("Menu");
			});
	}

	update() {
		this.snowballText.setText(`Snowballs: ${this.totalSnowballs}`);
		if (!PlayFabClient.IsClientLoggedIn()) {
			this.scene.start("Signin");
		}
	}

	makeItem(inventory: PlayFabClientModels.ItemInstance) {
		const itemType = this.itemsMap[inventory.DisplayName];
		const index = Object.keys(itemType.Instances).length;
		itemType.Instances[inventory.ItemInstanceId] = inventory;
		let sprite: Phaser.GameObjects.Sprite;
		if (inventory.DisplayName === "Penguin") {
			sprite = this.makePenguin(index, inventory);
		} else if (inventory.DisplayName === "Igloo") {
			sprite = this.makeIgloo(index, inventory);
		} else if (inventory.DisplayName === "Torch") {
			sprite = this.makeTorch(index, inventory);
			this.consumableItemsSprites[inventory.DisplayName][inventory.ItemInstanceId] = sprite;
		} else if (inventory.DisplayName === "Fishie") {
			sprite = this.makeFishie(index, inventory);
			this.consumableItemsSprites[inventory.DisplayName][inventory.ItemInstanceId] = sprite;
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

	makePenguin(index: number, inventory: PlayFabClientModels.ItemInstance) {
		const data = { Sprite: null, Timer: null };
		const sprite = this.add
			.sprite(index * 120, 60, "penguin3")
			.setOrigin(0, 0)
			.setScale(0.3)
			.setInteractive({ useHandCursor: true })
			.on("pointerup", (pointer: Phaser.Input.Pointer) => {
				if (pointer.leftButtonReleased()) {
					sprite.anims.play("penguin_bounce");
					sprite.disableInteractive();
					const penguinTimer = this.time.addEvent({
						timeScale: this.TIME_SCALE,
						delay: this.PENGUIN_DELAY,
						callback() {
							sprite.anims.pause();
							sprite.setInteractive({ useHandCursor: true });
							this.totalSnowballs += 1;
							this.totalAddedSnowballs += 1;
							penguinTimer.remove(false);
						},
						callbackScope: this,
					});
					data.Timer = penguinTimer;
				}
			});
		data.Sprite = sprite;
		this.penguinRegularTimers[inventory.ItemInstanceId] = data;
		return sprite;
	}

	makeIgloo(index: number, inventory: PlayFabClientModels.ItemInstance) {
		const sprite = this.add
			.sprite(index * 220, 210, "igloo")
			.setOrigin(0, 0)
			.setScale(0.3)
			.setInteractive();
		this.time.addEvent({
			delay: this.IGLOO_DELAY,
			loop: true,
			callback: () => {
				console.log(`Igloo ${inventory.ItemInstanceId} added 1 snowball`);
				this.totalSnowballs++;
				this.totalAddedSnowballs++;
			},
		});
		return sprite;
	}

	makeTorch(index: number, inventory: PlayFabClientModels.ItemInstance) {
		const sprite = this.add
			.sprite(index * 70, 360, "fire2")
			.setOrigin(0, 0)
			.setScale(0.3)
			.setInteractive({ useHandCursor: true })
			.on("pointerup", (pointer: Phaser.Input.Pointer) => {
				if (pointer.leftButtonReleased()) {
					if (this.TIME_SCALE === 13) {
						console.log("Torches already max out penguin speed");
					} else {
						PlayFabClient.ConsumeItem(
							{ ConsumeCount: 1, ItemInstanceId: inventory.ItemInstanceId },
							(e, r) => console.log("Consumed torch")
						);
						sprite.anims.play("fire_flame");
						sprite.disableInteractive();
						this.speedUpPenguins();
						const torchTimer = this.time.addEvent({
							delay: this.TORCH_DELAY,
							callback() {
								this.removeConsumableItemSprite(sprite, inventory, 70);
								this.slowDownPenguins();
								torchTimer.remove(false);
							},
							callbackScope: this,
						});
					}
				}
			});
		return sprite;
	}

	makeFishie(index: number, inventory: PlayFabClientModels.ItemInstance) {
		const sprite = this.add
			.sprite(index * 120, 460, "fish")
			.setOrigin(0, 0)
			.setScale(0.3)
			.setInteractive({ useHandCursor: true })
			.on("pointerup", (pointer: Phaser.Input.Pointer) => {
				if (pointer.leftButtonReleased()) {
					if (this.isAuto) {
						console.log("Fishie already clicked");
					} else {
						PlayFabClient.ConsumeItem(
							{ ConsumeCount: 1, ItemInstanceId: inventory.ItemInstanceId },
							(e, r) => console.log("Consumed fishie")
						);
						sprite.disableInteractive();
						this.isAuto = true;
						this.startPenguins();
						const fishieTimer = this.time.addEvent({
							delay: this.FISHIE_DELAY,
							callback() {
								this.removeConsumableItemSprite(sprite, inventory, 120);
								this.isAuto = false;
								this.stopPenguins();
								fishieTimer.remove(false);
							},
							callbackScope: this,
						});
					}
				}
			});
		return sprite;
	}

	startPenguins() {
		Object.keys(this.penguinRegularTimers).forEach(key => {
			const sprite = this.penguinRegularTimers[key].Sprite;
			const timer = this.penguinRegularTimers[key].Timer;
			const timerConfig = {
				timeScale: this.TIME_SCALE,
				delay: this.PENGUIN_DELAY,
				callback() {
					this.totalSnowballs += 1;
					this.totalAddedSnowballs += 1;
				},
				loop: true,
				callbackScope: this,
			};
			if (timer !== null && sprite.anims.isPlaying) {
				timer.callback = () => {
					this.totalSnowballs += 1;
					this.totalAddedSnowballs += 1;
					timer.remove(false);
					const penguinLoopTimer = this.time.addEvent(timerConfig);
					this.penguinLoopTimers.push(penguinLoopTimer);
				};
			} else {
				sprite.anims.play("penguin_bounce");
				sprite.disableInteractive();
				const penguinLoopTimer = this.time.addEvent(timerConfig);
				this.penguinLoopTimers.push(penguinLoopTimer);
			}
		});
	}

	stopPenguins() {
		this.penguinLoopTimers.forEach(timer => timer.remove(false));
		this.penguinLoopTimers = [];
		Object.keys(this.penguinRegularTimers).forEach(key => {
			const sprite = this.penguinRegularTimers[key].Sprite;
			sprite.anims.pause();
			sprite.setInteractive({ useHandCursor: true });
		});
	}

	speedUpPenguins() {
		this.TIME_SCALE += 2;
		this.penguinLoopTimers.forEach(timer => (timer.timeScale = this.TIME_SCALE));
	}

	slowDownPenguins() {
		this.TIME_SCALE -= 2;
		this.penguinLoopTimers.forEach(timer => (timer.timeScale = this.TIME_SCALE));
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

	removeConsumableItemSprite(
		removedSprite: Phaser.GameObjects.Sprite,
		inventory: PlayFabClientModels.ItemInstance,
		delta: number
	) {
		removedSprite.destroy(true);
		const consumableItemsType = this.consumableItemsSprites[inventory.DisplayName];
		delete this.itemsMap[inventory.DisplayName].Instances[inventory.ItemInstanceId];
		delete consumableItemsType[inventory.ItemInstanceId];
		Object.keys(consumableItemsType).forEach((instanceId, i) => {
			const sprite = consumableItemsType[instanceId];
			sprite.x = i * delta;
		});
	}

	showItemDetails(pointer: Phaser.Input.Pointer, localX, localY, event, item: PlayFabClientModels.ItemInstance) {
		const itemType = this.itemsMap[item.DisplayName];

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

	upgradeItemLevel(item: PlayFabClientModels.ItemInstance) {
		const itemType = this.itemsMap[item.DisplayName];

		const newLevel = Number(item.CustomData["Level"]) + 1;
		PlayFabClient.GetUserInventory({}, (error, result) => {
			const sb = result.data.VirtualCurrency.SB;
			if (!(newLevel.toString() in itemType.Levels)) {
				console.log(`${newLevel} is not a valid level`);
				return;
			}
			const cost = itemType.Levels[newLevel].Cost;
			if (Number(cost) > sb) {
				console.log("Insufficient funds");
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

	sync(func?: () => any) {
		PlayFabClient.UpdateUserData({ Data: { auto: new Date().valueOf().toString() } }, (e, r) => {
			console.log("Last synced result", r);
		});

		if (this.totalAddedSnowballs === 0) {
			console.log("No change to snowballs since last sync");
			if (func !== undefined) {
				func();
			}
		} else {
			PlayFabClient.ExecuteCloudScript(
				{
					FunctionName: "addUserVirtualCurrency",
					FunctionParameter: { amount: this.totalAddedSnowballs, virtualCurrency: "SB" },
				},
				(error, result) => {
					console.log("Amount of snowballs added:", this.totalAddedSnowballs);
					this.totalAddedSnowballs = 0;
					PlayFabClient.ExecuteCloudScript(
						{ FunctionName: "updateStatistics", FunctionParameter: { snowballs: this.totalSnowballs } },
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
