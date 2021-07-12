import { PlayFabClient } from "playfab-sdk";
import {
	darkBackgroundColor,
	fontFamily,
	smallFontSize,
	textStyle,
	lightBackgroundColor,
	overlayDepth,
	popupDepth,
} from "../utils/constants";
import { BiomeDetail, BundleDetail, ItemCounter, ItemDetail } from "../utils/types";
import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";
import AScene from "./AScene";
import Button from "../utils/button";
import CloseButton from "../utils/closeButton";
import { numberWithCommas, wrapString } from "../utils/stringFormat";
import TextButton from "../utils/textButton";

class MapScene extends AScene {
	biomeMap: { [key: number]: BiomeDetail };
	biomeItems: { [key: number]: ItemCounter };
	snowballText: Phaser.GameObjects.Text;
	snowballIcon: Phaser.GameObjects.Image;
	icicleText: Phaser.GameObjects.Text;
	icicleIcon: Phaser.GameObjects.Image;
	biomeOwnedContainer: Phaser.GameObjects.Container;
	biomeNotOwnedContainer: Phaser.GameObjects.Container;
	storeId: string;
	icebiome: Phaser.GameObjects.Image;
	marinebiome: Phaser.GameObjects.Image;
	savannabiome: Phaser.GameObjects.Image;
	tropicalbiome: Phaser.GameObjects.Image;
	magmabiome: Phaser.GameObjects.Image;

	constructor() {
		super("Map");
	}

	create() {
		this.cameras.main.fadeIn(500, 0, 0, 0);
		this.add.image(400, 300, "sky");
		this.biomeMap = {};
		this.biomeItems = {};
		this.add.text(400, 16, "MAP", textStyle).setAlign("center").setOrigin(0.5, 0);
		this.storeId = "";
		this.makeBiomeOwnedContainer();
		this.makeBiomeNotOwnedContainer();

		this.registry.get("CatalogItems").forEach((item: PlayFabClientModels.CatalogItem) => {
			if (item.ItemClass === "biome") {
				this.biomeMap[item.ItemId] = {
					ItemId: item.ItemId,
					FullSnowballPrice: item.VirtualCurrencyPrices.SB,
					FullIciclePrice: item.VirtualCurrencyPrices.IC,
					DisplayName: item.DisplayName,
					Description: item.Description,
				} as BiomeDetail;
			} else if (item.ItemClass === "item") {
				this.itemsMap[item.ItemId] = {
					ItemId: item.ItemId,
					DisplayName: item.DisplayName,
					Description: item.Description,
					Instances: {},
				} as ItemDetail;
			} else if (item.ItemClass === "bundle") {
				this.bundlesMap[item.ItemId] = {
					ItemId: item.ItemId,
					DisplayName: item.DisplayName,
					Icicles: item.Bundle.BundledVirtualCurrencies.IC,
				} as BundleDetail;
			}
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

		this.icebiome = this.makeBiomeImage(200, 200, "icebiome", "5");
		this.marinebiome = this.makeBiomeImage(400, 200, "marinebiome", "6");
		this.savannabiome = this.makeBiomeImage(600, 200, "savannabiome", "7");
		this.tropicalbiome = this.makeBiomeImage(290, 400, "tropicalbiome", "8");
		this.magmabiome = this.makeBiomeImage(490, 400, "magmabiome", "9");

		this.registry.events.on("changedata", this.updateData, this);

		this.snowballText = this.add.text(50, 16, `: ${numberWithCommas(this.registry.get("SB") / 100)}`, textStyle);
		this.snowballIcon = this.add.image(16, 25, "snowball").setScale(0.15).setOrigin(0, 0.5);
		this.icicleText = this.add.text(44, 56, `: ${numberWithCommas(this.registry.get("IC"))}`, textStyle);
		this.icicleIcon = this.add.image(16, 65, "icicle").setScale(0.15).setOrigin(0, 0.5);

		if (this.registry.get("ResetBonus") !== 0) {
			this.add.text(50, 96, `: +${numberWithCommas(this.registry.get("ResetBonus") / 100)}`, textStyle);
			this.add.image(16, 105, "star").setScale(0.15).setOrigin(0, 0.5);
		}

		const menuButton = this.add.existing(
			new TextButton(this, 16, 544, "MENU", "left").addCallback(() => {
				this.cameras.main.fadeOut(500, 0, 0, 0);
				this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, (cam, effect) => {
					this.scene.start("Menu");
				});
			})
		);
		this.interactiveObjects.push(menuButton);

		const iapButton = this.add.existing(
			new TextButton(this, 16, 584, "IN-APP PURCHASE EXAMPLE", "left").addCallback(() => {
				this.interactiveObjects.forEach(object => object.disableInteractive());
				this.showCurrencyContainer();
			})
		);
		this.interactiveObjects.push(iapButton);
	}

	updateData(parent, key, data) {
		if (this.scene.isActive()) {
			key === "SB"
				? this.snowballText.setText(`: ${numberWithCommas(data / 100)}`)
				: this.icicleText.setText(`: ${numberWithCommas(data)}`);
		}
	}

	makeBiomeImage(x: number, y: number, imageKey: string, biomeId: string) {
		const image = this.add
			.image(x, y, imageKey)
			.setScale(0.5)
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => {
				PlayFabClient.GetStoreItems({ StoreId: "Biome" }, (error, result) => {
					this.storeId = result.data.StoreId;
					this.interactiveObjects.forEach(object => object.disableInteractive());
					const biome = result.data.Store.find(
						(storeItem: PlayFabClientModels.StoreItem) => storeItem.ItemId === biomeId
					);
					biomeId in this.biomeItems
						? this.showBiomeOwnedContainer(biome, imageKey)
						: this.showBiomeNotOwnedContainer(biome, imageKey);
				});
			});
		this.interactiveObjects.push(image);
		if (!(biomeId in this.biomeItems)) {
			this.add.image(x, y, "lock").setScale(0.5);
		}
		return image;
	}

