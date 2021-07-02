import { PlayFabClient } from "playfab-sdk";
import { darkBackgroundColor, lightBackgroundColor, textStyle } from "../utils/constants";
import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";
import AScene from "./AScene";

class LeaderboardScene extends AScene {
	list: Phaser.GameObjects.Container;
	constructor() {
		super("Leaderboard");
	}

	create() {
		this.cameras.main.fadeIn(1000, 0, 0, 0);
		this.add.image(400, 300, "sky");
		this.list = this.add.container(400, 300, []);
		this.add.text(400, 16, "LEADERBOARD", textStyle).setAlign("center").setOrigin(0.5, 0);

		PlayFabClient.GetLeaderboard(
			{ StatisticName: "snowballs", StartPosition: 0, MaxResultsCount: 5 },
			(error, result) => {
				const darkBg = this.add.existing(new RoundRectangle(this, 0, 0, 480, 460, 15, darkBackgroundColor));
				const players = result.data.Leaderboard;
				players.forEach((player, i) => {
					const lightBg = this.add.existing(
						new RoundRectangle(this, 0, i * 80 - 160, 390, 50, 15, lightBackgroundColor)
					);
					const rankText = this.add
						.text(-184, i * 80 - 160, `#${(i + 1).toString()}`, textStyle)
						.setOrigin(0, 0.5)
						.setAlign("left");
					const playerText = this.add
						.text(0, i * 80 - 160, player.DisplayName, textStyle)
						.setAlign("Center")
						.setOrigin(0.5, 0.5);
					const statText = this.add
						.text(184, i * 80 - 160, `${player.StatValue / 100}`, textStyle)
						.setOrigin(1, 0.5)
						.setAlign("right");
					this.list.add([darkBg, lightBg, rankText, playerText, statText]);
				});
			}
		);

		const menuButtonUnderline = this.add.line(784, 584, 784, 584, 784, 584, 0xffffff).setAlpha(0);
		const menuButton = this.add
			.text(784, 584, "MENU", textStyle)
			.setOrigin(1, 1)
			.setInteractive({ useHandCursor: true })
			.on("pointerover", () => {
				menuButtonUnderline
					.setTo(0, 0, menuButton.width, 0)
					.setPosition(784 - menuButton.width, 584)
					.setAlpha(1);
			})
			.on("pointerout", () => {
				menuButtonUnderline.setAlpha(0);
			})
			.on("pointerup", () => {
				this.cameras.main.fadeOut(500, 0, 0, 0);
				this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, (cam, effect) => {
					this.scene.start("Menu");
				});
			});
	}

	update() {
		if (!this.registry.has("FinishedSignIn")) {
			this.scene.start("Signin");
		}
	}
}

export default LeaderboardScene;
