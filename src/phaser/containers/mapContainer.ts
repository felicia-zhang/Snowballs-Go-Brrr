import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";
import { PlayFabClient } from "playfab-sdk";
import Button from "../../utils/button";
import { darkDarkBlue, overlayDepth, popupDepth } from "../../utils/constants";
import GameScene from "../scenes/game";
import BiomeNotOwnedContainer from "./biomeNotOwnedContainer";
import BiomeOwnedContainer from "./biomeOwnedContainer";

export default class MapContainer extends Phaser.GameObjects.Container {
	overlay: Phaser.GameObjects.Rectangle;
	background: RoundRectangle;
	closeButton: Button;
	icebiome: Phaser.GameObjects.Container;
	marinebiome: Phaser.GameObjects.Container;
	savannabiome: Phaser.GameObjects.Container;
	tropicalbiome: Phaser.GameObjects.Container;
	magmabiome: Phaser.GameObjects.Container;
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
		this.background = new RoundRectangle(scene, 0, 0, 640, 420, 15, darkDarkBlue);
		this.icebiome = this.makeBiomeContainer(-200, -100, "icebiome");
		this.marinebiome = this.makeBiomeContainer(0, -100, "marinebiome");
		this.savannabiome = this.makeBiomeContainer(200, -100, "savannabiome");
		this.tropicalbiome = this.makeBiomeContainer(-110, 100, "tropicalbiome");
		this.magmabiome = this.makeBiomeContainer(110, 100, "magmabiome");
		this.closeButton = new Button(scene, 307, -197, false)
			.setIcon("close")
			.setCloseAction(this, [...this.scene.interactiveObjects, ...this.scene.interactiveMapObjects], () => {
				this.biomeOwnedContainer.closeButton.invoke();
				this.biomeNotOwnedContainer.closeButton.invoke();
			});

		this.add([
			this.overlay,
			this.background,
			this.icebiome,
			this.marinebiome,
			this.savannabiome,
			this.tropicalbiome,
			this.magmabiome,
			this.closeButton,
			this.biomeOwnedContainer,
			this.biomeNotOwnedContainer,
		])
			.setDepth(popupDepth)
			.setAlpha(0);
	}

	makeBiomeContainer(x: number, y: number, biomeId: string) {
		const image = new Phaser.GameObjects.Image(this.scene, 0, 0, biomeId)
			.setScale(0.5)
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => {
				PlayFabClient.GetStoreItems({ StoreId: "Biome" }, (error, result) => {
					this.scene.interactiveMapObjects.forEach(object => object.disableInteractive());
					const biome = result.data.Store.find(
						(storeItem: PlayFabClientModels.StoreItem) => storeItem.ItemId === biomeId
					);
					biomeId in this.scene.inventories
						? this.biomeOwnedContainer.show(biome)
						: this.biomeNotOwnedContainer.show(biome, result.data.StoreId);
				});
			});
		this.scene.interactiveMapObjects.push(image);

		const container = new Phaser.GameObjects.Container(this.scene, x, y, [image]);
		if (!(biomeId in this.scene.inventories)) {
			container.add(new Phaser.GameObjects.Image(this.scene, 0, 0, "lock").setScale(0.5));
		}
		return container;
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
