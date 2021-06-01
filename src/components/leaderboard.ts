import { PlayFabClient } from 'playfab-sdk';
import { fontFamily } from '../utils/font'

class LeaderboardScene extends Phaser.Scene {
    constructor() {
        super('Leaderboard');
    }

    create() {
        const leaderboard = this

        this.add.image(400, 300, 'sky');
        const title = this.add.text(300, 9, 'Leaderboard', { fontFamily: fontFamily });
        PlayFabClient.GetLeaderboard({ StatisticName: 'level_clicks', StartPosition: 0 }, (error, result) => {
            leaderboard.add.text(200, 300, "PLACE", { fontFamily: fontFamily })
            leaderboard.add.text(300, 300, "NAME", { fontFamily: fontFamily })
            leaderboard.add.text(400, 300, "STATISTIC", { fontFamily: fontFamily })
            const players = result.data.Leaderboard
            players.forEach((player, i) => {
                leaderboard.add.text(200, 320, (i + 1).toString(), { fontFamily: fontFamily })
                leaderboard.add.text(300, 320, player.DisplayName, { fontFamily: fontFamily })
                leaderboard.add.text(400, 320, (player.StatValue).toString(), { fontFamily: fontFamily })
            })
        })

        const storeButton = this.add.text(700, 400, "store", { fontFamily: fontFamily });
        storeButton.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
            this.scene.start('Store');
        })

        const gameButton = this.add.text(700, 450, "game", { fontFamily: fontFamily });
        gameButton.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
            this.scene.start('Scene');
        })
    }
}

export default LeaderboardScene;