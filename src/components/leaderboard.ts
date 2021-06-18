import { PlayFabClient } from "playfab-sdk";
import { fontFamily } from "../utils/font";
import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";

class LeaderboardScene extends Phaser.Scene {
	list: Phaser.GameObjects.Container;
	constructor() {
		super("Leaderboard");
	}

	create() {
		this.add.image(400, 300, "sky");
		const bg = this.add.existing(new RoundRectangle(this, 400, 300, 380, 450, 15, 0x16252e));
		this.list = this.add.container(230, 130, []);

		this.add
			.text(80, 50, "current_snowballs", { fontFamily: fontFamily })
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => this.showLeaderboard("5"));
		this.add
			.text(80 + 200, 50, "total_added_snowballs", { fontFamily: fontFamily })
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => this.showLeaderboard("6"));
		this.add
			.text(80 + 400, 50, "total_manual_penguin_clicks", { fontFamily: fontFamily })
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => this.showLeaderboard("7"));
		this.add.text(400, 16, "Leaderboard", { fontFamily: fontFamily }).setOrigin(0.5, 0.5).setAlign("center");
		this.add.text(230, 80, "RANK", { fontFamily: fontFamily });
		this.add.text(300, 80, "PLAYER", { fontFamily: fontFamily });
		this.add.text(500, 80, "STATISTIC", { fontFamily: fontFamily });
		this.showLeaderboard("5");

		this.add
			.text(784, 584, "MENU", { fontFamily: fontFamily })
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
				const rankText = this.add.text(10, i * 70, (i + 1).toString(), { fontFamily: fontFamily });
				const playerText = this.add.text(50, i * 70, player.DisplayName, { fontFamily: fontFamily });
				const statText = this.add.text(250, i * 70, player.StatValue.toString(), { fontFamily: fontFamily });
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
