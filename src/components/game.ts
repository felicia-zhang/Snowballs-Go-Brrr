import { PlayFabClient } from "playfab-sdk";
import { fontFamily } from "../utils/font";

const SYNC_DELAY = 60000;
const PENGUIN_DELAY = 3000;
const FISHIE_DELAY = 30000;

class GameScene extends Phaser.Scene {
	totalSnowballs: number = 0;
	prevTotalSnowballs: number = 0;
	timerEvent: Phaser.Time.TimerEvent;
	items: { [key: string]: PlayFabClientModels.ItemInstance[] };
	itemDescriptions = { Penguin: "", Igloo: "", Torch: "", Fishie: "" };
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
		this.items = { Penguin: [], Igloo: [], Torch: [], Fishie: [] };
	}

	create() {
		this.anims.create({
			key: "bounce",
			frames: [{ key: "penguin3" }, { key: "penguin2" }, { key: "penguin1" }, { key: "penguin2" }],
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
			const inventory: PlayFabClientModels.ItemInstance[] = result.data.Inventory;
			const sb = result.data.VirtualCurrency.SB;
			scene.totalSnowballs = sb;
			scene.prevTotalSnowballs = sb;
			inventory.forEach((inventory, i) => {
				const index = this.items[inventory.DisplayName].length;
				this.items[inventory.DisplayName].push(inventory);
				let image;
				if (inventory.DisplayName === "Penguin") {
					image = scene.add
						.sprite(index * 120, 60, "penguin3")
						.setOrigin(0, 0)
						.setScale(0.3)
						.setInteractive({ useHandCursor: true })
						.on("pointerup", (pointer: Phaser.Input.Pointer) => {
							if (pointer.leftButtonReleased()) {
								image.anims.play("bounce");
								image.disableInteractive();
								scene.time.addEvent({
									delay: PENGUIN_DELAY,
									callback() {
										image.anims.pause();
										image.setInteractive({ useHandCursor: true });
										scene.totalSnowballs += 1;
									},
									callbackScope: this,
								});
							}
						});
				} else if (inventory.DisplayName === "Igloo") {
					image = scene.add
						.image(index * 220, 210, "igloo")
						.setOrigin(0, 0)
						.setScale(0.3)
						.setInteractive();
				} else if (inventory.DisplayName === "Torch") {
					image = scene.add
						.image(index * 70, 360, "fire")
						.setOrigin(0, 0)
						.setScale(0.3)
						.setInteractive();
				} else if (inventory.DisplayName === "Fishie") {
					image = scene.add
						.image(index * 120, 460, "fish")
						.setOrigin(0, 0)
						.setScale(0.3)
						.setInteractive();
					this.time.addEvent({
						delay: FISHIE_DELAY,
						loop: true,
						callback: () => {
							console.log(`${inventory.ItemInstanceId} added 1 snowball`);
							this.totalSnowballs++;
						},
					});
				}
				image
					.on("pointerover", (pointer: Phaser.Input.Pointer, localX, localY, event) =>
						this.showDetails(pointer, localX, localY, event, inventory)
					)
					.on("pointerout", (pointer: Phaser.Input.Pointer, event) => {
						this.popup.destroy(true);
					})
					.on("pointerup", (pointer: Phaser.Input.Pointer) => {
						if (pointer.rightButtonReleased()) {
							this.upgradeItemLevel(inventory);
						}
					});
			});

			PlayFabClient.GetUserData({ Keys: ["auto"] }, (error, result) => {
				if (result.data.Data["auto"] !== undefined) {
					const lastUpdated = result.data.Data["auto"].Value;
					const elapsed = new Date().valueOf() - Number(lastUpdated);
					const elapsedSeconds = elapsed / 1000;
					console.log("Elapsed seconds:", elapsedSeconds);
					const sb = Math.floor(elapsedSeconds / (FISHIE_DELAY / 1000)) * this.items["Fishie"].length;
					this.totalSnowballs += sb;
					console.log("Amount of snowballs added by Fishies while player was gone", sb);
				}
			});
		});

		this.timerEvent = this.time.addEvent({
			delay: SYNC_DELAY,
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

	showDetails(pointer: Phaser.Input.Pointer, localX, localY, event, item: PlayFabClientModels.ItemInstance) {
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
					//update UI for item current level
				}
			);
		});
	}

	sync(transition?: () => any) {
		PlayFabClient.UpdateUserData({ Data: { auto: new Date().valueOf().toString() } }, (e, r) => {
			console.log("Last synced result", r);
		});

		const currentTotalSnowballs = this.totalSnowballs;
		const change = currentTotalSnowballs - this.prevTotalSnowballs;
		if (change === 0) {
			console.log("No change to snowballs since last sync");
			if (transition !== undefined) {
				transition();
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
							if (transition !== undefined) {
								transition();
							}
						}
					);
				}
			);
		}
	}
}

export default GameScene;
