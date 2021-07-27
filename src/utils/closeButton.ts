import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";
import GameScene from "../phaser/game";
import MapScene from "../phaser/map";
import { closeButtonFill, darkBlue, lightBlue, normalBlue } from "./constants";

export default class CloseButton extends Phaser.GameObjects.Container {
	background: RoundRectangle;
	line1: Phaser.GameObjects.Line;
	line2: Phaser.GameObjects.Line;
	scene: GameScene | MapScene;

	constructor(scene: GameScene | MapScene, x: number, y: number) {
		super(scene, x, y, []);

		this.scene = scene;

		this.background = new RoundRectangle(scene, 0, 0, 35, 35, 5, closeButtonFill)
			.setStrokeStyle(6, lightBlue, 1)
			.setInteractive({ useHandCursor: true })
			.on("pointerover", () => {
				this.background.setStrokeStyle(6, normalBlue, 1);
			})
			.on("pointerout", () => {
				this.background.setStrokeStyle(6, lightBlue, 1);
			})
			.on("pointerdown", () => {
				this.background.setStrokeStyle(6, darkBlue, 1);
			});

		this.line1 = new Phaser.GameObjects.Line(scene, 0, 0, 0, 17, 17, 0, darkBlue).setLineWidth(3, 3);
		this.line2 = new Phaser.GameObjects.Line(scene, 0, 0, 0, 0, 17, 17, darkBlue).setLineWidth(3, 3);

		this.add([this.background, this.line1, this.line2]);
	}

	addCallback(container: Phaser.GameObjects.Container, callback: () => any): this {
		this.background.on("pointerup", () => {
			this.scene.add.tween({
				targets: [container],
				ease: "Sine.easeIn",
				duration: 300,
				alpha: 0,
				onComplete: () => {
					this.background.setStrokeStyle(6, lightBlue, 1);
					this.scene.interactiveObjects.forEach(object => object.setInteractive({ useHandCursor: true }));
					callback();
				},
			});
		});

		return this;
	}
}
