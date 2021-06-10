import { PlayFabClient } from "playfab-sdk";
import { fontFamily } from "../utils/font";

class GameScene extends Phaser.Scene {
	SYNC_DELAY = 60000;
	PENGUIN_DELAY = 3000;
	IGLOO_DELAY = 30000;
	TORCH_DELAY = 30000;
	FISHIE_DELAY = 9000;
	totalSnowballs: number = 0;
	totalAddedSnowballs: number = 0;
	syncTimer: Phaser.Time.TimerEvent;
	isAuto = false;
	penguinRegularTimers: { [key: string]: { Sprite: Phaser.GameObjects.Sprite; Timer: Phaser.Tweens.Tween } };
	penguinLoopTimers: Phaser.Tweens.Tween[];
	items: { [key: string]: { [key: string]: PlayFabClientModels.ItemInstance } } = {
		Penguin: {},
		Igloo: {},
		Torch: {},
		Fishie: {},
	};
	itemDescriptions: { [key: string]: string } = { Penguin: "", Igloo: "", Torch: "", Fishie: "" };
	itemLevels: { [key: string]: { [key: string]: { Cost: string; Effect: string } } } = {
		Penguin: {},
		Igloo: {},
		Torch: {},
		Fishie: {},
	};
	snowballText: Phaser.GameObjects.Text;
	popup: Phaser.GameObjects.Container;

	constructor() {
		super("Game");
	}

	create() {
		this.items = { Penguin: {}, Igloo: {}, Torch: {}, Fishie: {} };
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
				this.itemDescriptions[item.DisplayName] = item.Description;
				this.itemLevels[item.DisplayName] = JSON.parse(item.CustomData)["Levels"];
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
					const numberOfIgloos = Object.keys(this.items["Igloo"]).length;
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
			.on("pointerdown", () => {
				if (!this.scene.isActive("Store")) {
					this.scene.launch("Store");
				}
				this.scene.bringToTop("Store");
			});

		this.add
			.text(700, 450, "MENU", { fontFamily: fontFamily })
			.setInteractive({ useHandCursor: true })
			.on("pointerdown", () => {
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
		const index = Object.keys(this.items[inventory.DisplayName]).length;
		this.items[inventory.DisplayName][inventory.ItemInstanceId] = inventory;
		let sprite: Phaser.GameObjects.Sprite;
		if (inventory.DisplayName === "Penguin") {
			sprite = this.makePenguin(index, inventory);
		} else if (inventory.DisplayName === "Igloo") {
			sprite = this.makeIgloo(index, inventory);
		} else if (inventory.DisplayName === "Torch") {
			sprite = this.makeTorch(index, inventory);
		} else if (inventory.DisplayName === "Fishie") {
			sprite = this.makeFishie(index, inventory);
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
		const object = { Sprite: null, Timer: null };
		const sprite = this.add
			.sprite(index * 120, 60, "penguin3")
			.setOrigin(0, 0)
			.setScale(0.3)
			.setInteractive({ useHandCursor: true })
			.on("pointerup", (pointer: Phaser.Input.Pointer) => {
				if (pointer.leftButtonReleased()) {
					const penguinTimer = this.tweens.add({
						targets: sprite,
						duration: this.PENGUIN_DELAY <= 0 ? 250 : this.PENGUIN_DELAY,
						x: index * 120,
						onStart() {
							sprite.anims.play("penguin_bounce");
							sprite.disableInteractive();
						},
						onComplete() {
							sprite.anims.pause();
							sprite.setInteractive({ useHandCursor: true });
							this.totalSnowballs += 1;
							this.totalAddedSnowballs += 1;
							penguinTimer.remove();
						},
						callbackScope: this,
					});
					object["Timer"] = penguinTimer;
				}
			});
		object["Sprite"] = sprite;
		this.penguinRegularTimers[inventory.ItemInstanceId] = object;
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
					if (this.PENGUIN_DELAY === 0) {
						console.log("Torch already clicked");
					} else {
						PlayFabClient.ConsumeItem(
							{ ConsumeCount: 1, ItemInstanceId: inventory.ItemInstanceId },
							(e, r) => console.log("Consumed torch")
						);
						sprite.anims.play("fire_flame");
						sprite.disableInteractive();
						this.PENGUIN_DELAY -= 1000;
						const torchTimer = this.time.addEvent({
							delay: this.TORCH_DELAY,
							callback() {
								sprite.destroy(true);
								this.PENGUIN_DELAY += 1000;
								torchTimer.remove(false);
								// TODO: should we rearranged the sprite to left align? Should we delete this inventory from this.item["Torch"][instanceId]
							},
							callbackScope: this,
						});
					}
				}
			});
		return sprite;
	}

