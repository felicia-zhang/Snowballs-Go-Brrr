import * as PlayFab from "playfab-sdk/Scripts/PlayFab/PlayFabClient.js";
import { PlayFabClient } from "playfab-sdk";
import { fontFamily } from "../utils/font";

class StoreScene extends Phaser.Scene {
	items: PlayFab.CatalogItem[];
	inventory: PlayFab.ItemInstance[];
	snowballText: any;
	snowballs: number;
	constructor() {
		super("Store");
		this.items = [];
		this.inventory = [];
	}

	create() {
		this.add.image(400, 300, "sky");
		this.snowballText = this.add.text(16, 16, "", { fontFamily: fontFamily });
		const store = this;
		const GetCatalogItemsCallback = (error, result) => {
			store.items = result.data.Catalog;
			store.items.forEach((item, i) => {
				const nameText = store.add.text(200, 200 + i * 30, item.DisplayName, { fontFamily: fontFamily });
				store.add.text(16, 200 + i * 30, `${item.VirtualCurrencyPrices.SB} Snowballs`, {
					fontFamily: fontFamily,
				});
				if (item.CustomData !== undefined && JSON.parse(item.CustomData).hasOwnProperty("image")) {
					const customData = JSON.parse(item.CustomData);
					store.add.sprite(160, 200 + i * 30, customData["image"]).setScale(0.3);
				}
				nameText.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
					const price = item.VirtualCurrencyPrices.SB;
					store.snowballText.setText(`Snowballs: ${(store.snowballs -= price)}`);
					PlayFabClient.PurchaseItem(
						{ ItemId: item.ItemId, Price: price, VirtualCurrency: "SB" },
						(error, result) => {
							PlayFabClient.ExecuteCloudScript(
								{
									FunctionName: "UpdateInventoryItemCustomData",
									FunctionParameter: { instanceId: result.data.Items[0].ItemInstanceId, level: 1 },
								},
								() => {}
							);
						}
					);
				});
			});
		};

		// PlayFabClient.GetPlayerSegments()
		// PlayFabClient.GetStoreItems()
		PlayFabClient.GetCatalogItems({ CatalogVersion: "1" }, GetCatalogItemsCallback);

		const GetInventoryCallback = (error, result) => {
			store.inventory = result.data.inventory;
			store.snowballs = result.data.VirtualCurrency.SB;
			store.snowballText.setText(`Snowballs: ${store.snowballs}`);
		};

		PlayFabClient.GetUserInventory({}, GetInventoryCallback);
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
