import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";
import { PlayFabClient } from "playfab-sdk";
import Button from "../../utils/button";
import { darkDarkBlue, darkBlue, overlayDepth, popupDepth, textStyle } from "../../utils/constants";
import { numberWithCommas } from "../../utils/stringFormat";
import GameScene from "../scenes/game";

export default class LeaderboardContainer extends Phaser.GameObjects.Container {
	overlay: Phaser.GameObjects.Rectangle;
	background: RoundRectangle;
	statList: Phaser.GameObjects.Container;
	closeButton: Button;
	scene: GameScene;

	constructor(scene: GameScene, x: number, y: number) {
		super(scene, x, y, []);

		this.scene = scene;
		this.overlay = new Phaser.GameObjects.Rectangle(scene, 0, 0, 800, 600, 0x000000)
			.setDepth(overlayDepth)
			.setAlpha(0.6);
		this.background = new RoundRectangle(scene, 0, 0, 440, 420, 15, darkDarkBlue);
		this.statList = new Phaser.GameObjects.Container(scene, 0, 0, []);
		this.closeButton = new Button(scene, 207, -197, false)
			.addIcon("close")
			.addCloseCallback(this, this.scene.interactiveObjects, () => {
				this.statList.removeAll(true);
			});

		this.add([this.overlay, this.background, this.statList, this.closeButton]).setDepth(popupDepth).setAlpha(0);
	}

	show() {
		PlayFabClient.GetLeaderboard(
			{ StatisticName: "snowballs", StartPosition: 0, MaxResultsCount: 5 },
			(error, result) => {
				const players = result.data.Leaderboard;
				players.forEach((player, i) => {
					const lightBg = new RoundRectangle(this.scene, 0, i * 80 - 160, 400, 60, 15, darkBlue);
					const rankText = new Phaser.GameObjects.Text(
						this.scene,
						-184,
						i * 80 - 160,
						`#${(i + 1).toString()}`,
						textStyle
					)
						.setOrigin(0, 0.5)
						.setAlign("left");
					const playerText = new Phaser.GameObjects.Text(
						this.scene,
						0,
						i * 80 - 160,
						player.DisplayName,
						textStyle
					)
						.setAlign("Center")
						.setOrigin(0.5, 0.5);
					const statText = new Phaser.GameObjects.Text(
						this.scene,
						184,
						i * 80 - 160,
						`${numberWithCommas(player.StatValue / 100)}`,
						textStyle
					)
						.setOrigin(1, 0.5)
						.setAlign("right");
					this.statList.add([lightBg, rankText, playerText, statText]);
				});
			}
		);
		this.scene.add.tween({
			targets: [this],
			ease: "Sine.easeIn",
			duration: 500,
			alpha: 1,
		});
	}
}
