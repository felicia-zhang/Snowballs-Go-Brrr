import { PlayFabClient } from "playfab-sdk";
import { fontFamily } from "../utils/font";

enum statisticName {
	current_snowballs = "1",
	total_added_snowballs = "2",
	total_manual_penguin_clicks = "3",
}

class LeaderboardScene extends Phaser.Scene {
	constructor() {
		super("Leaderboard");
	}

	create() {
		const leaderboard = this;

		this.add.image(400, 300, "sky");
		this.add.text(300, 9, "Leaderboard", { fontFamily: fontFamily });
		PlayFabClient.GetLeaderboard({ StatisticName: "3", StartPosition: 0 }, (error, result) => {
			leaderboard.add.text(200, 80, "PLACE", { fontFamily: fontFamily });
			leaderboard.add.text(300, 80, "NAME", { fontFamily: fontFamily });
			leaderboard.add.text(500, 80, "STATISTIC", { fontFamily: fontFamily });
			const players = result.data.Leaderboard;
			players.forEach((player, i) => {
				leaderboard.add.text(200, 110 + i * 20, (i + 1).toString(), { fontFamily: fontFamily });
				leaderboard.add.text(300, 110 + i * 20, player.DisplayName, { fontFamily: fontFamily });
				leaderboard.add.text(500, 110 + i * 20, player.StatValue.toString(), { fontFamily: fontFamily });
			});
		});

		for (let stat in statisticName) {
			const i = Number(statisticName[stat]) - 1;
			const statButton = this.add
				.text(80 + i * 200, 400, stat, { fontFamily: fontFamily })
				.setInteractive({ useHandCursor: true })
				.on("pointerup", () => this.showLeaderboard(stat));
		}

		this.add
			.text(700, 450, "MENU", { fontFamily: fontFamily })
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => {
				this.scene.start("Menu");
			});
	}

	showLeaderboard(stat: string) {
		console.log(statisticName[stat]);
	}

	update() {
		if (!PlayFabClient.IsClientLoggedIn()) {
			this.scene.start("Signin");
		}
	}
}

export default LeaderboardScene;
