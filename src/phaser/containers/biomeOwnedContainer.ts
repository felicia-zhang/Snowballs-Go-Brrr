import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";
import Button from "../../utils/button";
import { darkDarkBlue, darkBlue, overlayDepth, popupDepth, normalTextStyle } from "../../utils/constants";
import { wrapString } from "../../utils/stringFormat";
import { BiomeDetail } from "../../utils/types";
import GameScene from "../scenes/game";

export default class BiomeOwnedContainer extends Phaser.GameObjects.Container {
	overlay: Phaser.GameObjects.Rectangle;
	background: RoundRectangle;
	lightBackground: RoundRectangle;
	biomeImage: Phaser.GameObjects.Image;
	title: Phaser.GameObjects.Text;
	description: Phaser.GameObjects.Text;
	visitButton: Button;
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
		this.visitButton = new Button(scene, 0, 120).setText("VISIT");
		this.description = new Phaser.GameObjects.Text(scene, -84, -110, "", normalTextStyle)
			.setAlign("left")
			.setOrigin(0, 0);
		this.biomeDetail = new Phaser.GameObjects.Container(scene, 140, 0, [
			this.lightBackground,
			this.title,
			this.visitButton,
			new Phaser.GameObjects.Container(scene, -84, -15, []),
			this.description,
		]);
		this.closeButton = new Button(scene, 247, -157, false)
			.addIcon("close")
			.addCloseCallback(this, this.scene.interactiveMapObjects, () => {
				this.visitButton.removeListener("pointerup").resetButton();
				const counterText = this.biomeDetail.getAt(3) as Phaser.GameObjects.Container;
				counterText.removeAll(true);
			});

		this.add([this.overlay, this.background, this.biomeImage, this.biomeDetail, this.closeButton])
			.setDepth(popupDepth)
			.setAlpha(0);
	}

	show(biome: PlayFabClientModels.StoreItem, imageKey: string) {
		const biomeDetail: BiomeDetail = this.scene.biomeMap[biome.ItemId];

		this.title.setText(`${biomeDetail.DisplayName.toUpperCase()}`);
		this.visitButton.addCallback(() => {
			this.scene.syncData(() => {
				this.scene.cameras.main.fadeOut(500, 0, 0, 0);
				this.scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, (cam, effect) => {
					this.scene.scene.start("Game", { biomeId: biomeDetail.ItemId, biomeName: biomeDetail.DisplayName });
				});
			});
		});
		this.biomeImage.setTexture(imageKey);
		this.description.setText(wrapString(biomeDetail.Description, 21));
		const counterText = this.biomeDetail.getAt(3) as Phaser.GameObjects.Container;
		Object.keys(this.scene.biomeItems[biome.ItemId]).forEach((itemId: string, i: number) => {
			const text = new Phaser.GameObjects.Text(
				this.scene,
				0,
				20 * i,
				`${this.scene.itemsMap[itemId].DisplayName}: ${this.scene.biomeItems[biome.ItemId][itemId]}`,
				normalTextStyle
			)
				.setAlign("left")
				.setOrigin(0, 0);
			counterText.add(text);
		});
		this.scene.add.tween({
			targets: [this],
			ease: "Sine.easeIn",
			duration: 500,
			alpha: 1,
			callbackScope: this,
		});
	}
}
