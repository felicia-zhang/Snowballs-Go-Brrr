import { PlayFabClient } from "playfab-sdk";
import { textStyle } from "../utils/font";
import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";

class LeaderboardScene extends Phaser.Scene {
	list: Phaser.GameObjects.Container;
	tabSelector: RoundRectangle;
	constructor() {
		super("Leaderboard");
	}

	create() {
		this.add.image(400, 300, "sky");
		this.add.existing(new RoundRectangle(this, 400, 330, 480, 400, 15, 0x16252e));
		this.list = this.add.container(230, 210, []);
		this.add.text(400, 16, "Leaderboard", textStyle).setOrigin(0.5, 0.5).setAlign("center");
		this.tabSelector = this.add.existing(new RoundRectangle(this, 225, 110, 130, 95, 15, 0x16252e));
		this.add
			.text(175, 100, "Best Collector", textStyle)
			.setOrigin(0, 0.5)
			.setAlign("left")
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => this.showLeaderboard("5", 225, 130));
		this.add
			.text(400, 100, "Best Earner", textStyle)
			.setOrigin(0.5, 0.5)
			.setAlign("center")
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => this.showLeaderboard("6", 400, 115));
		this.add
			.text(625, 100, "Muscle Spasms", textStyle)
			.setOrigin(1, 0.5)
			.setAlign("right")
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => this.showLeaderboard("7", 565, 150));
		this.showLeaderboard("5", 225, 130);

		this.add
			.text(784, 584, "MENU", textStyle)
			.setOrigin(1, 1)
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => {
				this.scene.start("Menu");
			});
	}

	showLeaderboard(stat: string, position: number, width: number) {
		this.add.tween({
			targets: [this.tabSelector],
			props: {
				x: {
					value: position,
					ease: "Sine.easeIn",
					duration: 600,
				},
				width: {
					value: width,
					ease: "Sine.easeIn",
					duration: 600,
				},
			},
			callbackScope: this,
		});
		this.list.removeAll(true);
		PlayFabClient.GetLeaderboard({ StatisticName: stat, StartPosition: 0 }, (error, result) => {
			const players = result.data.Leaderboard;
			players.forEach((player, i) => {
				const bg = this.add.existing(new RoundRectangle(this, 170, i * 80 + 8, 390, 50, 15, 0x2e5767));
				const rankText = this.add.text(0, i * 80, `#${(i + 1).toString()}`, textStyle);
				const playerText = this.add.text(50, i * 80, player.DisplayName, textStyle);
				const statText = this.add
					.text(340, i * 80, player.StatValue.toString(), textStyle)
					.setOrigin(1, 0)
					.setAlign("right");
				this.list.add([bg, rankText, playerText, statText]);
			});
		});
	}

	update() {
		if (!PlayFabClient.IsClientLoggedIn()) {
			this.scene.start("Signin");
		}
	}
}

export default LeaderboardScene;
