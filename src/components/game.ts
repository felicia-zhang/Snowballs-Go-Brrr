import { Data } from "phaser";
import { PlayFabClient } from "playfab-sdk";
import { fontFamily } from "../utils/font";

class GameScene extends Phaser.Scene {
	totalSnowballs: number = 0;
	prevTotalSnowballs: number = 0;
	timerEvent: Phaser.Time.TimerEvent;
	items;
	snowballText;
	clickMultiplier: number = 1;

	constructor() {
		super("Game");
	}

	init() {
		PlayFabClient.GetUserData({ Keys: ["auto"] }, (error, result) => {
			if (result.data.Data["auto"] !== undefined) {
				const lastUpdated = result.data.Data["auto"].Value;
				const elapsed = new Date().valueOf() - Number(lastUpdated);
				const elapsedSeconds = elapsed / 1000;
			}
		});

		this.add.image(400, 300, "sky");
		this.items = { Penguin: [], Igloo: [], Torch: [] };
		const scene = this;
		const GetInventoryCallback = (error, result) => {
			const inventory: PlayFabClientModels.ItemInstance[] = result.data.Inventory;
			const sb = result.data.VirtualCurrency.SB;
			scene.totalSnowballs = sb;
			scene.prevTotalSnowballs = sb;
			inventory.forEach((inventory, i) => {
				const index = this.items[inventory.DisplayName].length;
				this.items[inventory.DisplayName].push(inventory);
				if (inventory.DisplayName === "Penguin") {
					scene.add
						.image(index * 120, 100, "penguin3")
						.setOrigin(0, 0)
						.setScale(0.3);
				} else if (inventory.DisplayName === "Igloo") {
					scene.add
						.image(index * 220, 250, "igloo")
						.setOrigin(0, 0)
						.setScale(0.3);
				} else if (inventory.DisplayName === "Torch") {
					scene.add
						.image(index * 70, 400, "fire")
						.setOrigin(0, 0)
						.setScale(0.3);
				}
			});
		};
		// TODO: cloud script and getUserInventory have duplicated API call
		PlayFabClient.GetUserInventory({}, GetInventoryCallback);
	}

	create() {
		this.scene.launch("Popup");
		this.snowballText = this.add.text(16, 16, `Snowballs: ${this.totalSnowballs}`, { fontFamily: fontFamily });

		this.timerEvent = this.time.addEvent({
			delay: 10000,
			loop: true,
			callback: () => this.sync(),
		});

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

	upgradeItemLevel(item: PlayFabClientModels.ItemInstance) {
		const newLevel = Number(item.CustomData["Level"]) + 1;
		PlayFabClient.ExecuteCloudScript(
			{
				FunctionName: "updateItemLevel",
				FunctionParameter: { itemId: item.ItemId, instanceId: item.ItemInstanceId, level: newLevel },
			},
			(error, result) => {
				console.log(result);
			}
		);
	}

	sync(transition?: () => any) {
		PlayFabClient.UpdateUserData({ Data: { auto: new Date().valueOf().toString() } }, (e, r) => {
			console.log(r);
		});

		const currentTotalSnowballs = this.totalSnowballs;
		const change = currentTotalSnowballs - this.prevTotalSnowballs;
		if (change === 0) {
			console.log("no change");
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
							console.log(change);
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
