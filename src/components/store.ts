import * as PlayFab from "playfab-sdk/Scripts/PlayFab/PlayFabClient.js";
import { PlayFabClient } from "playfab-sdk";
import { fontFamily } from "../utils/font";
import GameScene from "./game";

class StoreScene extends Phaser.Scene {
	items: PlayFab.CatalogItem[];
	snowballText: Phaser.GameObjects.Text;
	gameScene: GameScene;
	constructor() {
		super("Store");
	}

	create() {
		this.gameScene = this.scene.get("Game") as GameScene;
		this.add.image(400, 300, "sky");
		this.snowballText = this.add.text(16, 16, "", { fontFamily: fontFamily });
		const store = this;
		PlayFabClient.GetCatalogItems({ CatalogVersion: "1" }, (error, result) => {
			store.items = result.data.Catalog;
			store.items.forEach((item: PlayFabClientModels.CatalogItem, i) => {
				const nameText = store.add.text(200, 200 + i * 30, item.DisplayName, { fontFamily: fontFamily });
				store.add.text(16, 200 + i * 30, `${item.VirtualCurrencyPrices.SB} Snowballs`, {
					fontFamily: fontFamily,
				});
				nameText.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
					const price = item.VirtualCurrencyPrices.SB;
					PlayFabClient.PurchaseItem({ ItemId: item.ItemId, Price: price, VirtualCurrency: "SB" }, (e, r) => {
						if (e !== null) {
							console.log(e);
						} else {
							this.gameScene.totalSnowballs -= price;
							// TODO: add item in gamescene
							PlayFabClient.ExecuteCloudScript(
								{
									FunctionName: "updateItemLevel",
									FunctionParameter: {
										cost: "0",
										instanceId: r.data.Items[0].ItemInstanceId,
										level: "1",
									},
								},
								(a, b) => console.log("Update item level to 1 result:", b)
							);
						}
					});
				});
			});
		});

		this.add.text(300, 9, "STORE", { fontFamily: fontFamily });

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
}

export default StoreScene;
