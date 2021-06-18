import { PlayFabClient } from "playfab-sdk";
import { textStyle } from "../utils/font";
import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";

class LeaderboardScene extends Phaser.Scene {
	list: Phaser.GameObjects.Container;
	constructor() {
		super("Leaderboard");
	}

	create() {
		this.add.image(400, 300, "sky");
		this.add.existing(new RoundRectangle(this, 400, 340, 380, 400, 15, 0x16252e));
		this.list = this.add.container(230, 180, []);
		this.add.text(400, 16, "Leaderboard", textStyle).setOrigin(0.5, 0.5).setAlign("center");
		this.add
			.text(130, 100, "Best Collector", textStyle)
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => this.showLeaderboard("5"));
		this.add
			.text(130 + 200, 100, "Best Earner", textStyle)
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => this.showLeaderboard("6"));
		this.add
			.text(130 + 400, 100, "Most Muscle Spasms", textStyle)
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => this.showLeaderboard("7"));
		this.showLeaderboard("5");

		this.add
			.text(784, 584, "MENU", textStyle)
			.setOrigin(1, 1)
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => {
				this.scene.start("Menu");
			});
	}

	showLeaderboard(stat: string) {
		this.list.removeAll(true);
		PlayFabClient.GetLeaderboard({ StatisticName: stat, StartPosition: 0 }, (error, result) => {
			const players = result.data.Leaderboard;
			players.forEach((player, i) => {
				const bg = this.add.existing(new RoundRectangle(this, 170, i * 70 + 6, 340, 40, 15, 0x2e5767));
				const rankText = this.add.text(10, i * 70, (i + 1).toString(), textStyle);
				const playerText = this.add.text(50, i * 70, player.DisplayName, textStyle);
				const statText = this.add.text(250, i * 70, player.StatValue.toString(), textStyle);
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
