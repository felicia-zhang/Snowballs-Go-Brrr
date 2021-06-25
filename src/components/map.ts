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

		this.add
			.text(16, 584, "MENU", textStyle)
			.setOrigin(0, 1)
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => {
				this.scene.start("Menu");
			});
	}

	makeLand(item: PlayFabClientModels.StoreItem) {
		let imageKey: string;
		let x: number;
		let y: number;
		if (item.ItemId === "5") {
			imageKey = "iceCube";
			x = 200;
			y = 300;
		} else if (item.ItemId === "6") {
			imageKey = "lavaCube";
			x = 400;
			y = 300;
		} else if (item.ItemId === "7") {
			imageKey = "sandCube";
			x = 600;
			y = 300;
		}
		this.add
			.image(x, y, imageKey)
			.setScale(0.5)
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => {
				if (this.landItems.has(item.ItemId)) {
					this.showLandOwnedContainer(item, imageKey);
				} else {
					this.showLandNotOwnedContainer(item, imageKey);
				}
			});
		if (!this.landItems.has(item.ItemId)) {
			this.add.image(x, y, "lock").setScale(0.5);
		}
	}

	makeLandOwnedContainer() {
		const overlay = this.add.rectangle(0, 0, 800, 600, 0x000000).setDepth(19).setAlpha(0.6);
		const bg = this.add.existing(new RoundRectangle(this, 0, 0, 520, 300, 15, 0x16252e));
		const image = this.add.image(-115, -10, "iceCube").setScale(0.7);
		const lightBg = this.add.existing(new RoundRectangle(this, 0, 0, 200, 260, 15, 0x2e5767));
		const title = this.add.text(0, -110, "", textStyle).setAlign("center").setOrigin(0.5, 0.5);
		const buttonText = this.add.text(0, 100, "", textStyle).setAlign("center").setOrigin(0.5, 0.5);
		const button = this.add
			.existing(new RoundRectangle(this, 0, 100, 0, 0, 10, 0xc26355))
			.setInteractive({ useHandCursor: true });
		const details = this.add.container(140, 0, [lightBg, title, button, buttonText]);
		const popup = this.add.container(400, 300, [overlay, bg, image, details]).setDepth(30).setAlpha(0);
		const closeButton = this.add
			.image(245, -140, "close")
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
		const overlay = this.add.rectangle(0, 0, 800, 600, 0x000000).setDepth(19).setAlpha(0.6);
		const bg = this.add.existing(new RoundRectangle(this, 0, 0, 520, 300, 15, 0x16252e));
		const lightBg = this.add.existing(new RoundRectangle(this, 0, 0, 200, 260, 15, 0x2e5767));
		const title = this.add.text(0, -110, "", textStyle).setAlign("center").setOrigin(0.5, 0.5);
		const image = this.add.image(-115, -10, "iceCube").setScale(0.7);
		const snowballButtonText = this.add.text(-15, 50, "", textStyle).setAlign("center").setOrigin(0.5, 0.5);
		const snowballButton = this.add
			.existing(new RoundRectangle(this, 0, 50, 0, 0, 10, 0xc26355))
			.setInteractive({ useHandCursor: true });
		const snowballIcon = this.add.image(0, 50, "snowball").setScale(0.15);
		const icicleButtonText = this.add.text(-15, 100, "", textStyle).setAlign("center").setOrigin(0.5, 0.5);
		const icicleButton = this.add
			.existing(new RoundRectangle(this, 0, 100, 0, 0, 10, 0xc26355))
			.setInteractive({ useHandCursor: true });
		const icicleIcon = this.add.image(0, 100, "icicle").setScale(0.15);
		const details = this.add.container(140, 0, [
			lightBg,
			title,
			snowballButton,
			snowballButtonText,
			snowballIcon,
			icicleButton,
			icicleButtonText,
			icicleIcon,
		]);
		const popup = this.add.container(400, 300, [overlay, bg, image, details]).setDepth(30).setAlpha(0);
		const closeButton = this.add
			.image(245, -140, "close")
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
		const details = this.landOwnedContainer.getAt(3) as Phaser.GameObjects.Container;
		const title = details.getAt(1) as Phaser.GameObjects.Text;
		title.setText(`${landDetail.DisplayName.toUpperCase()}`);
		const buttonText = details.getAt(3) as Phaser.GameObjects.Text;
		buttonText.setText("VISIT");
		const button = details.getAt(2) as RoundRectangle;
		button.width = buttonText.width + 16;
		button.height = buttonText.height + 16;
		button.on("pointerup", () => {
			this.scene.start("Game");
		});
		const image = this.landOwnedContainer.getAt(2) as Phaser.GameObjects.Image;
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
		const details = this.landNotOwnedContainer.getAt(3) as Phaser.GameObjects.Container;
		const title = details.getAt(1) as Phaser.GameObjects.Text;
		title.setText(`${landDetail.DisplayName.toUpperCase()}`);
		const snowballButtonText = details.getAt(3) as Phaser.GameObjects.Text;
		snowballButtonText.setText(`${landDetail.SnowballPrice} x`);
		const snowballButton = details.getAt(2) as RoundRectangle;
		snowballButton.width = snowballButtonText.width + 50;
		snowballButton.height = snowballButtonText.height + 16;
		snowballButton.on("pointerup", () => {
			console.log("snowball price");
		});
		const snowballIcon = details.getAt(4) as Phaser.GameObjects.Image;
		snowballIcon.setX((snowballButtonText.width + 10) / 2);
		const icicleButtonText = details.getAt(6) as Phaser.GameObjects.Text;
		icicleButtonText.setText(`${landDetail.IciclePrice} x`);
		const icicleButton = details.getAt(5) as RoundRectangle;
		icicleButton.width = icicleButtonText.width + 50;
		icicleButton.height = icicleButtonText.height + 16;
		icicleButton.on("pointerup", () => {
			console.log("icicle price");
		});
		const icicleIcon = details.getAt(7) as Phaser.GameObjects.Image;
		icicleIcon.setX((icicleButtonText.width + 5) / 2);
		const image = this.landNotOwnedContainer.getAt(2) as Phaser.GameObjects.Image;
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
