import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";
import Button from "../utils/button";
import CloseButton from "../utils/closeButton";
import { darkBackgroundColor, lightBackgroundColor, overlayDepth, popupDepth, textStyle } from "../utils/constants";
import { numberWithCommas } from "../utils/stringFormat";
import GameScene from "./game";

export default class ResetContainer extends Phaser.GameObjects.Container {
	overlay: Phaser.GameObjects.Rectangle;
	background: RoundRectangle;
	lightBackground: RoundRectangle;
	description: Phaser.GameObjects.Text;
	closeButton: CloseButton;
	snowballText: Phaser.GameObjects.Text;
	snowballIcon: Phaser.GameObjects.Image;
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
		this.background = new RoundRectangle(scene, 0, 0, 380, 340, 15, darkBackgroundColor);
		this.lightBackground = new RoundRectangle(scene, 0, 45, 340, 210, 15, lightBackgroundColor);
		this.description = new Phaser.GameObjects.Text(
			scene,
			0,
			-150,
			`Reset game to earn 0.01 reset bonus\nfor every 10,000 snowballs in your balance.\nThe reset bonus will be applied to\nmanual clicks and item effects.\n\nYour current snowball balance is:\n\n\nReset will award you with:`,
			textStyle
		)
			.setAlign("center")
			.setOrigin(0.5, 0);
		this.snowballText = new Phaser.GameObjects.Text(scene, 0, -15, "", textStyle)
			.setAlign("left")
			.setOrigin(0, 0.5);
		this.snowballIcon = new Phaser.GameObjects.Image(scene, 0, -15, "snowball").setScale(0.15).setOrigin(1, 0.5);
		this.resetBonusText = new Phaser.GameObjects.Text(scene, 0, 45, "", textStyle)
			.setAlign("left")
			.setOrigin(0, 0.5);
		this.resetBonusIcon = new Phaser.GameObjects.Image(scene, 0, 45, "star").setScale(0.15).setOrigin(1, 0.5);
		this.footnote = new Phaser.GameObjects.Text(
			scene,
			0,
			180,
			"*Reset will NOT affect\nyour in-app purchase history\nor your icicle balance",
			textStyle
		)
			.setAlign("center")
			.setOrigin(0.5, 0);
		this.resetButton = new Button(scene, 0, 114).setText("RESET").addCallback(() => scene.reset(this.resetButton));
		this.closeButton = new CloseButton(scene, 177.5, -157.5).addCallback(this, () => {
			this.resetButton.resetButton();
		});

		this.add([
			this.overlay,
			this.background,
			this.lightBackground,
			this.description,
			this.snowballText,
			this.snowballIcon,
			this.resetBonusText,
			this.resetBonusIcon,
			this.footnote,
			this.resetButton,
			this.closeButton,
		])
			.setDepth(popupDepth)
			.setAlpha(0);
	}

	show() {
		const snowballBalance = this.scene.registry.get("SB");
		const resetBonus = Math.floor(snowballBalance / 1000000);

		this.snowballText.setText(`${numberWithCommas(snowballBalance / 100)} x`);
		const snowballX = (this.snowballText.width + this.snowballIcon.displayWidth + 6) / 2;
		this.snowballText.setX(-snowballX);
		this.snowballIcon.setX(snowballX);

		this.resetBonusText.setText(`${numberWithCommas(resetBonus / 100)} x`);
		const resetX = (this.resetBonusText.width + 36) / 2;
		this.resetBonusText.setX(-resetX);
		this.resetBonusIcon.setX(resetX + 7.5);

		this.scene.add.tween({
			targets: [this],
			ease: "Sine.easeIn",
			duration: 500,
			alpha: 1,
			callbackScope: this,
		});
	}
}
