import { PlayFabClient } from "playfab-sdk";
import { fontFamily } from "../utils/font";

class GameScene extends Phaser.Scene {
	SYNC_DELAY = 60000;
	PENGUIN_DELAY = 3000;
	IGLOO_DELAY = 30000;
	TORCH_DELAY = 30000;
	totalSnowballs: number = 0;
	prevTotalSnowballs: number = 0;
	timerEvent: Phaser.Time.TimerEvent;
	items: { [key: string]: { [key: string]: PlayFabClientModels.ItemInstance } };
	itemDescriptions: { [key: string]: string } = { Penguin: "", Igloo: "", Torch: "", Fishie: "" };
	itemLevels: { [key: string]: { [key: string]: { Cost: string; Effect: string } } } = {
		Penguin: {},
		Igloo: {},
		Torch: {},
		Fishie: {},
	};
	snowballText: Phaser.GameObjects.Text;
	clickMultiplier: number = 1;
	popup: Phaser.GameObjects.Container;

	constructor() {
		super("Game");
	}

	init() {
		this.items = { Penguin: {}, Igloo: {}, Torch: {}, Fishie: {} };
	}

	create() {
		this.anims.create({
			key: "penguin_bounce",
			frames: [{ key: "penguin3" }, { key: "penguin2" }, { key: "penguin1" }, { key: "penguin2" }],
			frameRate: 8,
			repeat: -1,
		});
		// TODO: fix this animation
		this.anims.create({
			key: "fire_flame",
			frames: [{ key: "fire" }, { key: "fish" }],
			frameRate: 8,
			repeat: -1,
		});

		const scene = this;
		PlayFabClient.GetCatalogItems({ CatalogVersion: "1" }, (error, result) => {
			result.data.Catalog.forEach((item: PlayFabClientModels.CatalogItem, i) => {
				this.itemDescriptions[item.DisplayName] = item.Description;
				this.itemLevels[item.DisplayName] = JSON.parse(item.CustomData)["Levels"];
			});
		});
		// TODO: cloud script and getUserInventory have duplicated API call
		PlayFabClient.GetUserInventory({}, (error, result) => {
			const inventories: PlayFabClientModels.ItemInstance[] = result.data.Inventory;
			const sb = result.data.VirtualCurrency.SB;
			scene.totalSnowballs = sb;
			scene.prevTotalSnowballs = sb;
			inventories.forEach((inventory, i) => {
				const index = Object.keys(this.items[inventory.DisplayName]).length;
				this.items[inventory.DisplayName][inventory.ItemInstanceId] = inventory;
				let sprite: Phaser.GameObjects.Sprite;
				if (inventory.DisplayName === "Penguin") {
					sprite = this.makePenguin(index);
				} else if (inventory.DisplayName === "Igloo") {
					sprite = this.makeIgloo(index, inventory);
				} else if (inventory.DisplayName === "Torch") {
					sprite = this.makeTorch(index, inventory);
				} else if (inventory.DisplayName === "Fishie") {
					sprite = this.makeFishie(index);
				}
				sprite
					.on("pointerover", (pointer: Phaser.Input.Pointer, localX, localY, event) =>
						this.showItemDetails(pointer, localX, localY, event, inventory)
					)
					.on("pointerout", (pointer: Phaser.Input.Pointer, event) => {
						this.popup.destroy(true);
					})
					.on("pointerup", (pointer: Phaser.Input.Pointer) => {
						if (pointer.rightButtonReleased()) {
							this.sync(() => this.upgradeItemLevel(inventory));
						}
					});
			});

			PlayFabClient.GetUserData({ Keys: ["auto"] }, (error, result) => {
				if (result.data.Data["auto"] !== undefined) {
					const lastUpdated = result.data.Data["auto"].Value;
					const elapsed = new Date().valueOf() - Number(lastUpdated);
					const elapsedSeconds = elapsed / 1000;
					console.log("Elapsed seconds:", elapsedSeconds);
					const numberOfIgloos = Object.keys(this.items["Igloo"]).length;
					const sb = Math.floor(elapsedSeconds / (this.IGLOO_DELAY / 1000)) * numberOfIgloos;
					this.totalSnowballs += sb;
					console.log("Amount of snowballs added by Igloo factories while player was gone", sb);
				}
			});
		});

		this.timerEvent = this.time.addEvent({
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
				this.sync(() => this.scene.start("Store"));
			});

		this.add
			.text(700, 450, "MENU", { fontFamily: fontFamily })
			.setInteractive({ useHandCursor: true })
			.on("pointerdown", () => {
				this.sync(() => this.scene.start("Menu"));
			});
	}

	update() {
		this.snowballText.setText(`Snowballs: ${this.totalSnowballs}`);
		if (!PlayFabClient.IsClientLoggedIn()) {
			this.scene.start("Signin");
		}
	}

