import * as PlayFab from "playfab-sdk/Scripts/PlayFab/PlayFabClient.js";
import { PlayFabClient } from "playfab-sdk";
import penguin1 from "../assets/penguin1.png";
import penguin2 from "../assets/penguin2.png";
import penguin3 from "../assets/penguin3.png";
import { fontFamily } from "../utils/font";
import Torch from "../items/Torch";
import Friend from "../items/Friend";
import Igloo from "../items/Igloo";
import buildItem from "../items/ItemFactory";

class GameScene extends Phaser.Scene {
	player: any;
	totalClick: number = 0;
	prevTotalClick: number = 0;
	timerEvent: Phaser.Time.TimerEvent;
	items = [];
	clickText;
	clickMultiplier: number = 1;

	constructor() {
		super("Game");
	}

	// TODO: need to sync inventory custom data every time

	init() {
		this.add.image(400, 300, "sky");
		const scene = this;
		const GetInventoryCallback = function (error, result) {
			const inventory: PlayFab.ItemInstance[] = result.data.Inventory;
			inventory.forEach((inventory, i) => {
				scene.add.existing(buildItem(inventory, scene, 300, 100 + i * 150)).setScale(0.3);
			});
		};

		PlayFabClient.GetUserInventory({}, GetInventoryCallback);
	}

	preload() {
		this.load.image("penguin1", penguin1, { frameWidth: 355, frameHeight: 450 } as PlayFab.ImageFrameConfig);
		this.load.image("penguin2", penguin2, { frameWidth: 355, frameHeight: 450 } as PlayFab.ImageFrameConfig);
		this.load.image("penguin3", penguin3, { frameWidth: 355, frameHeight: 450 } as PlayFab.ImageFrameConfig);
	}

	create() {
		this.player = this.add.sprite(100, 450, "penguin3").setScale(0.3);

		this.clickText = this.add.text(16, 16, `click: ${this.totalClick}`, { fontFamily: fontFamily });

		this.player.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
			this.totalClick += this.clickMultiplier;
		});
		this.anims.create({
			key: "bounce",
			frames: [{ key: "penguin3" }, { key: "penguin2" }, { key: "penguin1" }, { key: "penguin2" }],
			frameRate: 8,
			repeat: -1,
		});
		this.player.anims.play("bounce");

		this.timerEvent = this.time.addEvent({
			delay: 10000,
			loop: true,
			callback: () => this.sync(),
		});

		const storeButton = this.add.text(700, 400, "store", { fontFamily: fontFamily });
		storeButton.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
			this.sync(() => this.scene.start("Store"));
		});

		const leaderboardButton = this.add.text(700, 450, "leaderboard", { fontFamily: fontFamily });
		leaderboardButton.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
			this.sync(() => this.scene.start("Leaderboard"));
		});
	}

	update() {
		this.clickText.setText(`click: ${this.totalClick}`);
	}

	sync(transition?: () => any) {
		const currentTotalClick = this.totalClick;
		const change = currentTotalClick - this.prevTotalClick;
		if (change === 0) {
			console.log("no change");
			if (transition !== undefined) {
				transition();
			}
		} else {
			this.prevTotalClick = currentTotalClick;
			PlayFabClient.ExecuteCloudScript(
				{
					FunctionName: "addUserVirtualCurrency",
					FunctionParameter: { amount: change, virtualCurrency: "CL" },
				},
				(error, result) => {
					PlayFabClient.ExecuteCloudScript(
						{ FunctionName: "updateStatistics", FunctionParameter: { clicks: currentTotalClick } },
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
