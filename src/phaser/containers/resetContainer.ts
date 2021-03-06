import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";
import Button from "../../utils/button";
import {
	darkDarkBlue,
	darkBlue,
	overlayDepth,
	popupDepth,
	normalTextStyle,
	smallTextStyle,
	largeTextStyle,
} from "../../utils/constants";
import GameScene from "../scenes/game";

export default class ResetContainer extends Phaser.GameObjects.Container {
	overlay: Phaser.GameObjects.Rectangle;
	background: RoundRectangle;
	lightBackground: RoundRectangle;
	title: Phaser.GameObjects.Text;
	closeButton: Button;
	snowballContainer: Phaser.GameObjects.Container;
	snowballLable: Phaser.GameObjects.Text;
	snowballText: Phaser.GameObjects.Text;
	snowballIcon: Phaser.GameObjects.Image;
	resetBonusContainer: Phaser.GameObjects.Container;
	resetBonusLable: Phaser.GameObjects.Text;
	resetBonusText: Phaser.GameObjects.Text;
	resetBonusIcon: Phaser.GameObjects.Image;
	footnote: Phaser.GameObjects.Text;
	resetButton: Button;
	scene: GameScene;

	constructor(scene: GameScene, x: number, y: number) {
		super(scene, x, y, []);

		this.scene = scene;
		this.overlay = new Phaser.GameObjects.Rectangle(scene, 0, 0, 800, 600, 0x000000)
			.setDepth(overlayDepth)
			.setAlpha(0.6);
		this.background = new RoundRectangle(scene, 0, 0, 510, 235, 15, darkDarkBlue);
		this.lightBackground = new RoundRectangle(scene, 0, 15, 460, 125, 15, darkBlue);
		this.title = new Phaser.GameObjects.Text(
			scene,
			0,
			-100,
			"Earn 0.01 reset bonus per 10,000 snowballs.\nReset bonus will be applied to clicks and item effects.",
			normalTextStyle
		)
			.setAlign("center")
			.setOrigin(0.5, 0);

		this.snowballText = new Phaser.GameObjects.Text(scene, 48, 25, "", largeTextStyle);
		this.snowballIcon = new Phaser.GameObjects.Image(scene, 22, 39, "snowball").setScale(0.22);
		this.snowballContainer = new Phaser.GameObjects.Container(scene, -215, -50, [
			this.snowballText,
			this.snowballIcon,
		]);

		this.resetBonusText = new Phaser.GameObjects.Text(scene, 48, 25, "", largeTextStyle);
		this.resetBonusIcon = new Phaser.GameObjects.Image(scene, 22, 36, "star").setScale(0.22);
		this.resetBonusContainer = new Phaser.GameObjects.Container(scene, 70, -50, [
			this.resetBonusText,
			this.resetBonusIcon,
		]);

		this.footnote = new Phaser.GameObjects.Text(
			scene,
			0,
			87,
			"*Reset will NOT affect your in-app purchase history or your icicle balance",
			smallTextStyle
		)
			.setAlign("center")
			.setOrigin(0.5, 0);
		this.resetButton = new Button(scene, 0, 45).setText("RESET").setAction(() => scene.reset(this.resetButton));
		this.closeButton = new Button(scene, 242, -104.5, false)
			.setIcon("close")
			.setCloseAction(this, this.scene.interactiveObjects, () => {
				this.resetButton.resetButton();
			});

		this.add([
			this.overlay,
			this.background,
			this.lightBackground,
			this.title,
			this.snowballContainer,
			this.resetBonusContainer,
			this.footnote,
			this.resetButton,
			this.closeButton,
		])
			.setDepth(popupDepth)
			.setAlpha(0);
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
