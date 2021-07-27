import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";
import CloseButton from "../utils/closeButton";
import { darkBackgroundColor, overlayDepth, popupDepth } from "../utils/constants";
import GameScene from "./game";

export default class MapContainer extends Phaser.GameObjects.Container {
	overlay: Phaser.GameObjects.Rectangle;
	background: RoundRectangle;
	closeButton: CloseButton;
	scene: GameScene;

	constructor(scene: GameScene, x: number, y: number) {
		super(scene, x, y, []);

		this.scene = scene;
		this.overlay = new Phaser.GameObjects.Rectangle(scene, 0, 0, 800, 600, 0x000000)
			.setDepth(overlayDepth)
			.setAlpha(0.6);
		this.background = new RoundRectangle(scene, 0, 0, 440, 420, 15, darkBackgroundColor);
		this.closeButton = new CloseButton(scene, 207.5, -197.5).addCallback(this, () => {});

		this.add([this.overlay, this.background, this.closeButton]).setDepth(popupDepth).setAlpha(0);
	}

	show() {}
}
