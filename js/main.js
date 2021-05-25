var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var player;
var score = 0;
var gameOver = false;
var scoreText;

var game = new Phaser.Game(config);

function preload() {
    this.load.spritesheet('dino', 'assets/dino.png', { frameWidth: 24, frameHeight: 20 });
}

function create() {
    PlayFab.settings.titleId = '7343B';
    var playfabId;
    var loginRequest = {
        TitleId: PlayFab.settings.titleId,
        CustomId: 'GettingStartedGuide',
        CreateAccount: true
    };

    var LoginCallback = function (result, error) {
        if (result !== null) {
            console.log('Logged in! PlayFabId: ' + result.data.PlayFabId)
        } else if (error !== null) {
            console.log(error)
        }
    }

    PlayFabClientSDK.LoginWithCustomID(loginRequest, LoginCallback);

    player = this.add.sprite(100, 450, 'dino').setScale(2);
    this.anims.create({
        key: 'bounce',
        frames: this.anims.generateFrameNumbers('dino', { start: 0, end: 3 }),
        frameRate: 5,
        repeat: -1
    });
    player.anims.play('bounce');

    //  The score
    scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#ffffff' });
}

function update() {
    if (gameOver) {
        return;
    }
}