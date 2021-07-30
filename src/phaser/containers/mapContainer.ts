import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";
import { PlayFabClient } from "playfab-sdk";
import Button from "../../utils/button";
import {
	darkDarkBlue,
	darkBlue,
	overlayDepth,
	popupDepth,
	normalTextStyle,
} from "../../utils/constants";
import { BiomeDetail } from "../../utils/types";
import GameScene from "../scenes/game";
import BiomeNotOwnedContainer from "./biomeNotOwnedContainer";
import BiomeOwnedContainer from "./biomeOwnedContainer";

export default class MapContainer extends Phaser.GameObjects.Container {
	overlay: Phaser.GameObjects.Rectangle;
	background: RoundRectangle;
	closeButton: Button;
	biomeList: Phaser.GameObjects.Container;
	biomeOwnedContainer: BiomeOwnedContainer;
	biomeNotOwnedContainer: BiomeNotOwnedContainer;
	scene: GameScene;

	constructor(scene: GameScene, x: number, y: number) {
		super(scene, x, y, []);

		this.scene = scene;
		this.biomeOwnedContainer = new BiomeOwnedContainer(scene, 0, 0);
		this.biomeNotOwnedContainer = new BiomeNotOwnedContainer(scene, 0, 0);
		this.overlay = new Phaser.GameObjects.Rectangle(scene, 0, 0, 800, 600, 0x000000)
			.setDepth(overlayDepth)
			.setAlpha(0.6);
		this.background = new RoundRectangle(scene, 0, 0, 380, 500, 15, darkDarkBlue);
		this.biomeList = new Phaser.GameObjects.Container(scene, 0, 0, []);
		this.closeButton = new Button(scene, 192, -272, false)
			.setIcon("close")
			.setCloseAction(this, [...this.scene.interactiveObjects, ...this.scene.interactiveMapObjects], () => {
				this.biomeOwnedContainer.closeButton.invoke();
				this.biomeNotOwnedContainer.closeButton.invoke();
			});

		this.add([
			this.overlay,
			this.background,
			this.biomeList,
			this.closeButton,
			this.biomeOwnedContainer,
			this.biomeNotOwnedContainer,
		])
			.setDepth(popupDepth)
			.setAlpha(0);
	}

	show() {
		PlayFabClient.GetStoreItems({ StoreId: "Biome" }, (error, result) => {
			result.data.Store.forEach((biomeItem: PlayFabClientModels.StoreItem, index: number) => {
				this.makeBiome(biomeItem, result.data.StoreId, index)
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

	makeBiome(biomeItem: PlayFabClientModels.StoreItem, storeId: string, index: number) {
		const biomeDetail: BiomeDetail = this.scene.biomeMap[biomeItem.ItemId];

		const y = -190 + index * 95;
		const image = new Phaser.GameObjects.Image(this.scene, -125, y, biomeItem.ItemId).setScale(0.2);
		const nameText = new Phaser.GameObjects.Text(
			this.scene,
			-80,
			y,
			biomeDetail.DisplayName.toUpperCase(),
			normalTextStyle
		)
			.setAlign("left")
			.setOrigin(0, 0.5);
		const background = new RoundRectangle(this.scene, 0, y, 340, 80, 15, darkBlue);
		const detailButton = new Button(this.scene, 150, y).setText("DETAIL").setAction(() => {
			this.scene.interactiveMapObjects.forEach(object => object.disableInteractive());
			biomeItem.ItemId in this.scene.inventories
			? this.biomeOwnedContainer.show(biomeItem)
			: this.biomeNotOwnedContainer.show(biomeItem, storeId);
		});
		detailButton.setX(160 - detailButton.background.width / 2);
		this.biomeList.add([background, image, nameText, detailButton]);

		if (!(biomeItem.ItemId in this.scene.inventories)) {
			this.biomeList.add(new Phaser.GameObjects.Image(this.scene, -125, y, "lock").setScale(0.2))
		}
	}
}
