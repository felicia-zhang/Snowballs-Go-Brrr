import * as PlayFab from "playfab-sdk/Scripts/PlayFab/PlayFabClient.js";
import { PlayFabClient } from "playfab-sdk";
import { fontFamily } from "../utils/font";

class StoreScene extends Phaser.Scene {
	items: PlayFab.CatalogItem[];
	snowballText: Phaser.GameObjects.Text;
	snowballs: number;
	constructor() {
		super("Store");
		this.items = [];
	}

	create() {
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
					store.snowballText.setText(`Snowballs: ${(store.snowballs -= price)}`);
					PlayFabClient.PurchaseItem({ ItemId: item.ItemId, Price: price, VirtualCurrency: "SB" }, (e, r) => {
						PlayFabClient.ExecuteCloudScript(
							{
								FunctionName: "updateItemLevel",
								FunctionParameter: {
									itemId: r.data.Items[0].ItemId,
									instanceId: r.data.Items[0].ItemInstanceId,
									level: "1",
								},
							},
							(a, b) => console.log("Update item level to 1 result:", b)
						);
					});
				});
			});
		});

		PlayFabClient.GetUserInventory({}, (error, result) => {
			store.snowballs = result.data.VirtualCurrency.SB;
			store.snowballText.setText(`Snowballs: ${store.snowballs}`);
		});

		this.add.text(300, 9, "STORE", { fontFamily: fontFamily });

		this.add
			.text(700, 450, "GAME", { fontFamily: fontFamily })
			.setInteractive({ useHandCursor: true })
			.on("pointerdown", () => {
				this.scene.start("Game");
			});
	}

	update() {
		if (!PlayFabClient.IsClientLoggedIn()) {
			this.scene.start("Signin");
		}
	}
}

export default StoreScene;
