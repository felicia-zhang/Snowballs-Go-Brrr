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
import { BiomeDetail, ItemCounter, ItemDetail } from "../utils/types";
import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";
import Button from "../utils/button";
import CloseButton from "../utils/closeButton";
import { numberWithCommas, wrapString } from "../utils/stringFormat";
import { showToast } from "./showToast";

class MapScene extends Phaser.Scene {
	biomeOwnedContainer: Phaser.GameObjects.Container;
	biomeNotOwnedContainer: Phaser.GameObjects.Container;

	create() {
		this.makeBiomeOwnedContainer();
		this.makeBiomeNotOwnedContainer();

		const inventories: PlayFabClientModels.ItemInstance[] = this.registry.get("Inventories");
		inventories
			.filter((inventory: PlayFabClientModels.ItemInstance) => inventory.ItemClass === "biome")
			.forEach(
				biome =>
					(this.biomeItems[biome.ItemId] = {
						mittens: 0,
						bonfire: 0,
						snowman: 0,
						igloo: 0,
						vault: 0,
					} as ItemCounter)
			);
		inventories
			.filter((inventory: PlayFabClientModels.ItemInstance) => inventory.CustomData !== undefined)
			.forEach(
				(inventory: PlayFabClientModels.ItemInstance) =>
					(this.biomeItems[inventory.CustomData.BiomeId][inventory.ItemId] += 1)
			);
	}

	makeBiomeOwnedContainer() {
		const overlay = this.add.rectangle(0, 0, 800, 600, 0x000000).setDepth(overlayDepth).setAlpha(0.6);
		const bg = this.add.existing(new RoundRectangle(this, 0, 0, 520, 340, 15, darkBackgroundColor));
		const image = this.add.image(-115, -10, "icebiome").setScale(0.7);
		const lightBg = this.add.existing(new RoundRectangle(this, 0, 0, 200, 300, 15, lightBackgroundColor));
		const title = this.add.text(0, -130, "", textStyle).setAlign("center").setOrigin(0.5, 0.5);
		const description = this.add.text(-84, -110, "", textStyle).setAlign("left").setOrigin(0, 0);
		const button = this.add.existing(new Button(this, 0, 120).setText("VISIT"));
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
		const snowballButton = this.add.existing(new Button(this, 0, 70).addIcon("snowball"));
		const icicleButton = this.add.existing(new Button(this, 0, 120).addIcon("icicle"));
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
				this.scene.start("Game", { biomeId: biomeDetail.ItemId, biomeName: biomeDetail.DisplayName });
			});
		});
		const image = this.biomeOwnedContainer.getAt(2) as Phaser.GameObjects.Image;
		image.setTexture(imageKey);
		const descriptionText = details.getAt(4) as Phaser.GameObjects.Text;
		descriptionText.setText(wrapString(biomeDetail.Description));
		const counterText = details.getAt(3) as Phaser.GameObjects.Container;
		Object.keys(this.biomeItems[biome.ItemId]).forEach((itemId: string, i: number) => {
			const text = this.add
				.text(
					0,
					20 * i,
					`${this.itemsMap[itemId].DisplayName}: ${this.biomeItems[biome.ItemId][itemId]}`,
					textStyle
				)
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
								? showToast(this, "Not enough snowballs", true)
								: showToast(this, "Not enough icicles", true);
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
								this.scene.start("Game", {
									biomeId: biomeDetail.ItemId,
									biomeName: biomeDetail.DisplayName,
								});
							});
						},
					});
				}
			}
		);
	}

	update() {
		if (!this.registry.has("IsSignedIn") || !this.registry.get("IsSignedIn")) {
			this.scene.start("Signin");
		}
	}
}

export default MapScene;
