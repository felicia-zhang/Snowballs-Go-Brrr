import { PlayFabClient } from "playfab-sdk";
import {
	darkBackgroundColor,
	buttonClick,
	buttonHover,
	buttonNormal,
	fontFamily,
	smallFontSize,
	textStyle,
	lightBackgroundColor,
	overlayDepth,
	popupDepth,
	closeButtonFill,
	outlineNormal,
	outlineHover,
	outlineClick,
} from "../utils/constants";
import { BiomeDetail, ItemCounter, ItemDetail } from "../utils/types";
import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";
import AScene from "./AScene";

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

		this.snowballText = this.add.text(50, 16, `: ${this.registry.get("SB")}`, textStyle);
		this.snowballIcon = this.add.image(16, 25, "snowball").setScale(0.15).setOrigin(0, 0.5);
		this.icicleText = this.add.text(44, 56, `: ${this.registry.get("IC")}`, textStyle);
		this.icicleIcon = this.add.image(16, 65, "icicle").setScale(0.15).setOrigin(0, 0.5);

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
			key === "SB" ? this.snowballText.setText(`: ${data}`) : this.icicleText.setText(`: ${data}`);
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
		const buttonText = this.add.text(0, 120, "VISIT", textStyle).setAlign("center").setOrigin(0.5, 0.5);
		const highlight = this.add.existing(new RoundRectangle(this, 0, 120, 58, 36, 10, 0xffffff)).setAlpha(0);
		const button = this.add
			.existing(new RoundRectangle(this, 0, 120, 58, 36, 10, outlineNormal))
			.setInteractive({ useHandCursor: true })
			.on("pointerover", () => {
				button.setFillStyle(outlineHover, 1);
			})
			.on("pointerout", () => {
				button.setFillStyle(outlineNormal, 1);
			})
			.on("pointerdown", () => {
				button.setFillStyle(outlineClick, 1);
				this.add.tween({
					targets: [highlight],
					ease: "Sine.easeIn",
					props: {
						width: {
							value: 63,
							duration: 150,
							ease: "Sine.easeIn",
						},
						height: {
							value: 41,
							duration: 150,
							ease: "Sine.easeIn",
						},
						alpha: {
							value: 0.3,
							duration: 150,
							ease: "Sine.easeIn",
						},
					},
					callbackScope: this,
				});
			});
		const details = this.add.container(140, 0, [
			lightBg,
			title,
			highlight,
			button,
			buttonText,
			this.add.container(-84, -15, []),
			description,
		]);
		const popup = this.add.container(400, 300, [overlay, bg, image, details]).setDepth(popupDepth).setAlpha(0);
		const closeButton = this.add
			.existing(
				new RoundRectangle(this, 245, -160, 35, 35, 5, closeButtonFill).setStrokeStyle(6, outlineNormal, 1)
			)
			.setInteractive({ useHandCursor: true })
			.on("pointerover", () => {
				closeButton.setStrokeStyle(6, outlineHover, 1);
			})
			.on("pointerout", () => {
				closeButton.setStrokeStyle(6, outlineNormal, 1);
			})
			.on("pointerdown", () => {
				closeButton.setStrokeStyle(6, 0x2e5768, 1);
			})
			.on("pointerup", () => {
				closeButton.setStrokeStyle(6, outlineNormal, 1);
				this.add.tween({
					targets: [this.biomeOwnedContainer],
					ease: "Sine.easeIn",
					duration: 100,
					alpha: 0,
					onComplete: () => {
						this.interactiveObjects.forEach(object => object.setInteractive({ useHandCursor: true }));
						button.removeListener("pointerup");
						highlight.setAlpha(0);
						const counterText = details.getAt(5) as Phaser.GameObjects.Container;
						counterText.removeAll(true);
					},
					callbackScope: this,
				});
			});
		const line1 = this.add.line(0, 0, 245, -142.5, 262, -159.5, 0x2e5768).setLineWidth(3, 3);
		const line2 = this.add.line(0, 0, 245, -159.5, 262, -142.5, 0x2e5768).setLineWidth(3, 3);
		popup.add([closeButton, line1, line2]);
		this.biomeOwnedContainer = popup;
	}

	makeBiomeNotOwnedContainer() {
		const overlay = this.add.rectangle(0, 0, 800, 600, 0x000000).setDepth(overlayDepth).setAlpha(0.6);
		const bg = this.add.existing(new RoundRectangle(this, 0, 0, 520, 340, 15, darkBackgroundColor));
		const lightBg = this.add.existing(new RoundRectangle(this, 0, 0, 200, 300, 15, lightBackgroundColor));
		const title = this.add.text(0, -130, "", textStyle).setAlign("center").setOrigin(0.5, 0.5);
		const description = this.add.text(-84, -110, "", textStyle).setAlign("left").setOrigin(0, 0);
		const image = this.add.image(-115, -10, "icebiome").setScale(0.7);
		const snowballButtonText = this.add.text(-15, 70, "", textStyle).setAlign("center").setOrigin(0.5, 0.5);
		const snowballHighlight = this.add.existing(new RoundRectangle(this, 0, 70, 0, 0, 10, 0xffffff)).setAlpha(0);
		const snowballButton = this.add
			.existing(new RoundRectangle(this, 0, 70, 0, 0, 10, buttonNormal))
			.setInteractive({ useHandCursor: true })
			.on("pointerover", () => {
				snowballButton.setFillStyle(buttonHover, 1);
			})
			.on("pointerout", () => {
				snowballButton.setFillStyle(buttonNormal, 1);
			})
			.on("pointerdown", () => {
				snowballButton.setFillStyle(buttonClick, 1);
				this.add.tween({
					targets: [snowballHighlight],
					ease: "Sine.easeIn",
					props: {
						width: {
							value: snowballButton.width + 5,
							duration: 150,
							ease: "Sine.easeIn",
						},
						height: {
							value: snowballButton.height + 5,
							duration: 150,
							ease: "Sine.easeIn",
						},
						alpha: {
							value: 0.3,
							duration: 150,
							ease: "Sine.easeIn",
						},
					},
					callbackScope: this,
				});
			});
		const snowballIcon = this.add.image(0, 70, "snowball").setScale(0.15);
		const icicleButtonText = this.add.text(-15, 120, "", textStyle).setAlign("center").setOrigin(0.5, 0.5);
		const icicleHighlight = this.add.existing(new RoundRectangle(this, 0, 120, 0, 0, 10, 0xffffff)).setAlpha(0);
		const icicleButton = this.add
			.existing(new RoundRectangle(this, 0, 120, 0, 0, 10, buttonNormal))
			.setInteractive({ useHandCursor: true })
			.on("pointerover", () => {
				icicleButton.setFillStyle(buttonHover, 1);
			})
			.on("pointerout", () => {
				icicleButton.setFillStyle(buttonNormal, 1);
			})
			.on("pointerdown", () => {
				icicleButton.setFillStyle(buttonClick, 1);
				this.add.tween({
					targets: [icicleHighlight],
					ease: "Sine.easeIn",
					props: {
						width: {
							value: icicleButton.width + 5,
							duration: 150,
							ease: "Sine.easeIn",
						},
						height: {
							value: icicleButton.height + 5,
							duration: 150,
							ease: "Sine.easeIn",
						},
						alpha: {
							value: 0.3,
							duration: 150,
							ease: "Sine.easeIn",
						},
					},
					callbackScope: this,
				});
			});
		const icicleIcon = this.add.image(0, 120, "icicle").setScale(0.15);
		const details = this.add.container(140, 0, [
			lightBg,
			title,
			snowballHighlight,
			snowballButton,
			snowballButtonText,
			snowballIcon,
			icicleHighlight,
			icicleButton,
			icicleButtonText,
			icicleIcon,
			this.add.container(0, 0, []),
			description,
		]);
		const popup = this.add.container(400, 300, [overlay, bg, image, details]).setDepth(popupDepth).setAlpha(0);
		const closeButton = this.add
			.existing(
				new RoundRectangle(this, 245, -160, 35, 35, 5, closeButtonFill).setStrokeStyle(6, outlineNormal, 1)
			)
			.setInteractive({ useHandCursor: true })
			.on("pointerover", () => {
				closeButton.setStrokeStyle(6, outlineHover, 1);
			})
			.on("pointerout", () => {
				closeButton.setStrokeStyle(6, outlineNormal, 1);
			})
			.on("pointerdown", () => {
				closeButton.setStrokeStyle(6, outlineClick, 1);
			})
			.on("pointerup", () => {
				closeButton.setStrokeStyle(6, outlineNormal, 1);
				this.add.tween({
					targets: [this.biomeNotOwnedContainer],
					ease: "Sine.easeIn",
					duration: 100,
					alpha: 0,
					onComplete: () => {
						this.interactiveObjects.forEach(object => object.setInteractive({ useHandCursor: true }));
						snowballButton.removeListener("pointerup");
						icicleButton.removeListener("pointerup");
						snowballHighlight.setAlpha(0);
						icicleHighlight.setAlpha(0);
						const discounts = details.getAt(10) as Phaser.GameObjects.Container;
						discounts.removeAll(true);
					},
					callbackScope: this,
				});
			});
		const line1 = this.add.line(0, 0, 245, -142.5, 262, -159.5, outlineClick).setLineWidth(3, 3);
		const line2 = this.add.line(0, 0, 245, -159.5, 262, -142.5, outlineClick).setLineWidth(3, 3);
		popup.add([closeButton, line1, line2]);
		this.biomeNotOwnedContainer = popup;
	}

	showBiomeOwnedContainer(biome: PlayFabClientModels.StoreItem, imageKey: string) {
		const biomeDetail: BiomeDetail = this.biomeMap[biome.ItemId];
		const details = this.biomeOwnedContainer.getAt(3) as Phaser.GameObjects.Container;
		const title = details.getAt(1) as Phaser.GameObjects.Text;
		title.setText(`${biomeDetail.DisplayName.toUpperCase()}`);
		const button = details.getAt(3) as RoundRectangle;
		button.on("pointerup", () => {
			button.setFillStyle(outlineNormal, 1);
			this.add.tween({
				targets: [details.getAt(2) as RoundRectangle],
				ease: "Sine.easeIn",
				duration: 300,
				alpha: 0,
				delay: 300,
				callbackScope: this,
			});
			this.cameras.main.fadeOut(500, 0, 0, 0);
			this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, (cam, effect) => {
				this.scene.start("Game", { biomeDetail: biomeDetail });
			});
		});
		const image = this.biomeOwnedContainer.getAt(2) as Phaser.GameObjects.Image;
		image.setTexture(imageKey);
		const descriptionText = details.getAt(6) as Phaser.GameObjects.Text;
		descriptionText.setText(wrap(biomeDetail.Description));
		const counterText = details.getAt(5) as Phaser.GameObjects.Container;
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
		const snowballButtonText = details.getAt(4) as Phaser.GameObjects.Text;
		snowballButtonText.setText(`${maybeDiscountSnowballPrice} x`);
		const snowballButton = details.getAt(3) as RoundRectangle;
		snowballButton.width = snowballButtonText.width + 50;
		snowballButton.height = snowballButtonText.height + 16;
		const snowballHighlight = details.getAt(2) as RoundRectangle;
		const snowballIcon = details.getAt(5) as Phaser.GameObjects.Image;
		snowballIcon.setX((snowballButtonText.width + 10) / 2);
		snowballButton.on("pointerup", () => {
			this.setLoading(
				true,
				maybeDiscountSnowballPrice,
				snowballButton,
				snowballButtonText,
				snowballIcon,
				snowballHighlight
			);
			this.purchaseBiome(biomeDetail, maybeDiscountSnowballPrice, "SB", () =>
				this.setLoading(
					false,
					maybeDiscountSnowballPrice,
					snowballButton,
					snowballButtonText,
					snowballIcon,
					snowballHighlight
				)
			);
			this.add.tween({
				targets: [snowballHighlight],
				ease: "Sine.easeIn",
				duration: 300,
				alpha: 0,
				delay: 300,
				callbackScope: this,
			});
		});
		const icicleButtonText = details.getAt(8) as Phaser.GameObjects.Text;
		icicleButtonText.setText(`${maybeDiscountIciclePrice} x`);
		const icicleButton = details.getAt(7) as RoundRectangle;
		icicleButton.width = icicleButtonText.width + 50;
		icicleButton.height = icicleButtonText.height + 16;
		const icicleHighlight = details.getAt(6) as RoundRectangle;
		const icicleIcon = details.getAt(9) as Phaser.GameObjects.Image;
		icicleIcon.setX((icicleButtonText.width + 5) / 2);
		icicleButton.on("pointerup", () => {
			this.setLoading(
				true,
				maybeDiscountIciclePrice,
				icicleButton,
				icicleButtonText,
				icicleIcon,
				icicleHighlight
			);
			this.purchaseBiome(biomeDetail, maybeDiscountIciclePrice, "IC", () =>
				this.setLoading(
					false,
					maybeDiscountIciclePrice,
					icicleButton,
					icicleButtonText,
					icicleIcon,
					icicleHighlight
				)
			);
			this.add.tween({
				targets: [icicleHighlight],
				ease: "Sine.easeIn",
				duration: 300,
				alpha: 0,
				delay: 300,
				callbackScope: this,
			});
		});
		const image = this.biomeNotOwnedContainer.getAt(2) as Phaser.GameObjects.Image;
		image.setTexture(imageKey);
		const descriptionText = details.getAt(11) as Phaser.GameObjects.Text;
		descriptionText.setText(wrap(biomeDetail.Description));
		this.add.tween({
			targets: [this.biomeNotOwnedContainer],
			ease: "Sine.easeIn",
			duration: 500,
			alpha: 1,
			callbackScope: this,
		});

		if (this.storeId === "BiomeWithDiscount") {
			snowballHighlight.y = 55;
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
			const discounts = details.getAt(10) as Phaser.GameObjects.Container;
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

	setLoading(
		isLoading: boolean,
		price: number,
		button: RoundRectangle,
		text: Phaser.GameObjects.Text,
		icon: Phaser.GameObjects.Image,
		highlight: RoundRectangle
	) {
		if (isLoading) {
			text.setText(". . .")
				.setX(0)
				.setOrigin(0.5, 0.725)
				.setStyle({ fontFamily: fontFamily, fontSize: "32px", stroke: "#ffffff", strokeThickness: 3 });
			button.setFillStyle(buttonClick, 1).disableInteractive().removeListener("pointerout");
			icon.setAlpha(0);
		} else {
			text.setText(`${price} x`)
				.setX(-15)
				.setOrigin(0.5, 0.5)
				.setStyle({ ...textStyle, strokeThickness: 0 });
			button
				.setFillStyle(buttonNormal, 1)
				.setInteractive({ useHandCursor: true })
				.on("pointerout", () => {
					button.setFillStyle(buttonNormal, 1);
				});
			highlight.setAlpha(0);
			icon.setAlpha(1);
		}
	}

	purchaseBiome(biomeDetail: BiomeDetail, maybeDiscountPrice: number, currencyType: string, toggleLoadingToFalse) {
		const delay = this.time.addEvent({ delay: 500 });
		PlayFabClient.PurchaseItem(
			{
				ItemId: biomeDetail.ItemId,
				Price: maybeDiscountPrice,
				StoreId: this.storeId,
				VirtualCurrency: currencyType,
			},
			(e, r) => {
				if (e !== null) {
					const remaining = delay.getRemaining();
					if (remaining > 0) {
						this.time.addEvent({
							delay: remaining,
							callback: () => {
								toggleLoadingToFalse();
								currencyType === "SB"
									? this.showToast("Not enough snowballs", true)
									: this.showToast("Not enough icicles", true);
							},
						});
					} else {
						toggleLoadingToFalse();
						currencyType === "SB"
							? this.showToast("Not enough snowballs", true)
							: this.showToast("Not enough icicles", true);
					}
				} else {
					const remaining = delay.getRemaining();
					if (remaining > 0) {
						this.time.addEvent({
							delay: remaining,
							callback: () => {
								toggleLoadingToFalse();
								currencyType === "SB"
									? (this.registry.values.SB -= maybeDiscountPrice)
									: (this.registry.values.IC -= maybeDiscountPrice);
								this.registry.values.Inventories.push(...r.data.Items);
								this.cameras.main.fadeOut(500, 0, 0, 0);
								this.cameras.main.once(
									Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
									(cam, effect) => {
										this.scene.start("Game", { biomeDetail: biomeDetail });
									}
								);
							},
						});
					} else {
						toggleLoadingToFalse();
						currencyType === "SB"
							? (this.registry.values.SB -= maybeDiscountPrice)
							: (this.registry.values.IC -= maybeDiscountPrice);
						this.registry.values.Inventories.push(...r.data.Items);
						this.cameras.main.fadeOut(500, 0, 0, 0);
						this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, (cam, effect) => {
							this.scene.start("Game", { biomeDetail: biomeDetail });
						});
					}
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
