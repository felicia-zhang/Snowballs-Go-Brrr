import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";
import CloseButton from "../utils/closeButton";
import { PlayFabClient } from "playfab-sdk";
import { darkBackgroundColor, overlayDepth, popupDepth } from "../utils/constants";
import { ItemCounter } from "../utils/types";
import GameScene from "./game";

export default class MapContainer extends Phaser.GameObjects.Container {
	overlay: Phaser.GameObjects.Rectangle;
	background: RoundRectangle;
	closeButton: CloseButton;
	biomeStoreId: string;
	icebiome: Phaser.GameObjects.Image;
	marinebiome: Phaser.GameObjects.Image;
	savannabiome: Phaser.GameObjects.Image;
	tropicalbiome: Phaser.GameObjects.Image;
	magmabiome: Phaser.GameObjects.Image;
	interactiveMapObjects: Phaser.GameObjects.GameObject[];
	scene: GameScene;
	biomeItems: { [key: number]: ItemCounter };

	constructor(scene: GameScene, x: number, y: number) {
		super(scene, x, y, []);

		this.scene = scene;
		this.biomeItems = {};
		this.interactiveMapObjects = [];
		this.biomeStoreId = "";
		this.overlay = new Phaser.GameObjects.Rectangle(scene, 0, 0, 800, 600, 0x000000)
			.setDepth(overlayDepth)
			.setAlpha(0.6);
		this.background = new RoundRectangle(scene, 0, 0, 440, 420, 15, darkBackgroundColor);
		this.icebiome = this.makeBiomeImage(200, 200, "icebiome");
		this.marinebiome = this.makeBiomeImage(400, 200, "marinebiome");
		this.savannabiome = this.makeBiomeImage(600, 200, "savannabiome");
		this.tropicalbiome = this.makeBiomeImage(290, 400, "tropicalbiome");
		this.magmabiome = this.makeBiomeImage(490, 400, "magmabiome");
		this.closeButton = new CloseButton(scene, 207.5, -197.5).addCallback(this, () => {});

		this.add([
			this.overlay,
			this.background,
			this.icebiome,
			this.marinebiome,
			this.savannabiome,
			this.tropicalbiome,
			this.magmabiome,
			this.closeButton,
		])
			.setDepth(popupDepth)
			.setAlpha(0);
	}

	makeBiomeImage(x: number, y: number, biomeId: string) {
		const image = new Phaser.GameObjects.Image(this.scene, x, y, biomeId)
			.setScale(0.5)
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => {
				PlayFabClient.GetStoreItems({ StoreId: "Biome" }, (error, result) => {
					this.biomeStoreId = result.data.StoreId;
					this.interactiveMapObjects.forEach(object => object.disableInteractive());
					const biome = result.data.Store.find(
						(storeItem: PlayFabClientModels.StoreItem) => storeItem.ItemId === biomeId
					);
					biomeId in this.biomeItems
						? this.showBiomeOwnedContainer(biome, biomeId)
						: this.showBiomeNotOwnedContainer(biome, biomeId);
				});
			});
		this.interactiveMapObjects.push(image);
		if (!(biomeId in this.biomeItems)) {
			new Phaser.GameObjects.Image(this.scene, x, y, "lock").setScale(0.5);
		}
		return image;
	}

	show() {
		this.scene.add.tween({
			targets: [this],
			ease: "Sine.easeIn",
			duration: 500,
			alpha: 1,
			callbackScope: this,
		});
	}
}
