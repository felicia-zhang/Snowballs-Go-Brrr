class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOver');
    }

    create() {
        this.title = this.add.text(400, 300, 'GAME OVER');
    }
}




class GameWonScene extends Phaser.Scene {
    constructor() {
        super('GameWon');
    }

    create() {
        this.title = this.add.text(400, 300, 'GAME WON');
    }
}





class ChapterOneScene extends Phaser.Scene {
    constructor() {
        super('Chapter1');
        this.player;
        this.totalClick = 0;
        this.graphics;
        this.timerEvent;
        this.bar;
    }

    preload() {
        this.load.spritesheet('dino', 'assets/dino.png', { frameWidth: 24, frameHeight: 20 });
    }

    create() {

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

        this.player = this.add.sprite(100, 450, 'dino').setScale(2);

        var clickText = this.add.text(16, 16, 'click: ' + this.totalClick, { fontSize: '32px', fill: '#ffffff' });

        this.player.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
            clickText.setText('click: ' + ++this.totalClick)
        })
        this.anims.create({
            key: 'bounce',
            frames: this.anims.generateFrameNumbers('dino', { start: 0, end: 3 }),
            frameRate: 5,
            repeat: -1
        });
        this.player.anims.play('bounce');

        this.timerEvent = this.time.addEvent({ delay: 4000 });
        this.graphics = this.add.graphics({ x: 0, y: 0 });
    }
    update() {
        var progress = this.timerEvent.getProgress();
        if (progress === 1) {
            if (this.totalClick >= 10) {
                this.time.addEvent({
                    delay: 1000,
                    callback() {
                        this.scene.start('GameWon');
                    },
                    callbackScope: this,
                    loop: false,
                });
            } else {
                this.time.addEvent({
                    delay: 1000,
                    callback() {
                        this.scene.start('GameOver');
                    },
                    callbackScope: this,
                    loop: false,
                });
            }
            return;
        }
        this.graphics.clear();
        this.graphics.fillStyle(Phaser.Display.Color.HSVColorWheel()[8].color, 1);
        this.graphics.fillRect(0, 16, 800 * this.timerEvent.getProgress(), 8);
    }
}







class Controller extends Phaser.Scene {
    constructor() {
        super('Controller');
    }

    create() {
        this.scene.add('GameOver', GameOverScene);
        this.scene.add('GameWon', GameWonScene);
        this.scene.add('Chapter1', ChapterOneScene);

        this.scene.start('Chapter1');
    }
}


var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600
};




class Game extends Phaser.Game {
    constructor() {
        super(config);
        this.scene.add('Controller', new Controller());
        this.scene.start('Controller');
    }
}

const game = new Game();