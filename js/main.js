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
var graphics;
var timerEvent;
var bar;

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

    var totalClick = 0;
    var clickText = this.add.text(16, 16, 'click: ' + 0, { fontSize: '32px', fill: '#ffffff' });

    player.setInteractive({useHandCursor: true}).on("pointerdown", () => {
        clickText.setText('click: ' + ++totalClick)
    })
    this.anims.create({
        key: 'bounce',
        frames: this.anims.generateFrameNumbers('dino', { start: 0, end: 3 }),
        frameRate: 5,
        repeat: -1
    });
    player.anims.play('bounce');

    timerEvent = this.time.addEvent({ delay: 4000 });
    graphics = this.add.graphics({ x: 0, y: 0 });
}

function update() {
    if (progress === 1) {
        return;
    }
    graphics.clear();
    var progress = timerEvent.getProgress();
    graphics.fillStyle(Phaser.Display.Color.HSVColorWheel()[8].color, 1);
    graphics.fillRect(0, 16, 800 * timerEvent.getProgress(), 8);
}