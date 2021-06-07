import { PlayFabClient } from "playfab-sdk";
import { fontFamily } from "../utils/font";
import BaseItem from "../items/BaseItem";
import Penguin from "../items/Penguin";

class GameScene extends Phaser.Scene {
	totalSnowballs: number = 0;
	prevTotalSnowballs: number = 0;
	timerEvent: Phaser.Time.TimerEvent;
	items = [];
	snowballText;
	clickMultiplier: number = 1;

	constructor() {
		super("Game");
	}

	init() {
		this.game.input.mouse.disableContextMenu();
		this.add.image(400, 300, "sky");
		const scene = this;
		const GetInventoryCallback = (error, result) => {
			const inventory: PlayFabClientModels.ItemInstance[] = result.data.Inventory;
			const sb = result.data.VirtualCurrency.SB;
			scene.totalSnowballs = sb;
			scene.prevTotalSnowballs = sb;
			inventory.forEach((inventory, i) => {
				const level = this.add.text(20, 20, `Current level: ${inventory.CustomData["Level"]}`, {
					fontFamily: fontFamily,
				});
				const name = this.add.text(20, 60, `Name: ${inventory.DisplayName}`, { fontFamily: fontFamily });
				const container = this.add.container(1000, 0, [level, name]);

				const key = i.toString();
				let draggable: BaseItem;
				if (inventory.DisplayName === "Penguin") {
					const sprite = this.add.sprite(100, 100, "penguin3").setScale(0.3);
					draggable = new Penguin(key, sprite, inventory, container);
				} else if (inventory.DisplayName === "Igloo") {
					const sprite = this.add.sprite(100, 100, "igloo").setScale(0.3);
					draggable = new BaseItem(key, sprite, inventory, container);
				} else if (inventory.DisplayName === "Torch") {
					const sprite = this.add.sprite(100, 100, "fire").setScale(0.3);
					draggable = new BaseItem(key, sprite, inventory, container);
				}
				scene.scene.add(key, draggable);
			});
		};
		// TODO: cloud script and getUserInventory have duplicated API call
		PlayFabClient.GetUserInventory({}, GetInventoryCallback);
	}

	create() {
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
