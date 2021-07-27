import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";
import Button from "../utils/button";
import CloseButton from "../utils/closeButton";
import { PlayFabClient } from "playfab-sdk";
import {
	darkBackgroundColor,
	fontFamily,
	lightBackgroundColor,
	overlayDepth,
	popupDepth,
	smallFontSize,
	textStyle,
} from "../utils/constants";
import { numberWithCommas, wrapString } from "../utils/stringFormat";
import { BiomeDetail } from "../utils/types";
import GameScene from "./game";
import { showToast } from "./showToast";

export default class BiomeNotOwnedContainer extends Phaser.GameObjects.Container {
	overlay: Phaser.GameObjects.Rectangle;
	background: RoundRectangle;
	lightBackground: RoundRectangle;
	biomeImage: Phaser.GameObjects.Image;
	title: Phaser.GameObjects.Text;
	description: Phaser.GameObjects.Text;
	snowballButton: Button;
	icicleButton: Button;
	biomeDetail: Phaser.GameObjects.Container;
	closeButton: CloseButton;
	scene: GameScene;

	constructor(scene: GameScene, x: number, y: number) {
		super(scene, x, y, []);

		this.scene = scene;
		this.overlay = new Phaser.GameObjects.Rectangle(scene, 0, 0, 800, 600, 0x000000)
			.setDepth(overlayDepth)
			.setAlpha(0.6);
		this.background = new RoundRectangle(scene, 0, 0, 520, 340, 15, darkBackgroundColor);
		this.biomeImage = new Phaser.GameObjects.Image(scene, -115, -10, "icebiome").setScale(0.7);

		this.lightBackground = new RoundRectangle(scene, 0, 0, 200, 300, 15, lightBackgroundColor);
		this.title = new Phaser.GameObjects.Text(scene, 0, -130, "", textStyle).setAlign("center").setOrigin(0.5, 0.5);
		this.snowballButton = new Button(scene, 0, 70).addIcon("snowball");
		this.icicleButton = new Button(scene, 0, 120).addIcon("icicle");
		this.description = new Phaser.GameObjects.Text(scene, -84, -110, "", textStyle)
			.setAlign("left")
			.setOrigin(0, 0);
		this.biomeDetail = new Phaser.GameObjects.Container(scene, 140, 0, [
			this.lightBackground,
			this.title,
			this.snowballButton,
			this.icicleButton,
			new Phaser.GameObjects.Container(scene, 0, 0, []),
			this.description,
		]);

		this.closeButton = new CloseButton(scene, 247.5, -157.5).addCallback(this, () => {
			this.snowballButton.removeListener("pointerup").resetButton();
			this.icicleButton.removeListener("pointerup").resetButton();
			const discounts = this.biomeDetail.getAt(4) as Phaser.GameObjects.Container;
			discounts.removeAll(true);
		});

		this.add([this.overlay, this.background, this.biomeImage, this.biomeDetail, this.closeButton])
			.setDepth(popupDepth)
			.setAlpha(0);
	}

	show(biome: PlayFabClientModels.StoreItem, imageKey: string, storeId: string) {
		const biomeDetail: BiomeDetail = this.scene.biomeMap[biome.ItemId];
		const maybeDiscountSnowballPrice = biome.VirtualCurrencyPrices.SB;
		const maybeDiscountIciclePrice = biome.VirtualCurrencyPrices.IC;

		this.title.setText(`${biomeDetail.DisplayName.toUpperCase()}`);
		this.snowballButton.setText(`${numberWithCommas(maybeDiscountSnowballPrice / 100)} x`).addCallback(() => {
			this.purchaseBiome(biomeDetail, maybeDiscountSnowballPrice, "SB", this.snowballButton, storeId);
		});
		this.icicleButton.setText(`${numberWithCommas(maybeDiscountIciclePrice)} x`).addCallback(() => {
			this.purchaseBiome(biomeDetail, maybeDiscountIciclePrice, "IC", this.icicleButton, storeId);
		});

		this.biomeImage.setTexture(imageKey);
		this.description.setText(wrapString(biomeDetail.Description));
		this.scene.add.tween({
			targets: [this],
			ease: "Sine.easeIn",
			duration: 500,
			alpha: 1,
			callbackScope: this,
		});

		if (storeId === "BiomeWithDiscount") {
			this.snowballButton.setY(55);
			const fullSnowballPriceText = new Phaser.GameObjects.Text(
				this.scene,
				-10,
				20,
				`${numberWithCommas(biomeDetail.FullSnowballPrice / 100)} x`,
				{
					fontSize: smallFontSize,
					fontFamily: fontFamily,
				}
			)
				.setAlign("center")
				.setOrigin(0.5, 0.5);
			const fullIciclePriceText = new Phaser.GameObjects.Text(
				this.scene,
				-10,
				90,
				`${numberWithCommas(biomeDetail.FullIciclePrice)} x`,
				{
					fontSize: smallFontSize,
					fontFamily: fontFamily,
				}
			)
				.setAlign("center")
				.setOrigin(0.5, 0.5);
			const oldSnowballIcon = new Phaser.GameObjects.Image(
				this.scene,
				(fullSnowballPriceText.width + 8) / 2,
				20,
				"snowball"
			).setScale(0.09);
			const oldIcicleIcon = new Phaser.GameObjects.Image(
				this.scene,
				(fullIciclePriceText.width + 8) / 2,
				90,
				"icicle"
			).setScale(0.09);
			const snowballLine = new Phaser.GameObjects.Line(
				this.scene,
				0,
				10,
				0,
				10,
				35 + fullSnowballPriceText.width,
				10,
				0xffffff
			).setOrigin(0.5, 0.5);
			const icicleLine = new Phaser.GameObjects.Line(
				this.scene,
				0,
				45,
				0,
				45,
				35 + fullIciclePriceText.width,
				45,
				0xffffff
			).setOrigin(0.5, 0.5);
			const discounts = this.biomeDetail.getAt(4) as Phaser.GameObjects.Container;
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

	purchaseBiome(
		biomeDetail: BiomeDetail,
		maybeDiscountPrice: number,
		currencyType: string,
		button: Button,
		storeId: string
	) {
		button.toggleLoading(true);
		PlayFabClient.PurchaseItem(
			{
				ItemId: biomeDetail.ItemId,
				Price: maybeDiscountPrice,
				StoreId: storeId,
				VirtualCurrency: currencyType,
			},
			(e, r) => {
				if (e !== null) {
					this.scene.time.addEvent({
						delay: 400,
						callback: () => {
							button.toggleLoading(false);
							currencyType === "SB"
								? showToast(this.scene, "Not enough snowballs", true)
								: showToast(this.scene, "Not enough icicles", true);
						},
					});
				} else {
					this.scene.time.addEvent({
						delay: 400,
						callback: () => {
							button.toggleLoading(false);
							currencyType === "SB"
								? (this.scene.registry.values.SB -= maybeDiscountPrice)
								: (this.scene.registry.values.IC -= maybeDiscountPrice);
							this.scene.registry.values.Inventories.push(...r.data.Items);
							this.scene.cameras.main.fadeOut(500, 0, 0, 0);
							this.scene.cameras.main.once(
								Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
								(cam, effect) => {
									this.scene.scene.start("Game", {
										biomeId: biomeDetail.ItemId,
										biomeName: biomeDetail.DisplayName,
									});
								}
							);
						},
					});
				}
			}
		);
	}
}