	//TODO: how does fishie and torch interact with eachother
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
								sprite.destroy(true);
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
			const sprite = this.penguinRegularTimers[key]["Sprite"];
			const timer = this.penguinRegularTimers[key]["Timer"];
			const timerConfig = {
				targets: sprite,
				duration: this.PENGUIN_DELAY <= 0 ? 250 : this.PENGUIN_DELAY,
				x: sprite.x,
				onStart() {
					sprite.anims.play("penguin_bounce");
					sprite.disableInteractive();
				},
				onRepeat() {
					this.totalSnowballs += 1;
					this.totalAddedSnowballs += 1;
				},
				repeat: Infinity,
				callbackScope: this,
			};
			if (timer !== null && sprite.anims.isPlaying) {
				console.log(timer);
				timer.setCallback(
					"onComplete",
					() => {
						this.totalSnowballs += 1;
						this.totalAddedSnowballs += 1;
						timer.remove();
						const penguinLoopTimer = this.tweens.add(timerConfig);
						this.penguinLoopTimers.push(penguinLoopTimer);
					},
					[timer, [sprite]],
					this
				);
			} else {
				const penguinLoopTimer = this.tweens.add(timerConfig);
				this.penguinLoopTimers.push(penguinLoopTimer);
			}
		});
	}

	stopPenguins() {
		this.penguinLoopTimers.forEach(timer => timer.remove());
		this.penguinLoopTimers = [];
		Object.keys(this.penguinRegularTimers).forEach(key => {
			const sprite = this.penguinRegularTimers[key]["Sprite"];
			sprite.anims.pause();
			sprite.setInteractive({ useHandCursor: true });
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
		this.popup.setDepth(1);
	}

	showItemDetails(pointer: Phaser.Input.Pointer, localX, localY, event, item: PlayFabClientModels.ItemInstance) {
		const nameText = this.popup.getAt(0) as Phaser.GameObjects.Text;
		nameText.setText(`Name: ${item.DisplayName}`);
		const descriptionText = this.popup.getAt(1) as Phaser.GameObjects.Text;
		descriptionText.setText(`Description: ${this.itemDescriptions[item.DisplayName]}`);
		const currentLevelText = this.popup.getAt(2) as Phaser.GameObjects.Text;
		currentLevelText.setText(`Current level: ${item.CustomData["Level"]}`);

		const levelsContainer = this.popup.getAt(3) as Phaser.GameObjects.Container;
		const levels = this.itemLevels[item.DisplayName] as { [key: string]: { Cost: string; Effect: string } };
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
		const newLevel = Number(item.CustomData["Level"]) + 1;
		PlayFabClient.GetUserInventory({}, (error, result) => {
			const sb = result.data.VirtualCurrency.SB;
			if (!(newLevel.toString() in this.itemLevels[item.DisplayName])) {
				console.log(`${newLevel} is not a valid level`);
				return;
			}
			const cost = this.itemLevels[item.DisplayName][newLevel]["Cost"];
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
					const i: PlayFabClientModels.ItemInstance = this.items[item.DisplayName][item.ItemInstanceId];
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
