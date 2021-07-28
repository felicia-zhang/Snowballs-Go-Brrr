import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";
import { PlayFabClient } from "playfab-sdk";
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

export default class MapContainer extends Phaser.GameObjects.Container {
	overlay: Phaser.GameObjects.Rectangle;
	background: RoundRectangle;
	biomeList: Phaser.GameObjects.Container;
	closeButton: Button;
	scene: GameScene;

	constructor(scene: GameScene, x: number, y: number) {
		super(scene, x, y, []);

		this.scene = scene;
		this.overlay = new Phaser.GameObjects.Rectangle(scene, 0, 0, 800, 600, 0x000000)
			.setDepth(overlayDepth)
			.setAlpha(0.6);
		this.background = new RoundRectangle(scene, 0, 0, 540, 570, 15, darkDarkBlue);
		this.biomeList = new Phaser.GameObjects.Container(scene, 0, 0, []);
		this.closeButton = new Button(scene, 257, -272, false)
			.addIcon("close")
			.addCloseCallback(this, this.scene.interactiveObjects, () => {
				this.biomeList.removeAll(true);
			});

		this.add([this.overlay, this.background, this.biomeList, this.closeButton]).setDepth(popupDepth).setAlpha(0);
	}

	show() {
		PlayFabClient.GetStoreItems({ StoreId: "Biome" }, (error, result) => {
			result.data.Store.forEach((biomeItem: PlayFabClientModels.StoreItem, index: number) => {
				biomeItem.ItemId in this.scene.biomeItems
					? this.makeOwnedBiome(biomeItem, result.data.StoreId, index)
					: this.makeNotOwnedBiome(biomeItem, result.data.StoreId, index);
			});
		});
		this.scene.add.tween({
			targets: [this],
			ease: "Sine.easeIn",
			duration: 500,
			alpha: 1,
			callbackScope: this,
		});
	}

	makeOwnedBiome(biomeItem: PlayFabClientModels.StoreItem, storeId: string, index: number) {
		const biomeDetail: BiomeDetail = this.scene.biomeMap[biomeItem.ItemId];

		const y = -220 + index * 110;
		const image = new Phaser.GameObjects.Image(this.scene, -200, y, biomeItem.ItemId).setScale(0.25);
		const nameText = new Phaser.GameObjects.Text(
			this.scene,
			-130,
			y - 20,
			biomeDetail.DisplayName.toUpperCase(),
			normalTextStyle
		)
			.setAlign("left")
			.setOrigin(0, 0.5);
		const descriptionText = new Phaser.GameObjects.Text(
			this.scene,
			-130,
			y + 30,
			biomeDetail.Description,
			smallTextStyle
		)
			.setAlign("left")
			.setOrigin(0, 0.5);
		const background = new RoundRectangle(this.scene, 0, y, 510, 95, 15, darkBlue);
		const visitButton = new Button(this.scene, 170, y - 12).setText("VISIT").addCallback(() => {
			this.scene.syncData(() => {
				this.scene.cameras.main.fadeOut(500, 0, 0, 0);
				this.scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, (cam, effect) => {
					this.scene.scene.start("Game", { biomeId: biomeDetail.ItemId, biomeName: biomeDetail.DisplayName });
				});
			});
		});
		visitButton.setX(170 - visitButton.background.width / 2);
		this.biomeList.add([background, image, nameText, descriptionText, visitButton]);

