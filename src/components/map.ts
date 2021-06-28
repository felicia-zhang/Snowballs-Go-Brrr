import { PlayFabClient } from "playfab-sdk";
import { fontFamily, smallFontSize, textStyle } from "../utils/font";
import BiomeDetail from "../utils/types";
import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";
import AScene from "./AScene";

class MapScene extends AScene {
	biomeMap: { [key: number]: BiomeDetail };
	biomeItems: { [key: number]: { Mittens: 0; Bonfire: 0; Snowman: 0; "Igloo Factory": 0; "Arctic Vault": 0 } };
	snowballText: Phaser.GameObjects.Text;
	snowballIcon: Phaser.GameObjects.Image;
	icicleText: Phaser.GameObjects.Text;
	icicleIcon: Phaser.GameObjects.Image;
	biomeOwnedContainer: Phaser.GameObjects.Container;
	biomeNotOwnedContainer: Phaser.GameObjects.Container;
	interactiveMapObjects: Phaser.GameObjects.GameObject[];
	storeId: string;

	constructor() {
		super("Map");
	}

	create() {
		this.add.image(400, 300, "sky");
		this.biomeMap = {};
		this.biomeItems = {};
		this.interactiveMapObjects = [];
		this.add.text(400, 16, "Map", textStyle).setOrigin(0.5, 0.5).setAlign("center");
		this.makeBiomeOwnedContainer();
		this.makeBiomeNotOwnedContainer();

		this.registry
			.get("CatalogItems")
			.filter((item: PlayFabClientModels.CatalogItem) => item.ItemClass === "biome")
			.forEach((item: PlayFabClientModels.CatalogItem) => {
				this.biomeMap[item.ItemId] = {
					ItemId: item.ItemId,
					FullSnowballPrice: item.VirtualCurrencyPrices.SB,
					FullIciclePrice: item.VirtualCurrencyPrices.IC,
					DisplayName: item.DisplayName,
				} as BiomeDetail;
			});

		const inventories: PlayFabClientModels.ItemInstance[] = this.registry.get("Inventories");
		inventories
			.filter((inventory: PlayFabClientModels.ItemInstance) => inventory.ItemClass === "biome")
			.forEach(
				biome =>
					(this.biomeItems[biome.ItemId] = {
						Mittens: 0,
						Bonfire: 0,
						Snowman: 0,
						"Igloo Factory": 0,
						"Arctic Vault": 0,
					})
			);
		inventories
			.filter((inventory: PlayFabClientModels.ItemInstance) => inventory.CustomData !== undefined)
			.forEach(
				(inventory: PlayFabClientModels.ItemInstance) =>
					(this.biomeItems[inventory.CustomData.BiomeId][inventory.DisplayName] += 1)
			);

		PlayFabClient.GetStoreItems({ StoreId: "Biome" }, (error, result) => {
			this.storeId = result.data.StoreId;
			result.data.Store.forEach((storeItem: PlayFabClientModels.StoreItem) => {
				this.makeBiome(storeItem);
			});
		});

		this.registry.events.on("changedata", this.updateData, this);

		this.snowballText = this.add.text(16, 16, `${this.registry.get("SB")} x`, textStyle);
		this.snowballIcon = this.add.image(36 + this.snowballText.width, 25, "snowball").setScale(0.15);
		this.icicleText = this.add.text(16, 56, `${this.registry.get("IC")} x`, textStyle);
		this.icicleIcon = this.add.image(32 + this.icicleText.width, 65, "icicle").setScale(0.15);

		this.interactiveMapObjects.push(
			this.add
				.text(16, 584, "MENU", textStyle)
				.setOrigin(0, 1)
				.setInteractive({ useHandCursor: true })
				.on("pointerup", () => {
					this.scene.start("Menu");
				})
		);
	}

	updateData(parent, key, data) {
		if (this.scene.isActive()) {
			if (key === "SB") {
				this.snowballText.setText(`${data} x`);
				this.snowballIcon.setX(36 + this.snowballText.width);
			} else if (key === "IC") {
				this.icicleText.setText(`${data} x`);
				this.icicleIcon.setX(32 + this.icicleText.width);
			}
		}
	}

