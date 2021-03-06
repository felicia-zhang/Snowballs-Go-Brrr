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
import { BundleDetail } from "../../utils/types";
import GameScene from "../scenes/game";

export default class BundleContainer extends Phaser.GameObjects.Container {
	overlay: Phaser.GameObjects.Rectangle;
	background: RoundRectangle;
	bundleList: Phaser.GameObjects.Container;
	footnote: Phaser.GameObjects.Text;
	closeButton: Button;
	scene: GameScene;

	constructor(scene: GameScene, x: number, y: number) {
		super(scene, x, y, []);

		this.scene = scene;
		this.overlay = new Phaser.GameObjects.Rectangle(scene, 0, 0, 800, 600, 0x000000)
			.setDepth(overlayDepth)
			.setAlpha(0.6);
		this.background = new RoundRectangle(scene, 0, 0, 665, 270, 15, darkDarkBlue);
		this.bundleList = new Phaser.GameObjects.Container(scene, 0, 0, []);
		this.footnote = new Phaser.GameObjects.Text(
			scene,
			0,
			125,
			"*This is a mock of the payment process. No real transaction will take place in the PlayFab backend.",
			smallTextStyle
		)
			.setAlign("center")
			.setOrigin(0.5, 0.5);
		this.closeButton = new Button(scene, 319.5, -122, false)
			.setIcon("close")
			.setCloseAction(this, this.scene.interactiveObjects, () => {
				this.bundleList.removeAll(true);
			});

		this.add([this.overlay, this.background, this.bundleList, this.footnote, this.closeButton])
			.setDepth(popupDepth)
			.setAlpha(0);
	}

	show() {
		PlayFabClient.GetStoreItems({ StoreId: "CurrenciesWithDiscount" }, (error, result) => {
			result.data.Store.forEach((storeItem: PlayFabClientModels.StoreItem, index: number) => {
				this.makeBundle(storeItem, index);
			});
			if (result.data.StoreId === "CurrenciesWithDiscount") {
				this.background.height = 320;
				this.bundleList.setY(15);
				this.footnote.setY(140);
				this.closeButton.setY(-147);
				const discountText = new Phaser.GameObjects.Text(
					this.scene,
					0,
					-140,
					"ONE TIME OFFER!!\nReceive 10% off ALL in-game items after your first icicle purchase!",
					normalTextStyle
				)
					.setAlign("center")
					.setOrigin(0.5, 0.5);
				this.bundleList.add(discountText);
			} else {
				this.background.height = 270;
				this.bundleList.setY(-5);
				this.footnote.setY(120);
				this.closeButton.setY(-122);
			}
		});
		this.scene.add.tween({
			targets: [this],
			ease: "Sine.easeIn",
			duration: 500,
			alpha: 1,
			callbackScope: this,
		});
	}

	makeBundle(storeItem: PlayFabClientModels.StoreItem, index: number) {
		const bundleDetail: BundleDetail = this.scene.bundlesMap[storeItem.ItemId];
		const usd = storeItem.VirtualCurrencyPrices.RM;

		const x = 160 * index - 240;
		const background = new RoundRectangle(this.scene, x, 0, 140, 220, 15, darkBlue);

		const image = new Phaser.GameObjects.Image(this.scene, x, -10, storeItem.ItemId).setScale(0.7);
		const nameText = new Phaser.GameObjects.Text(
			this.scene,
			x,
			-90,
			bundleDetail.DisplayName.toUpperCase(),
			normalTextStyle
		)
			.setAlign("center")
			.setOrigin(0.5, 0.5);
		const button = new Button(this.scene, x, 80)
			.setText(`$ ${usd}.00`)
			.setAction(() => this.scene.purchaseBundle(bundleDetail, usd, button));
		this.bundleList.add([background, image, nameText, button]);
	}
}
