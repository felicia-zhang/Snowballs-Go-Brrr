import { PlayFabClient } from "playfab-sdk";
import { textStyle } from "../utils/font";
import LandDetail from "../utils/types";
import AScene from "./AScene";

class MapScene extends AScene {
	landsMap: { [key: number]: LandDetail };

	constructor() {
		super("Map");
	}

	create() {
		this.add.image(400, 300, "sky");
		this.landsMap = {};
		this.add.text(400, 16, "Map", textStyle).setOrigin(0.5, 0.5).setAlign("center");

		PlayFabClient.GetCatalogItems({ CatalogVersion: "1" }, (error, result) => {
			result.data.Catalog.filter((item: PlayFabClientModels.CatalogItem) => item.ItemClass === "land").forEach(
				(item: PlayFabClientModels.CatalogItem) => {
					this.landsMap[item.ItemId] = {
						ItemId: item.ItemId,
						SnowballPrice: item.VirtualCurrencyPrices.SB,
						IciclePrice: item.VirtualCurrencyPrices.IC,
						DisplayName: item.DisplayName,
					};
				}
			);

			PlayFabClient.GetStoreItems({ StoreId: "Land" }, (error, result) => {
				result.data.Store.forEach((storeItem: PlayFabClientModels.StoreItem) => {
					this.makeLand(storeItem);
				});
			});
		});

		this.add
			.text(784, 584, "GAME", textStyle)
			.setOrigin(1, 1)
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => {
				this.scene.start("Game");
			});
	}

	makeLand(item: PlayFabClientModels.StoreItem) {
		console.log(this.landsMap[item.ItemId]);
	}

	update() {
		if (!PlayFabClient.IsClientLoggedIn()) {
			this.scene.start("Signin");
		}
	}
}

export default MapScene;