	makeBiome(biome: PlayFabClientModels.StoreItem) {
		let imageKey: string;
		let x: number;
		let y: number;
		if (biome.ItemId === "5") {
			imageKey = "icebiome";
			x = 200;
			y = 200;
		} else if (biome.ItemId === "6") {
			imageKey = "magmabiome";
			x = 400;
			y = 200;
		} else if (biome.ItemId === "7") {
			imageKey = "savannabiome";
			x = 600;
			y = 200;
		} else if (biome.ItemId === "8") {
			imageKey = "marinebiome";
			x = 200;
			y = 400;
		} else if (biome.ItemId === "9") {
			imageKey = "tropicalbiome";
			x = 400;
			y = 400;
		}
		this.interactiveMapObjects.push(
			this.add
				.image(x, y, imageKey)
				.setScale(0.5)
				.setInteractive({ useHandCursor: true })
				.on("pointerup", () => {
					this.interactiveMapObjects.forEach(object => object.disableInteractive());
					if (biome.ItemId in this.biomeItems) {
						this.showBiomeOwnedContainer(biome, imageKey);
					} else {
						this.showBiomeNotOwnedContainer(biome, imageKey);
					}
				})
		);
		if (!(biome.ItemId in this.biomeItems)) {
			this.add.image(x, y, "lock").setScale(0.5);
		}
	}

