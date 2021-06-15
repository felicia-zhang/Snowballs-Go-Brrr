import { PlayFabClient } from "playfab-sdk";
import { fontFamily } from "../utils/font";
import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";

class GameScene extends Phaser.Scene {
	SYNC_DELAY = 60000;
	AUTO_DELAY = 30000;
	CLICK_MULTIPLIER = 1;
	totalSnowballs: number;
	totalAddedSnowballs: number;
	totalManualPenguinClicks: number;
	syncTimer: Phaser.Time.TimerEvent;
	itemsMap: {
		[key: number]: {
			Description: string;
			Levels: { [key: string]: { Cost: string; Effect: string } };
			Instances: { [key: string]: PlayFabClientModels.ItemInstance };
		};
	};
	snowballText: Phaser.GameObjects.Text;
	popup: Phaser.GameObjects.Container;
	toast: Phaser.GameObjects.Container;

	constructor() {
		super("Game");
	}

	create() {
		this.add.image(400, 300, "sky");
		this.totalAddedSnowballs = 0;
		this.totalManualPenguinClicks = 0;
		this.itemsMap = {};
		this.makeToast();
		this.makePopup();
		this.makePenguin();

		PlayFabClient.GetCatalogItems({ CatalogVersion: "1" }, (error, result) => {
			result.data.Catalog.forEach((item: PlayFabClientModels.CatalogItem, i) => {
				this.itemsMap[item.ItemId] = {
					Description: item.Description,
					Levels: JSON.parse(item.CustomData)["Levels"],
					Instances: {},
				};
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

		this.syncTimer = this.time.addEvent({
			delay: this.SYNC_DELAY,
			loop: true,
			callback: () => this.sync(),
		});

		this.snowballText = this.add.text(16, 16, `Snowballs: ${this.totalSnowballs}`, { fontFamily: fontFamily });

		this.add
			.text(700, 400, "STORE", { fontFamily: fontFamily })
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => {
				this.scene.launch("Store");
				this.scene.bringToTop("Store");
			});

		this.add
			.text(700, 450, "MENU", { fontFamily: fontFamily })
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

	makePenguin() {
		this.anims.create({
			key: "penguin_bounce",
			frames: [{ key: "penguin3" }, { key: "penguin2" }, { key: "penguin1" }, { key: "penguin2" }],
			frameRate: 8,
			repeat: -1,
		});
		const sprite = this.add
			.sprite(0, 60, "penguin3")
			.setOrigin(0, 0)
			.setScale(0.3)
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

	makeItem(inventory: PlayFabClientModels.ItemInstance) {
		const itemType = this.itemsMap[inventory.DisplayName];
		const index = Object.keys(itemType.Instances).length;
		itemType.Instances[inventory.ItemInstanceId] = inventory;
		let sprite: Phaser.GameObjects.Sprite;
		console.log(inventory.DisplayName);
		if (inventory.DisplayName === "Igloo Factory") {
			sprite = this.makeIgloo(index, inventory);
		} else if (inventory.DisplayName === "Torch") {
			sprite = this.makeTorch(index, inventory);
		} else if (inventory.DisplayName === "Snowman") {
			sprite = this.makeSnowman(index, inventory);
		} else if (inventory.DisplayName === "Snowrhombus") {
			sprite = this.makeRhombus(index, inventory);
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
			.sprite(index * 220, 210, "igloo")
			.setOrigin(0, 0)
			.setScale(0.3)
			.setInteractive();
	}

	makeTorch(index: number, inventory: PlayFabClientModels.ItemInstance) {
		this.time.addEvent({
			delay: this.AUTO_DELAY,
			loop: true,
			callback: () => {
				console.log(`Torch ${inventory.ItemInstanceId} added 1 snowball`);
				this.totalSnowballs += 1;
				this.totalAddedSnowballs += 1;
			},
		});
		return this.add
			.sprite(index * 70, 360, "fire")
			.setOrigin(0, 0)
			.setScale(0.3)
			.setInteractive({ useHandCursor: true });
	}

	makeSnowman(index: number, inventory: PlayFabClientModels.ItemInstance) {
		return this.add
			.sprite(index * 120, 460, "fish")
			.setOrigin(0, 0)
			.setScale(0.3)
			.setInteractive({ useHandCursor: true });
	}

	makeRhombus(index: number, inventory: PlayFabClientModels.ItemInstance) {
		this.CLICK_MULTIPLIER += 1;
		return this.add
			.sprite(index * 120, 460, "fish")
			.setOrigin(0, 0)
			.setScale(0.3)
			.setInteractive({ useHandCursor: true });
	}

	makeVault(index: number, inventory: PlayFabClientModels.ItemInstance) {
		this.CLICK_MULTIPLIER += 1;
		return this.add
			.sprite(index * 120, 460, "fish")
			.setOrigin(0, 0)
			.setScale(0.3)
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