	makeBiomeOwnedContainer() {
		const overlay = this.add.rectangle(0, 0, 800, 600, 0x000000).setDepth(overlayDepth).setAlpha(0.6);
		const bg = this.add.existing(new RoundRectangle(this, 0, 0, 520, 340, 15, darkBackgroundColor));
		const image = this.add.image(-115, -10, "icebiome").setScale(0.7);
		const lightBg = this.add.existing(new RoundRectangle(this, 0, 0, 200, 300, 15, lightBackgroundColor));
		const title = this.add.text(0, -130, "", textStyle).setAlign("center").setOrigin(0.5, 0.5);
		const description = this.add.text(-84, -110, "", textStyle).setAlign("left").setOrigin(0, 0);
		const button = this.add.existing(new Button(this, 0, 120, "blue").setText("VISIT"));
		const details = this.add.container(140, 0, [
			lightBg,
			title,
			button,
			this.add.container(-84, -15, []),
			description,
		]);
		this.biomeOwnedContainer = this.add
			.container(400, 300, [overlay, bg, image, details])
			.setDepth(popupDepth)
			.setAlpha(0);
		const closeButton = this.add.existing(
			new CloseButton(this, 247.5, -157.5).addCallback(this.biomeOwnedContainer, () => {
				button.removeListener("pointerup").resetButton();
				const counterText = details.getAt(3) as Phaser.GameObjects.Container;
				counterText.removeAll(true);
			})
		);
		this.biomeOwnedContainer.add(closeButton);
	}

	makeBiomeNotOwnedContainer() {
		const overlay = this.add.rectangle(0, 0, 800, 600, 0x000000).setDepth(overlayDepth).setAlpha(0.6);
		const bg = this.add.existing(new RoundRectangle(this, 0, 0, 520, 340, 15, darkBackgroundColor));
		const lightBg = this.add.existing(new RoundRectangle(this, 0, 0, 200, 300, 15, lightBackgroundColor));
		const title = this.add.text(0, -130, "", textStyle).setAlign("center").setOrigin(0.5, 0.5);
		const description = this.add.text(-84, -110, "", textStyle).setAlign("left").setOrigin(0, 0);
		const image = this.add.image(-115, -10, "icebiome").setScale(0.7);
		const snowballButton = this.add.existing(new Button(this, 0, 70, "red").addIcon("snowball"));
		const icicleButton = this.add.existing(new Button(this, 0, 120, "red").addIcon("icicle"));
		const details = this.add.container(140, 0, [
			lightBg,
			title,
			snowballButton,
			icicleButton,
			this.add.container(0, 0, []),
			description,
		]);
		this.biomeNotOwnedContainer = this.add
			.container(400, 300, [overlay, bg, image, details])
			.setDepth(popupDepth)
			.setAlpha(0);
		const closeButton = this.add.existing(
			new CloseButton(this, 247.5, -157.5).addCallback(this.biomeNotOwnedContainer, () => {
				snowballButton.removeListener("pointerup").resetButton();
				icicleButton.removeListener("pointerup").resetButton();
				const discounts = details.getAt(4) as Phaser.GameObjects.Container;
				discounts.removeAll(true);
			})
		);
		this.biomeNotOwnedContainer.add(closeButton);
	}

