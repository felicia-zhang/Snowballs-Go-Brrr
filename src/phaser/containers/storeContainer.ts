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
import { numberWithCommas, wrapStringLong } from "../../utils/stringFormat";
import { ItemDetail } from "../../utils/types";
import GameScene from "../scenes/game";

export default class StoreContainer extends Phaser.GameObjects.Container {
	overlay: Phaser.GameObjects.Rectangle;
	background: RoundRectangle;
	itemList: Phaser.GameObjects.Container;
	closeButton: Button;
	scene: GameScene;
	storeItems: PlayFabClientModels.StoreItem[];

	constructor(scene: GameScene, x: number, y: number) {
		super(scene, x, y, []);

		this.scene = scene;
		this.storeItems = [];
		this.overlay = new Phaser.GameObjects.Rectangle(scene, 0, 0, 800, 600, 0x000000)
			.setDepth(overlayDepth)
			.setAlpha(0.6);
		this.background = new RoundRectangle(scene, 0, 0, 420, 550, 15, darkDarkBlue);
		this.itemList = new Phaser.GameObjects.Container(scene, 0, 0, []);
		this.closeButton = new Button(scene, 197, -262, false)
			.addIcon("close")
			.addCloseCallback(this, this.scene.interactiveObjects, () => {
				this.itemList.removeAll(true);
				this.storeItems = [];
			});

		this.add([this.overlay, this.background, this.itemList, this.closeButton]).setDepth(popupDepth).setAlpha(0);
	}

	show() {
		PlayFabClient.GetStoreItems({ StoreId: this.scene.biomeId }, (error, result) => {
			const storeId = result.data.StoreId;
			result.data.Store.forEach((storeItem: PlayFabClientModels.StoreItem) => {
				this.makeStoreItem(storeItem, storeId);
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

	makeStoreItem(storeItem: PlayFabClientModels.StoreItem, storeId: string) {
		const itemDetail: ItemDetail = this.scene.itemsMap[storeItem.ItemId];
		const maybeItemDiscountPrice = storeItem.VirtualCurrencyPrices.SB;

		const index = this.storeItems.length;
		const y = -210 + index * 105;
		this.storeItems.push(storeItem);
		const image = new Phaser.GameObjects.Image(this.scene, -145, y, storeItem.ItemId).setScale(0.35);
		const nameText = new Phaser.GameObjects.Text(
			this.scene,
			-100,
			y - 27,
			itemDetail.DisplayName.toUpperCase(),
			normalTextStyle
		)
			.setAlign("left")
			.setOrigin(0, 0.5);
		const description = itemDetail.Description.split("\n");
		const descriptionText = new Phaser.GameObjects.Text(
			this.scene,
			-100,
			y + 5,
			wrapStringLong(description[0]),
			smallTextStyle
		)
			.setAlign("left")
			.setOrigin(0, 0.5);
		const effectText = new Phaser.GameObjects.Text(this.scene, -100, y + 30, description[2], smallTextStyle)
			.setAlign("left")
			.setOrigin(0, 0.5);
		const background = new RoundRectangle(this.scene, 0, y, 380, 90, 15, darkBlue);

		const button = new Button(this.scene, 170, y)
			.addIcon("snowball")
			.setText(`${numberWithCommas(maybeItemDiscountPrice / 100)} x`)
			.addCallback(() => this.scene.purchaseItem(itemDetail, maybeItemDiscountPrice, storeId, button));
		button.setX(180 - button.background.width / 2);
		this.itemList.add([background, image, nameText, descriptionText, effectText, button]);

		if (storeId === `${this.scene.biomeId}WithDiscount`) {
			button.setY(y + 10);

			const fullPriceText = new Phaser.GameObjects.Text(
				this.scene,
				141,
				y - 25,
				`${numberWithCommas(storeItem.CustomData.FullPrice / 100)} x`,
				smallTextStyle
			)
				.setAlign("right")
				.setOrigin(1, 0.5);
			const oldSnowballIcon = new Phaser.GameObjects.Image(this.scene, 155, y - 25, "snowball").setScale(0.09);
			const line = new Phaser.GameObjects.Line(
				this.scene,
				0,
				0,
				170,
				y - 25,
				205 + fullPriceText.width,
				y - 25,
				0xffffff
			).setOrigin(1, 0.5);
			this.itemList.add([fullPriceText, oldSnowballIcon, line]);
		}
	}
}
