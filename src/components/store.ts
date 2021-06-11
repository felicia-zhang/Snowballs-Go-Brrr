import * as PlayFab from "playfab-sdk/Scripts/PlayFab/PlayFabClient.js";
import { PlayFabClient } from "playfab-sdk";
import { fontFamily } from "../utils/font";
import GameScene from "./game";

class StoreScene extends Phaser.Scene {
	durableItems: PlayFabClientModels.CatalogItem[] = [];
	consumableItems: PlayFabClientModels.CatalogItem[] = [];
	snowballText: Phaser.GameObjects.Text;
	gameScene: GameScene;
	popup: Phaser.GameObjects.Container;
	constructor() {
		super("Store");
	}

	create() {
		this.gameScene = this.scene.get("Game") as GameScene;
		this.add.image(400, 300, "sky");
		this.makePopup();
		this.snowballText = this.add.text(16, 16, "", { fontFamily: fontFamily });
		//TODO: change to store items
		PlayFabClient.GetCatalogItems({ CatalogVersion: "1" }, (error, result) => {
			result.data.Catalog.forEach(item => this.makeIcon(item));
		});

		this.add.text(300, 9, "STORE", { fontFamily: fontFamily });

		this.add.text(20, 70, "Consumable Items", { fontFamily: fontFamily });

		this.add.text(20, 170, "Durable Items", { fontFamily: fontFamily });

		this.add
			.text(700, 450, "GAME", { fontFamily: fontFamily })
			.setInteractive({ useHandCursor: true })
			.on("pointerdown", () => {
				this.scene.bringToTop("Game");
			});
	}

	update() {
		this.snowballText.setText(`Snowballs: ${this.gameScene.totalSnowballs}`);
		if (!PlayFabClient.IsClientLoggedIn()) {
			this.scene.start("Signin");
		}
	}

	makeIcon(item: PlayFabClientModels.CatalogItem) {
		let index;
		if (item.Consumable !== undefined && item.Consumable.UsageCount !== undefined) {
			index = this.consumableItems.length;
			this.consumableItems.push(item);
		} else {
			index = this.durableItems.length;
			this.durableItems.push(item);
		}
		let image: Phaser.GameObjects.Image;
		if (item.DisplayName === "Penguin") {
			image = this.add
				.image(20 + 100 * index, 200, "penguin3")
				.setOrigin(0, 0)
				.setScale(0.1);
		} else if (item.DisplayName === "Igloo") {
			image = this.add
				.image(20 + 100 * index, 200, "igloo")
				.setOrigin(0, 0)
				.setScale(0.1);
		} else if (item.DisplayName === "Torch") {
			image = this.add
				.image(20 + 100 * index, 100, "fire2")
				.setOrigin(0, 0)
				.setScale(0.1);
		} else if (item.DisplayName === "Fishie") {
			image = this.add
				.image(20 + 100 * index, 100, "fish")
				.setOrigin(0, 0)
				.setScale(0.1);
		}
		image
			.setInteractive({ useHandCursor: true })
			.on("pointerover", (pointer: Phaser.Input.Pointer, localX, localY, event) =>
				this.showItemDetails(pointer, localX, localY, event, item)
			)
			.on("pointerout", (pointer: Phaser.Input.Pointer, event) => {
				const levelsContainer = this.popup.getAt(3) as Phaser.GameObjects.Container;
				levelsContainer.removeAll(true);
				this.popup.setVisible(false);
			})
			.on("pointerup", (pointer: Phaser.Input.Pointer) => {
				this.gameScene.sync(() => this.purchaseItem(item));
			});
	}

	purchaseItem(item: PlayFabClientModels.CatalogItem) {
		const price = item.VirtualCurrencyPrices.SB;
		PlayFabClient.PurchaseItem({ ItemId: item.ItemId, Price: price, VirtualCurrency: "SB" }, (e, r) => {
			if (e !== null) {
				console.log(e);
			} else {
				this.gameScene.totalSnowballs -= price;
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
						console.log("Update item level to 1 result:", newItem);
						this.gameScene.makeItem(newItem);
					}
				);
			}
		});
	}

	makePopup() {
		const nameText = this.add.text(0, 0, "", { fontFamily: fontFamily });
		const descriptionText = this.add.text(0, 20, "", { fontFamily: fontFamily });
		const priceText = this.add.text(0, 40, "", { fontFamily: fontFamily });
		const levelsContainer = this.add.container(0, 60, []);
		const container = this.add.container(0, 0, [nameText, descriptionText, priceText, levelsContainer]);
		this.popup = container;
		this.popup.setVisible(false);
		this.popup.setDepth(1);
	}

	showItemDetails(pointer: Phaser.Input.Pointer, localX, localY, event, item: PlayFabClientModels.CatalogItem) {
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
}

export default StoreScene;
