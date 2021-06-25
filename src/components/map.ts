import { PlayFabClient } from "playfab-sdk";
import { textStyle } from "../utils/font";
import LandDetail from "../utils/types";
import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";
import AScene from "./AScene";

class MapScene extends AScene {
	landsMap: { [key: number]: LandDetail };
	landItems: Set<string>;
	landOwnedContainer: Phaser.GameObjects.Container;
	landNotOwnedContainer: Phaser.GameObjects.Container;

	constructor() {
		super("Map");
	}

	create() {
		this.add.image(400, 300, "sky");
		this.landsMap = {};
		this.landItems = new Set();
		this.add.text(400, 16, "Map", textStyle).setOrigin(0.5, 0.5).setAlign("center");
		this.makeLandOwnedContainer();
		this.makeLandNotOwnedContainer();

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

			PlayFabClient.GetUserInventory({}, (error, result) => {
				const inventories: PlayFabClientModels.ItemInstance[] = result.data.Inventory;
				inventories
					.filter((inventory: PlayFabClientModels.ItemInstance) => inventory.ItemClass === "land")
					.forEach(inventory => this.landItems.add(inventory.ItemId));

				PlayFabClient.GetStoreItems({ StoreId: "Land" }, (error, result) => {
					result.data.Store.forEach((storeItem: PlayFabClientModels.StoreItem) => {
						this.makeLand(storeItem);
					});
				});
			});
		});
	}

	makeLand(item: PlayFabClientModels.StoreItem) {
		let imageKey: string;
		let image: Phaser.GameObjects.Image;
		if (item.ItemId === "5") {
			imageKey = "iceCube";
			image = this.add.image(200, 300, imageKey);
		} else if (item.ItemId === "6") {
			imageKey = "lavaCube";
			image = this.add.image(400, 300, imageKey);
		} else if (item.ItemId === "7") {
			imageKey = "sandCube";
			image = this.add.image(600, 300, imageKey);
		}
		image
			.setScale(0.5)
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => {
				if (this.landItems.has(item.ItemId)) {
					this.showLandOwnedContainer(item, imageKey);
				} else {
					this.showLandNotOwnedContainer(item, imageKey);
				}
			});
	}

	makeLandOwnedContainer() {
		const bg = this.add.existing(new RoundRectangle(this, 0, 0, 500, 400, 15, 0x16252e));
		const title = this.add.text(0, -130, "", textStyle).setAlign("center").setOrigin(0.5, 0.5);
		const image = this.add.image(0, -10, "iceCube").setScale(0.7);
		const buttonText = this.add.text(0, 130, "", textStyle).setAlign("center").setOrigin(0.5, 0.5);
		const button = this.add
			.existing(new RoundRectangle(this, 0, 130, 0, 0, 10, 0xc26355))
			.setInteractive({ useHandCursor: true });
		const popup = this.add.container(400, 300, [bg, title, button, buttonText, image]).setDepth(30).setAlpha(0);
		const closeButton = this.add
			.image(115, -160, "close")
			.setScale(0.35)
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => {
				this.add.tween({
					targets: [this.landOwnedContainer],
					ease: "Sine.easeIn",
					duration: 100,
					alpha: 0,
					onComplete: () => {
						// this.interactiveCurrencyObjets.forEach(object =>
						// 	object.setInteractive({ useHandCursor: true })
						// );
						// button.removeAllListeners();
					},
					callbackScope: this,
				});
			});
		popup.add(closeButton);
		this.landOwnedContainer = popup;
	}

	makeLandNotOwnedContainer() {
		const bg = this.add.existing(new RoundRectangle(this, 0, 0, 500, 400, 15, 0x16252e));
		const title = this.add.text(0, -130, "", textStyle).setAlign("center").setOrigin(0.5, 0.5);
		const image = this.add.image(0, -10, "iceCube").setScale(0.7);
		const snowballButtonText = this.add.text(0, 130, "", textStyle).setAlign("center").setOrigin(0.5, 0.5);
		const snowballButton = this.add
			.existing(new RoundRectangle(this, 0, 130, 0, 0, 10, 0xc26355))
			.setInteractive({ useHandCursor: true });
		const icicleButtonText = this.add.text(0, 130, "", textStyle).setAlign("center").setOrigin(0.5, 0.5);
		const icicleButton = this.add
			.existing(new RoundRectangle(this, 0, 130, 0, 0, 10, 0xc26355))
			.setInteractive({ useHandCursor: true });
		const popup = this.add
			.container(400, 300, [bg, title, snowballButton, snowballButtonText, icicleButton, icicleButtonText, image])
			.setDepth(30)
			.setAlpha(0);
		const closeButton = this.add
			.image(115, -160, "close")
			.setScale(0.35)
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => {
				this.add.tween({
					targets: [this.landNotOwnedContainer],
					ease: "Sine.easeIn",
					duration: 100,
					alpha: 0,
					onComplete: () => {
						// this.interactiveCurrencyObjets.forEach(object =>
						// 	object.setInteractive({ useHandCursor: true })
						// );
						// button.removeAllListeners();
					},
					callbackScope: this,
				});
			});
		popup.add(closeButton);
		this.landNotOwnedContainer = popup;
	}

	showLandOwnedContainer(item: PlayFabClientModels.StoreItem, imageKey: string) {
		const landDetail: LandDetail = this.landsMap[item.ItemId];
		const title = this.landOwnedContainer.getAt(1) as Phaser.GameObjects.Text;
		title.setText(`${landDetail.DisplayName.toUpperCase()}`);
		const buttonText = this.landOwnedContainer.getAt(3) as Phaser.GameObjects.Text;
		buttonText.setText("GO");
		const button = this.landOwnedContainer.getAt(2) as RoundRectangle;
		button.width = buttonText.width + 16;
		button.height = buttonText.height + 16;
		button.on("pointerup", () => {
			this.scene.start("Game");
		});
		const image = this.landOwnedContainer.getAt(4) as Phaser.GameObjects.Image;
		image.setTexture(imageKey);
		this.add.tween({
			targets: [this.landOwnedContainer],
			ease: "Sine.easeIn",
			duration: 500,
			alpha: 1,
			callbackScope: this,
		});
	}

	showLandNotOwnedContainer(item: PlayFabClientModels.StoreItem, imageKey: string) {
		const landDetail: LandDetail = this.landsMap[item.ItemId];
		const title = this.landNotOwnedContainer.getAt(1) as Phaser.GameObjects.Text;
		title.setText(`${landDetail.DisplayName.toUpperCase()}`);
		const snowballButtonText = this.landNotOwnedContainer.getAt(3) as Phaser.GameObjects.Text;
		snowballButtonText.setText(`${landDetail.SnowballPrice}`);
		const snowballButton = this.landNotOwnedContainer.getAt(2) as RoundRectangle;
		snowballButton.width = snowballButtonText.width + 16;
		snowballButton.height = snowballButtonText.height + 16;
		snowballButton.on("pointerup", () => {
			console.log("snowball price");
		});
		const icicleButtonText = this.landNotOwnedContainer.getAt(5) as Phaser.GameObjects.Text;
		icicleButtonText.setText(`${landDetail.IciclePrice}`);
		const icicleButton = this.landNotOwnedContainer.getAt(4) as RoundRectangle;
		icicleButton.width = icicleButtonText.width + 16;
		icicleButton.height = icicleButtonText.height + 16;
		icicleButton.on("pointerup", () => {
			console.log("icicle price");
		});
		const image = this.landNotOwnedContainer.getAt(6) as Phaser.GameObjects.Image;
		image.setTexture(imageKey);
		this.add.tween({
			targets: [this.landNotOwnedContainer],
			ease: "Sine.easeIn",
			duration: 500,
			alpha: 1,
			callbackScope: this,
		});
	}

	update() {
		if (!PlayFabClient.IsClientLoggedIn()) {
			this.scene.start("Signin");
		}
	}
}

export default MapScene;
