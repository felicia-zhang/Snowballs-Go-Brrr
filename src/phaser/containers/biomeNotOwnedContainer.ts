import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";
import Button from "../../utils/button";
import {
	darkDarkBlue,
	darkBlue,
	overlayDepth,
	popupDepth,
	normalTextStyle,
	smallTextStyle,
} from "../../utils/constants";
import { numberWithCommas, wrapString } from "../../utils/stringFormat";
import { BiomeDetail } from "../../utils/types";
import GameScene from "../scenes/game";

export default class BiomeNotOwnedContainer extends Phaser.GameObjects.Container {
	overlay: Phaser.GameObjects.Rectangle;
	background: RoundRectangle;
	lightBackground: RoundRectangle;
	biomeImage: Phaser.GameObjects.Image;
	title: Phaser.GameObjects.Text;
	description: Phaser.GameObjects.Text;
	snowballButton: Button;
	icicleButton: Button;
	discounts: Phaser.GameObjects.Container;
	biomeDetail: Phaser.GameObjects.Container;
	closeButton: Button;
	scene: GameScene;

	constructor(scene: GameScene, x: number, y: number) {
		super(scene, x, y, []);

		this.scene = scene;
		this.overlay = new Phaser.GameObjects.Rectangle(scene, 0, 0, 800, 600, 0x000000)
			.setDepth(overlayDepth)
			.setAlpha(0.6);
		this.background = new RoundRectangle(scene, 0, 0, 520, 340, 15, darkDarkBlue);
		this.biomeImage = new Phaser.GameObjects.Image(scene, -115, -10, "icebiome").setScale(0.7);

		this.lightBackground = new RoundRectangle(scene, 0, 0, 200, 300, 15, darkBlue);
		this.title = new Phaser.GameObjects.Text(scene, 0, -130, "", normalTextStyle)
			.setAlign("center")
			.setOrigin(0.5, 0.5);
		this.snowballButton = new Button(scene, 0, 70).setIcon("snowball");
		this.icicleButton = new Button(scene, 0, 120).setIcon("icicle");
		this.description = new Phaser.GameObjects.Text(scene, -84, -110, "", normalTextStyle)
			.setAlign("left")
			.setOrigin(0, 0);
		this.discounts = new Phaser.GameObjects.Container(scene, 0, 0, []);
		this.biomeDetail = new Phaser.GameObjects.Container(scene, 140, 0, [
			this.lightBackground,
			this.title,
			this.snowballButton,
			this.icicleButton,
			this.discounts,
			this.description,
		]);

		this.closeButton = new Button(scene, 247, -157, false)
			.setIcon("close")
			.setCloseAction(this, this.scene.interactiveMapObjects, () => {
				this.snowballButton.removeListener("pointerup").resetButton();
				this.icicleButton.removeListener("pointerup").resetButton();
				this.discounts.removeAll(true);
			});

		this.add([this.overlay, this.background, this.biomeImage, this.biomeDetail, this.closeButton])
			.setDepth(popupDepth)
			.setAlpha(0);
	}

	show(biome: PlayFabClientModels.StoreItem, storeId: string) {
		const biomeDetail: BiomeDetail = this.scene.biomeMap[biome.ItemId];
		const maybeDiscountSnowballPrice = biome.VirtualCurrencyPrices.SB;
		const maybeDiscountIciclePrice = biome.VirtualCurrencyPrices.IC;

		this.title.setText(`${biomeDetail.DisplayName.toUpperCase()}`);
		this.snowballButton.setText(`${numberWithCommas(maybeDiscountSnowballPrice / 100)} x`).setAction(() => {
			this.scene.purchaseBiome(biomeDetail, maybeDiscountSnowballPrice, "SB", this.snowballButton, storeId);
		});
		this.icicleButton.setText(`${numberWithCommas(maybeDiscountIciclePrice)} x`).setAction(() => {
			this.scene.purchaseBiome(biomeDetail, maybeDiscountIciclePrice, "IC", this.icicleButton, storeId);
		});

		this.biomeImage.setTexture(biome.ItemId);
		this.description.setText(wrapString(biomeDetail.Description, 21));
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
				smallTextStyle
			)
				.setAlign("center")
				.setOrigin(0.5, 0.5);
			const fullIciclePriceText = new Phaser.GameObjects.Text(
				this.scene,
				-10,
				90,
				`${numberWithCommas(biomeDetail.FullIciclePrice)} x`,
				smallTextStyle
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
			this.discounts.add([
				fullSnowballPriceText,
				fullIciclePriceText,
				oldSnowballIcon,
				oldIcicleIcon,
				snowballLine,
				icicleLine,
			]);
		}
	}
}