	showBiomeOwnedContainer(biome: PlayFabClientModels.StoreItem, imageKey: string) {
		const biomeDetail: BiomeDetail = this.biomeMap[biome.ItemId];
		const details = this.biomeOwnedContainer.getAt(3) as Phaser.GameObjects.Container;
		const title = details.getAt(1) as Phaser.GameObjects.Text;
		title.setText(`${biomeDetail.DisplayName.toUpperCase()}`);
		const button = details.getAt(2) as Button;
		button.addCallback(() => {
			this.cameras.main.fadeOut(500, 0, 0, 0);
			this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, (cam, effect) => {
				this.scene.start("Game", { biomeDetail: biomeDetail });
			});
		});
		const image = this.biomeOwnedContainer.getAt(2) as Phaser.GameObjects.Image;
		image.setTexture(imageKey);
		const descriptionText = details.getAt(4) as Phaser.GameObjects.Text;
		descriptionText.setText(wrapString(biomeDetail.Description));
		const counterText = details.getAt(3) as Phaser.GameObjects.Container;
		Object.keys(this.biomeItems[biome.ItemId]).forEach((name: string, i: number) => {
			const text = this.add
				.text(0, 20 * i, `${name}: ${this.biomeItems[biome.ItemId][name]}`, textStyle)
				.setAlign("left")
				.setOrigin(0, 0);
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
		const snowballButton = details.getAt(2) as Button;
		snowballButton.setText(`${numberWithCommas(maybeDiscountSnowballPrice / 100)} x`).addCallback(() => {
			this.purchaseBiome(biomeDetail, maybeDiscountSnowballPrice, "SB", snowballButton);
		});
		const icicleButton = details.getAt(3) as Button;
		icicleButton.setText(`${numberWithCommas(maybeDiscountIciclePrice)} x`).addCallback(() => {
			this.purchaseBiome(biomeDetail, maybeDiscountIciclePrice, "IC", icicleButton);
		});
		const image = this.biomeNotOwnedContainer.getAt(2) as Phaser.GameObjects.Image;
		image.setTexture(imageKey);
		const descriptionText = details.getAt(5) as Phaser.GameObjects.Text;
		descriptionText.setText(wrapString(biomeDetail.Description));
		this.add.tween({
			targets: [this.biomeNotOwnedContainer],
			ease: "Sine.easeIn",
			duration: 500,
			alpha: 1,
			callbackScope: this,
		});

		if (this.storeId === "BiomeWithDiscount") {
			snowballButton.setY(55);
			const fullSnowballPriceText = this.add
				.text(-10, 20, `${numberWithCommas(biomeDetail.FullSnowballPrice / 100)} x`, {
					fontSize: smallFontSize,
					fontFamily: fontFamily,
				})
				.setAlign("center")
				.setOrigin(0.5, 0.5);
			const fullIciclePriceText = this.add
				.text(-10, 90, `${numberWithCommas(biomeDetail.FullIciclePrice)} x`, {
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
			const discounts = details.getAt(4) as Phaser.GameObjects.Container;
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

	purchaseBiome(biomeDetail: BiomeDetail, maybeDiscountPrice: number, currencyType: string, button: Button) {
		button.toggleLoading(true);
		PlayFabClient.PurchaseItem(
			{
				ItemId: biomeDetail.ItemId,
				Price: maybeDiscountPrice,
				StoreId: this.storeId,
				VirtualCurrency: currencyType,
			},
			(e, r) => {
				if (e !== null) {
					this.time.addEvent({
						delay: 400,
						callback: () => {
							button.toggleLoading(false);
							currencyType === "SB"
								? this.showToast("Not enough snowballs", true)
								: this.showToast("Not enough icicles", true);
						},
					});
				} else {
					this.time.addEvent({
						delay: 400,
						callback: () => {
							button.toggleLoading(false);
							currencyType === "SB"
								? (this.registry.values.SB -= maybeDiscountPrice)
								: (this.registry.values.IC -= maybeDiscountPrice);
							this.registry.values.Inventories.push(...r.data.Items);
							this.cameras.main.fadeOut(500, 0, 0, 0);
							this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, (cam, effect) => {
								this.scene.start("Game", { biomeDetail: biomeDetail });
							});
						},
					});
				}
			}
		);
	}

	update() {
		if (!this.registry.has("FinishedSignIn")) {
			this.scene.start("Signin");
		}
	}
}

export default MapScene;
