import * as PlayFab from "playfab-sdk/Scripts/PlayFab/PlayFabClient.js";
import { PlayFabClient } from "playfab-sdk";
import { fontFamily } from "../utils/font";
import buildItem from "../items/buildItem";
import PopupScene from "./popup";
import BaseItem from "../items/BaseItem";

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
		this.add.image(400, 300, "sky");
		const scene = this;
		const GetInventoryCallback = function (error, result) {
			const inventory: PlayFab.ItemInstance[] = result.data.Inventory;
			inventory.forEach((inventory, i) => {
				scene.add.existing(buildItem(inventory, scene, 300, 100 + i * 150)).setScale(0.3);
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

	getDetails(item: BaseItem) {
		const popup = this.scene.get("Popup") as PopupScene;
		popup.showDetails(item);
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
