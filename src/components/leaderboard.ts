import { PlayFabClient } from 'playfab-sdk';

class LeaderboardScene extends Phaser.Scene {
    constructor() {
        super('Leaderboard');
    }

    create() {
        const leaderboard = this

        this.add.image(400, 300, 'sky');
        const title = this.add.text(300, 9, 'Leaderboard', { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' });
        PlayFabClient.GetLeaderboard({ StatisticName: 'level_clicks', StartPosition: 0 }, (error, result) => {
            leaderboard.add.text(200, 300, "PLACE", { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' })
            leaderboard.add.text(300, 300, "NAME", { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' })
            leaderboard.add.text(400, 300, "STATISTIC", { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' })
            const players = result.data.Leaderboard
            players.forEach((player, i) => {
                leaderboard.add.text(200, 320, (i + 1).toString(), { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' })
                leaderboard.add.text(300, 320, player.DisplayName, { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' })
                leaderboard.add.text(400, 320, (player.StatValue).toString(), { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' })
            })
        })

        const storeButton = this.add.text(700, 400, "store", { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' });
        storeButton.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
            this.scene.start('Store');
        })

        const gameButton = this.add.text(700, 450, "game", { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' });
        gameButton.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
            this.scene.start('Scene');
        })
    }
}

export default LeaderboardScene;