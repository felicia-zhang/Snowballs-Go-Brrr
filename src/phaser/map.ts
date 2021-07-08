import { PlayFabClient } from "playfab-sdk";
import {
	darkBackgroundColor,
	darkRed,
	normalRed,
	lightRed,
	fontFamily,
	smallFontSize,
	textStyle,
	lightBackgroundColor,
	overlayDepth,
	popupDepth,
	closeButtonFill,
	lightBlue,
	normalBlue,
	darkBlue,
} from "../utils/constants";
import { BiomeDetail, ItemCounter, ItemDetail } from "../utils/types";
import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";
import AScene from "./AScene";
import Button from "../utils/button";

const wrap = (s: string) => s.replace(/(?![^\n]{1,21}$)([^\n]{1,21})\s/g, "$1\n");

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
			} else {
				this.itemsMap[item.ItemId] = {
					ItemId: item.ItemId,
					DisplayName: item.DisplayName,
					Description: item.Description,
					Instances: {},
				} as ItemDetail;
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

		this.snowballText = this.add.text(50, 16, `: ${this.registry.get("SB") / 100}`, textStyle);
		this.snowballIcon = this.add.image(16, 25, "snowball").setScale(0.15).setOrigin(0, 0.5);
		this.icicleText = this.add.text(44, 56, `: ${this.registry.get("IC")}`, textStyle);
		this.icicleIcon = this.add.image(16, 65, "icicle").setScale(0.15).setOrigin(0, 0.5);

		if (this.registry.get("ResetBonus") !== 0) {
			this.add.text(50, 96, `: +${this.registry.get("ResetBonus") / 100}`, textStyle);
			this.add.image(16, 105, "star").setScale(0.15).setOrigin(0, 0.5);
		}

		const menuButtonUnderline = this.add.line(16, 544, 16, 544, 16, 544, 0xffffff).setAlpha(0);
		const menuButton = this.add
			.text(16, 544, "MENU", textStyle)
			.setOrigin(0, 1)
			.setInteractive({ useHandCursor: true })
			.on("pointerover", () => {
				menuButtonUnderline.setTo(0, 0, menuButton.width, 0).setPosition(16, 544).setAlpha(1);
			})
			.on("pointerout", () => {
				menuButtonUnderline.setAlpha(0);
			})
			.on("pointerup", () => {
				this.cameras.main.fadeOut(500, 0, 0, 0);
				this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, (cam, effect) => {
					this.scene.start("Menu");
				});
			});
		this.interactiveObjects.push(menuButton);

		const iapButtonUnderline = this.add.line(16, 584, 16, 584, 16, 584, 0xffffff).setAlpha(0);
		const iapButton = this.add
			.text(16, 584, "IN-APP PURCHASE EXAMPLE", textStyle)
			.setOrigin(0, 1)
			.setInteractive({ useHandCursor: true })
			.on("pointerover", () => {
				iapButtonUnderline.setTo(0, 0, iapButton.width, 0).setPosition(16, 584).setAlpha(1);
			})
			.on("pointerout", () => {
				iapButtonUnderline.setAlpha(0);
			})
			.on("pointerup", () => {
				this.interactiveObjects.forEach(object => object.disableInteractive());
				this.showCurrencyContainer();
			});
		this.interactiveObjects.push(iapButton);
	}

	updateData(parent, key, data) {
		if (this.scene.isActive()) {
			key === "SB" ? this.snowballText.setText(`: ${data / 100}`) : this.icicleText.setText(`: ${data}`);
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
		const button = new Button(this, 0, 120, "blue").setText("VISIT");
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
		const closeButton = this.add
			.existing(new RoundRectangle(this, 245, -160, 35, 35, 5, closeButtonFill).setStrokeStyle(6, lightBlue, 1))
			.setInteractive({ useHandCursor: true })
			.on("pointerover", () => {
				closeButton.setStrokeStyle(6, normalBlue, 1);
			})
			.on("pointerout", () => {
				closeButton.setStrokeStyle(6, lightBlue, 1);
			})
			.on("pointerdown", () => {
				closeButton.setStrokeStyle(6, 0x2e5768, 1);
			})
			.on("pointerup", () => {
				closeButton.setStrokeStyle(6, lightBlue, 1);
				this.add.tween({
					targets: [this.biomeOwnedContainer],
					ease: "Sine.easeIn",
					duration: 100,
					alpha: 0,
					onComplete: () => {
						this.interactiveObjects.forEach(object => object.setInteractive({ useHandCursor: true }));
						button.removeListener("pointerup");
						button.resetButton();
						const counterText = details.getAt(3) as Phaser.GameObjects.Container;
						counterText.removeAll(true);
					},
					callbackScope: this,
				});
			});
		const line1 = this.add.line(0, 0, 245, -142.5, 262, -159.5, 0x2e5768).setLineWidth(3, 3);
		const line2 = this.add.line(0, 0, 245, -159.5, 262, -142.5, 0x2e5768).setLineWidth(3, 3);
		this.biomeOwnedContainer.add([closeButton, line1, line2]);
	}

	makeBiomeNotOwnedContainer() {
		const overlay = this.add.rectangle(0, 0, 800, 600, 0x000000).setDepth(overlayDepth).setAlpha(0.6);
		const bg = this.add.existing(new RoundRectangle(this, 0, 0, 520, 340, 15, darkBackgroundColor));
		const lightBg = this.add.existing(new RoundRectangle(this, 0, 0, 200, 300, 15, lightBackgroundColor));
		const title = this.add.text(0, -130, "", textStyle).setAlign("center").setOrigin(0.5, 0.5);
		const description = this.add.text(-84, -110, "", textStyle).setAlign("left").setOrigin(0, 0);
		const image = this.add.image(-115, -10, "icebiome").setScale(0.7);
		const snowballButton = new Button(this, 0, 70, "red").addIcon("snowball");
		const icicleButton = new Button(this, 0, 120, "red").addIcon("icicle");
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
		const closeButton = this.add
			.existing(new RoundRectangle(this, 245, -160, 35, 35, 5, closeButtonFill).setStrokeStyle(6, lightBlue, 1))
			.setInteractive({ useHandCursor: true })
			.on("pointerover", () => {
				closeButton.setStrokeStyle(6, normalBlue, 1);
			})
			.on("pointerout", () => {
				closeButton.setStrokeStyle(6, lightBlue, 1);
			})
			.on("pointerdown", () => {
				closeButton.setStrokeStyle(6, darkBlue, 1);
			})
			.on("pointerup", () => {
				closeButton.setStrokeStyle(6, lightBlue, 1);
				this.add.tween({
					targets: [this.biomeNotOwnedContainer],
					ease: "Sine.easeIn",
					duration: 100,
					alpha: 0,
					onComplete: () => {
						this.interactiveObjects.forEach(object => object.setInteractive({ useHandCursor: true }));
						snowballButton.removeListener("pointerup");
						icicleButton.removeListener("pointerup");
						snowballButton.resetButton();
						icicleButton.resetButton();
						const discounts = details.getAt(4) as Phaser.GameObjects.Container;
						discounts.removeAll(true);
					},
					callbackScope: this,
				});
			});
		const line1 = this.add.line(0, 0, 245, -142.5, 262, -159.5, darkBlue).setLineWidth(3, 3);
		const line2 = this.add.line(0, 0, 245, -159.5, 262, -142.5, darkBlue).setLineWidth(3, 3);
		this.biomeNotOwnedContainer.add([closeButton, line1, line2]);
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
		descriptionText.setText(wrap(biomeDetail.Description));
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
		snowballButton.setText(`${maybeDiscountSnowballPrice / 100} x`).addCallback(() => {
			this.purchaseBiome(biomeDetail, maybeDiscountSnowballPrice, "SB", snowballButton);
		});
		const icicleButton = details.getAt(3) as Button;
		icicleButton.setText(`${maybeDiscountIciclePrice} x`).addCallback(() => {
			this.purchaseBiome(biomeDetail, maybeDiscountIciclePrice, "IC", icicleButton);
		});
		const image = this.biomeNotOwnedContainer.getAt(2) as Phaser.GameObjects.Image;
		image.setTexture(imageKey);
		const descriptionText = details.getAt(5) as Phaser.GameObjects.Text;
		descriptionText.setText(wrap(biomeDetail.Description));
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
				.text(-10, 20, `${biomeDetail.FullSnowballPrice / 100} x`, {
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