		// Object.keys(this.scene.biomeItems[biomeItem.ItemId]).forEach((itemId: string, i: number) => {
		// 	const text = new Phaser.GameObjects.Text(
		// 		this.scene,
		// 		0,
		// 		20 * i,
		// 		`${this.scene.itemsMap[itemId].DisplayName}: ${this.scene.biomeItems[biomeItem.ItemId][itemId]}`,
		// 		normalTextStyle
		// 	)
		// 		.setAlign("left")
		// 		.setOrigin(0, 0);
		// 	this.itemCounter.add(text);
		// });
	}

	makeNotOwnedBiome(biomeItem: PlayFabClientModels.StoreItem, storeId: string, index: number) {
		const biomeDetail: BiomeDetail = this.scene.biomeMap[biomeItem.ItemId];
		const maybeDiscountSnowballPrice = biomeItem.VirtualCurrencyPrices.SB;
		const maybeDiscountIciclePrice = biomeItem.VirtualCurrencyPrices.IC;

		const y = -220 + index * 110;
		const image = new Phaser.GameObjects.Image(this.scene, -200, y, biomeItem.ItemId).setScale(0.25);
		const nameText = new Phaser.GameObjects.Text(
			this.scene,
			-130,
			y - 20,
			biomeDetail.DisplayName.toUpperCase(),
			normalTextStyle
		)
			.setAlign("left")
			.setOrigin(0, 0.5);
		const descriptionText = new Phaser.GameObjects.Text(
			this.scene,
			-130,
			y + 30,
			biomeDetail.Description,
			smallTextStyle
		)
			.setAlign("left")
			.setOrigin(0, 0.5);
		const background = new RoundRectangle(this.scene, 0, y, 510, 95, 15, darkBlue);
		const snowballButton = new Button(this.scene, 170, y - 12)
			.addIcon("snowball")
			.setText(`${numberWithCommas(maybeDiscountSnowballPrice / 100)} x`)
			.addCallback(() =>
				this.scene.purchaseBiome(biomeDetail, maybeDiscountSnowballPrice, "SB", snowballButton, storeId)
			);
		snowballButton.setX(170 - snowballButton.background.width / 2);
		const icicleButton = new Button(this.scene, 170, y - 12)
			.addIcon("icicle")
			.setText(`${numberWithCommas(maybeDiscountIciclePrice)} x`)
			.addCallback(() =>
				this.scene.purchaseBiome(biomeDetail, maybeDiscountIciclePrice, "IC", icicleButton, storeId)
			);
		icicleButton.setX(270 - icicleButton.background.width / 2);
		const lock = new Phaser.GameObjects.Image(this.scene, -200, y, "lock").setScale(0.2);
		this.biomeList.add([background, image, nameText, descriptionText, snowballButton, icicleButton, lock]);

		if (storeId === "BiomeWithDiscount") {
			snowballButton.setY(y - 2);
			icicleButton.setY(y - 2);

			const fullSnowballPriceText = new Phaser.GameObjects.Text(
				this.scene,
				131,
				y - 32,
				`${numberWithCommas(biomeDetail.FullSnowballPrice / 100)} x`,
				smallTextStyle
			)
				.setAlign("right")
				.setOrigin(1, 0.5);
			const fullIciclePriceText = new Phaser.GameObjects.Text(
				this.scene,
				230,
				y - 32,
				`${numberWithCommas(biomeDetail.FullIciclePrice)} x`,
				smallTextStyle
			)
				.setAlign("right")
				.setOrigin(1, 0.5);

			const oldSnowballIcon = new Phaser.GameObjects.Image(this.scene, 145, y - 32, "snowball").setScale(0.09);
			const oldIcicleIcon = new Phaser.GameObjects.Image(this.scene, 250, y - 32, "icicle").setScale(0.09);

			const snowballLine = new Phaser.GameObjects.Line(
				this.scene,
				0,
				0,
				165,
				y - 32,
				205 + fullSnowballPriceText.width,
				y - 32,
				0xffffff
			).setOrigin(1, 0.5);
			const icicleLine = new Phaser.GameObjects.Line(
				this.scene,
				0,
				0,
				250,
				y - 32,
				300 + fullIciclePriceText.width,
				y - 32,
				0xffffff
			).setOrigin(1, 0.5);
			this.biomeList.add([
				fullSnowballPriceText,
				oldSnowballIcon,
				snowballLine,
				fullIciclePriceText,
				oldIcicleIcon,
				icicleLine,
			]);
		}
	}
}
