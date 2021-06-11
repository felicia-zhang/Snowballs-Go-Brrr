import { PlayFabClient } from "playfab-sdk";
import { fontFamily } from "../utils/font";

enum statisticName {
	current_snowballs = "1",
	total_added_snowballs = "2",
	total_manual_penguin_clicks = "3",
}

class LeaderboardScene extends Phaser.Scene {
	leaderboardName: Phaser.GameObjects.Text;
	list: Phaser.GameObjects.Container;
	constructor() {
		super("Leaderboard");
	}

	create() {
		this.add.image(400, 300, "sky");
		this.add.text(300, 9, "Leaderboard", { fontFamily: fontFamily });
		this.leaderboardName = this.add.text(300, 50, "", { fontFamily: fontFamily });
		this.add.text(200, 80, "PLACE", { fontFamily: fontFamily });
		this.add.text(300, 80, "NAME", { fontFamily: fontFamily });
		this.add.text(500, 80, "STATISTIC", { fontFamily: fontFamily });
		this.list = this.add.container(200, 110, []);
		this.showLeaderboard("current_snowballs");

		for (let stat in statisticName) {
			const i = Number(statisticName[stat]) - 1;
			this.add
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
		this.leaderboardName.setText(stat);
		this.list.removeAll(true);
		PlayFabClient.GetLeaderboard({ StatisticName: statisticName[stat], StartPosition: 0 }, (error, result) => {
			const players = result.data.Leaderboard;
			const texts: Phaser.GameObjects.Text[] = [];
			players.forEach((player, i) => {
				texts.push(this.add.text(0, i * 20, (i + 1).toString(), { fontFamily: fontFamily }));
				texts.push(this.add.text(100, i * 20, player.DisplayName, { fontFamily: fontFamily }));
				texts.push(this.add.text(300, i * 20, player.StatValue.toString(), { fontFamily: fontFamily }));
			});
			this.list.add(texts);
		});
	}

	update() {
		if (!PlayFabClient.IsClientLoggedIn()) {
			this.scene.start("Signin");
		}
	}
}

export default LeaderboardScene;