	makeBiomeOwnedContainer() {
		const overlay = this.add.rectangle(0, 0, 800, 600, 0x000000).setDepth(19).setAlpha(0.6);
		const bg = this.add.existing(new RoundRectangle(this, 0, 0, 520, 340, 15, 0x16252e));
		const image = this.add.image(-115, -10, "icebiome").setScale(0.7);
		const lightBg = this.add.existing(new RoundRectangle(this, 0, 0, 200, 300, 15, 0x2e5767));
		const title = this.add.text(0, -130, "", textStyle).setAlign("center").setOrigin(0.5, 0.5);
		const buttonText = this.add.text(0, 120, "", textStyle).setAlign("center").setOrigin(0.5, 0.5);
		const button = this.add
			.existing(new RoundRectangle(this, 0, 120, 0, 0, 10, 0xc26355))
			.setInteractive({ useHandCursor: true });
		const details = this.add.container(140, 0, [
			lightBg,
			title,
			button,
			buttonText,
			this.add.container(0, -100, []),
		]);
		const popup = this.add.container(400, 300, [overlay, bg, image, details]).setDepth(20).setAlpha(0);
		const closeButton = this.add
			.image(245, -160, "close")
			.setScale(0.35)
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => {
				this.add.tween({
					targets: [this.biomeOwnedContainer],
					ease: "Sine.easeIn",
					duration: 100,
					alpha: 0,
					onComplete: () => {
						this.interactiveMapObjects.forEach(object => object.setInteractive({ useHandCursor: true }));
						button.removeAllListeners();
						const counterText = details.getAt(4) as Phaser.GameObjects.Container;
						counterText.removeAll(true);
					},
					callbackScope: this,
				});
			});
		popup.add(closeButton);
		this.biomeOwnedContainer = popup;
	}

	makeBiomeNotOwnedContainer() {
		const overlay = this.add.rectangle(0, 0, 800, 600, 0x000000).setDepth(19).setAlpha(0.6);
		const bg = this.add.existing(new RoundRectangle(this, 0, 0, 520, 340, 15, 0x16252e));
		const lightBg = this.add.existing(new RoundRectangle(this, 0, 0, 200, 300, 15, 0x2e5767));
		const title = this.add.text(0, -130, "", textStyle).setAlign("center").setOrigin(0.5, 0.5);
		const image = this.add.image(-115, -10, "icebiome").setScale(0.7);
		const snowballButtonText = this.add.text(-15, 70, "", textStyle).setAlign("center").setOrigin(0.5, 0.5);
		const snowballButton = this.add
			.existing(new RoundRectangle(this, 0, 70, 0, 0, 10, 0xc26355))
			.setInteractive({ useHandCursor: true });
		const snowballIcon = this.add.image(0, 70, "snowball").setScale(0.15);
		const icicleButtonText = this.add.text(-15, 120, "", textStyle).setAlign("center").setOrigin(0.5, 0.5);
		const icicleButton = this.add
			.existing(new RoundRectangle(this, 0, 120, 0, 0, 10, 0xc26355))
			.setInteractive({ useHandCursor: true });
		const icicleIcon = this.add.image(0, 120, "icicle").setScale(0.15);
		const details = this.add.container(140, 0, [
			lightBg,
			title,
			snowballButton,
			snowballButtonText,
			snowballIcon,
			icicleButton,
			icicleButtonText,
			icicleIcon,
			this.add.container(0, 0, []),
		]);
		const popup = this.add.container(400, 300, [overlay, bg, image, details]).setDepth(20).setAlpha(0);
		const closeButton = this.add
			.image(245, -160, "close")
			.setScale(0.35)
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => {
				this.add.tween({
					targets: [this.biomeNotOwnedContainer],
					ease: "Sine.easeIn",
					duration: 100,
					alpha: 0,
					onComplete: () => {
						this.interactiveMapObjects.forEach(object => object.setInteractive({ useHandCursor: true }));
						snowballButton.removeAllListeners();
						icicleButton.removeAllListeners();
						const discounts = details.getAt(8) as Phaser.GameObjects.Container;
						discounts.removeAll(true);
					},
					callbackScope: this,
				});
			});
		popup.add(closeButton);
		this.biomeNotOwnedContainer = popup;
	}

	showBiomeOwnedContainer(biome: PlayFabClientModels.StoreItem, imageKey: string) {
		const biomeDetail: BiomeDetail = this.biomeMap[biome.ItemId];
		const details = this.biomeOwnedContainer.getAt(3) as Phaser.GameObjects.Container;
		const title = details.getAt(1) as Phaser.GameObjects.Text;
		title.setText(`${biomeDetail.DisplayName.toUpperCase()}`);
		const buttonText = details.getAt(3) as Phaser.GameObjects.Text;
		buttonText.setText("VISIT");
		const button = details.getAt(2) as RoundRectangle;
		button.width = buttonText.width + 16;
		button.height = buttonText.height + 16;
		button.on("pointerup", () => {
			this.scene.start("Game", { biomeDetail: biomeDetail });
		});
		const image = this.biomeOwnedContainer.getAt(2) as Phaser.GameObjects.Image;
		image.setTexture(imageKey);
		const counterText = details.getAt(4) as Phaser.GameObjects.Container;
		Object.keys(this.biomeItems[biome.ItemId]).forEach((name: string, i: number) => {
			const text = this.add
				.text(0, 30 * i, `${name}: ${this.biomeItems[biome.ItemId][name]}`, textStyle)
				.setAlign("left")
				.setOrigin(0.5, 0);
			counterText.add(text);
		});
		this.add.tween({
			targets: [this.biomeOwnedContainer],
			ease: "Sine.easeIn",
			duration: 500,
			alpha: 1,
			callbackScope: this,
		});
	}

	showBiomeNotOwnedContainer(item: PlayFabClientModels.StoreItem, imageKey: string) {
		const biomeDetail: BiomeDetail = this.biomeMap[item.ItemId];
		const maybeDiscountSnowballPrice = item.VirtualCurrencyPrices.SB;
		const maybeDiscountIciclePrice = item.VirtualCurrencyPrices.IC;
		const details = this.biomeNotOwnedContainer.getAt(3) as Phaser.GameObjects.Container;
		const title = details.getAt(1) as Phaser.GameObjects.Text;
		title.setText(`${biomeDetail.DisplayName.toUpperCase()}`);
		const snowballButtonText = details.getAt(3) as Phaser.GameObjects.Text;
		snowballButtonText.setText(`${maybeDiscountSnowballPrice} x`);
		const snowballButton = details.getAt(2) as RoundRectangle;
		snowballButton.width = snowballButtonText.width + 50;
		snowballButton.height = snowballButtonText.height + 16;
		snowballButton.on("pointerup", () => {
			this.purchaseBiome(biomeDetail, maybeDiscountSnowballPrice, "SB");
		});
		const snowballIcon = details.getAt(4) as Phaser.GameObjects.Image;
		snowballIcon.setX((snowballButtonText.width + 10) / 2);
		const icicleButtonText = details.getAt(6) as Phaser.GameObjects.Text;
		icicleButtonText.setText(`${maybeDiscountIciclePrice} x`);
		const icicleButton = details.getAt(5) as RoundRectangle;
		icicleButton.width = icicleButtonText.width + 50;
		icicleButton.height = icicleButtonText.height + 16;
		icicleButton.on("pointerup", () => {
			this.purchaseBiome(biomeDetail, maybeDiscountIciclePrice, "IC");
		});
		const icicleIcon = details.getAt(7) as Phaser.GameObjects.Image;
		icicleIcon.setX((icicleButtonText.width + 5) / 2);
		const image = this.biomeNotOwnedContainer.getAt(2) as Phaser.GameObjects.Image;
		image.setTexture(imageKey);
		this.add.tween({
			targets: [this.biomeNotOwnedContainer],
			ease: "Sine.easeIn",
			duration: 500,
			alpha: 1,
			callbackScope: this,
		});

		if (this.storeId === "BiomeWithDiscount") {
			snowballButton.setY(55);
			snowballButtonText.setY(55);
			snowballIcon.setY(55);
			const fullSnowballPriceText = this.add
				.text(-10, 20, `${biomeDetail.FullSnowballPrice} x`, {
					fontSize: smallFontSize,
					fontFamily: fontFamily,
				})
				.setAlign("center")
				.setOrigin(0.5, 0.5);
			const fullIciclePriceText = this.add
				.text(-10, 90, `${biomeDetail.FullIciclePrice} x`, {
					fontSize: smallFontSize,
					fontFamily: fontFamily,
				})
				.setAlign("center")
				.setOrigin(0.5, 0.5);
			const oldSnowballIcon = this.add
				.image((fullSnowballPriceText.width + 8) / 2, 20, "snowball")
				.setScale(0.09);
			const oldIcicleIcon = this.add.image((fullIciclePriceText.width + 8) / 2, 90, "icicle").setScale(0.09);
			const snowballLine = this.add
				.line(0, 10, 0, 10, 35 + fullSnowballPriceText.width, 10, 0xffffff)
				.setOrigin(0.5, 0.5);
			const icicleLine = this.add
				.line(0, 45, 0, 45, 35 + fullIciclePriceText.width, 45, 0xffffff)
				.setOrigin(0.5, 0.5);
			const discounts = details.getAt(8) as Phaser.GameObjects.Container;
			discounts.add([
				fullSnowballPriceText,
				fullIciclePriceText,
				oldSnowballIcon,
				oldIcicleIcon,
				snowballLine,
				icicleLine,
			]);
		}
	}

	purchaseBiome(biomeDetail: BiomeDetail, maybeDiscountPrice: number, currencyType: string) {
		PlayFabClient.PurchaseItem(
			{
				ItemId: biomeDetail.ItemId,
				Price: maybeDiscountPrice,
				StoreId: this.storeId,
				VirtualCurrency: currencyType,
			},
			(e, r) => {
				if (e !== null) {
					currencyType === "SB"
						? this.showToast("Not enough snowballs", true)
						: this.showToast("Not enough icicles", true);
				} else {
					currencyType === "SB"
						? (this.registry.values.SB -= maybeDiscountPrice)
						: (this.registry.values.IC -= maybeDiscountPrice);
					this.registry.values.Inventories.push(...r.data.Items);
					this.showToast(`${biomeDetail.DisplayName} successfully purchased`, false);
					this.scene.start("Game", { biomeDetail: biomeDetail });
				}
			}
		);
	}

	update() {
		if (!PlayFabClient.IsClientLoggedIn()) {
			this.scene.start("Signin");
		}
	}
}

export default MapScene;