	makePenguin(index: number) {
		const sprite = this.add
			.sprite(index * 120, 60, "penguin3")
			.setOrigin(0, 0)
			.setScale(0.3)
			.setInteractive({ useHandCursor: true })
			.on("pointerup", (pointer: Phaser.Input.Pointer) => {
				if (pointer.leftButtonReleased()) {
					sprite.anims.play("penguin_bounce");
					sprite.disableInteractive();
					this.time.addEvent({
						delay: this.PENGUIN_DELAY,
						callback() {
							sprite.anims.pause();
							sprite.setInteractive({ useHandCursor: true });
							this.totalSnowballs += 1;
						},
						callbackScope: this,
					});
				}
			});
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
				console.log(`${inventory.ItemInstanceId} added 1 snowball`);
				this.totalSnowballs++;
			},
		});
		return sprite;
	}

	makeTorch(index: number, inventory: PlayFabClientModels.ItemInstance) {
		const sprite = this.add
			.sprite(index * 70, 360, "fire")
			.setOrigin(0, 0)
			.setScale(0.3)
			.setInteractive({ useHandCursor: true })
			.on("pointerup", (pointer: Phaser.Input.Pointer) => {
				if (pointer.leftButtonReleased()) {
					PlayFabClient.ConsumeItem({ ConsumeCount: 1, ItemInstanceId: inventory.ItemInstanceId }, (e, r) =>
						console.log(r)
					);
					sprite.anims.play("fire_flame");
					sprite.disableInteractive();
					const prevPenguinDelay = this.PENGUIN_DELAY;
					this.PENGUIN_DELAY = prevPenguinDelay / 2;
					this.time.addEvent({
						delay: this.TORCH_DELAY,
						callback() {
							sprite.destroy(true);
							this.PENGUIN_DELAY = prevPenguinDelay; //TODO: if player exit before call back, this won't be reset
						},
						callbackScope: this,
					});
				}
			});
		return sprite;
	}

	makeFishie(index: number) {
		const sprite = this.add
			.sprite(index * 120, 460, "fish")
			.setOrigin(0, 0)
			.setScale(0.3)
			.setInteractive();
		return sprite;
	}

	showItemDetails(pointer: Phaser.Input.Pointer, localX, localY, event, item: PlayFabClientModels.ItemInstance) {
		const texts: Phaser.GameObjects.Text[] = [];
		texts.push(this.add.text(0, 0, `Name: ${item.DisplayName}`, { fontFamily: fontFamily }));
		texts.push(
			this.add.text(0, 20, `Description: ${this.itemDescriptions[item.DisplayName]}`, {
				fontFamily: fontFamily,
			})
		);
		texts.push(
			this.add.text(0, 40, `Current level: ${item.CustomData["Level"]}`, {
				fontFamily: fontFamily,
			})
		);
		const levels = this.itemLevels[item.DisplayName] as { [key: string]: { Cost: string; Effect: string } };
		Object.keys(levels).forEach((key, i) => {
			const levelText = this.add.text(0, 60 + i * 20, key, { fontFamily: fontFamily });
			const costText = this.add.text(50, 60 + i * 20, `Cost: ${levels[key]["Cost"]}`, { fontFamily: fontFamily });
			const effectText = this.add.text(200, 60 + i * 20, `Effect: ${levels[key]["Effect"]}`, {
				fontFamily: fontFamily,
			});
			texts.push(levelText, costText, effectText);
		});
		const container = this.add.container(pointer.x, pointer.y, texts);
		this.popup = container;
	}

	upgradeItemLevel(item: PlayFabClientModels.ItemInstance) {
		//TODO: if total change is negative, cannot sync newly added snowballs
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
				} // TODO: sometimes popup is destroyed
			);
		});
	}

	sync(func?: () => any) {
		PlayFabClient.UpdateUserData({ Data: { auto: new Date().valueOf().toString() } }, (e, r) => {
			console.log("Last synced result", r);
		});

		const currentTotalSnowballs = this.totalSnowballs;
		const change = currentTotalSnowballs - this.prevTotalSnowballs;
		if (change === 0) {
			console.log("No change to snowballs since last sync");
			if (func !== undefined) {
				func();
			}
		} else {
			this.prevTotalSnowballs = currentTotalSnowballs;
			PlayFabClient.ExecuteCloudScript(
				{
					FunctionName: "addUserVirtualCurrency",
					FunctionParameter: { amount: change, virtualCurrency: "SB" },
				},
				(error, result) => {
					PlayFabClient.ExecuteCloudScript(
						{ FunctionName: "updateStatistics", FunctionParameter: { snowballs: currentTotalSnowballs } },
						() => {
							console.log("Amount of snowballs changed:", change);
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
