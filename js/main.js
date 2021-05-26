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


class StoreScene extends Phaser.Scene {
    constructor() {
        super('Store');
        this.items = []
        this.inventory = []
        this.clicks;
        this.clickText;
    }

    create() {
        this.clickText = this.add.text(16, 16, '', { fontSize: '32px', fill: '#ffffff' })
        var store = this;
        var GetCatalogItemsCallback = function (result, error) {
            if (result !== null) {
                store.items = result.data.Catalog
                store.items.forEach((item, i) => {
                    var nameText = store.add.text(200, 200 + i*30, item.DisplayName)
                    var priceText = store.add.text(16, 200 + i*30, `${item.VirtualCurrencyPrices.CL} Clicks`)
                    nameText.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
                        PlayFabClientSDK.PurchaseItem({ItemId: item.ItemId, Price: item.VirtualCurrencyPrices.CL, VirtualCurrency: 'CL'}, (result, error) => {
                            console.log(result)
                            PlayFabClientSDK.GetUserInventory({}, GetInventoryCallback)
                        })
                    })
                })
            } else if (error !== null) {
                console.log(error)
            }
        }

        PlayFabClientSDK.GetCatalogItems({ CatalogVersion: 1 }, GetCatalogItemsCallback)

        var GetInventoryCallback = function (result, error) {
            if (result !== null) {
                store.inventory = result.data.inventory
                store.clicks = result.data.VirtualCurrency.CL
                store.clickText.setText(`click: ${store.clicks}`);
            } else if (error !== null) {
                console.log(error)
            }
        }

        PlayFabClientSDK.GetUserInventory({}, GetInventoryCallback)
        var itemText = this.add.text(300, 9, "STORE")

        var nextButton = this.add.text(700, 400, "NEXT" );
        nextButton.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
            this.scene.start('Level1');
        })
    }
}





class LevelOneScene extends Phaser.Scene {
    constructor() {
        super('Level1');
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
        this.player = this.add.sprite(100, 450, 'dino').setScale(2);

        var clickText = this.add.text(16, 16, `click: ${this.totalClick}`, { fontSize: '32px', fill: '#ffffff' });

        this.player.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
            clickText.setText(`click: ${++this.totalClick}`)
        })
        this.anims.create({
            key: 'bounce',
            frames: this.anims.generateFrameNumbers('dino', { start: 0, end: 3 }),
            frameRate: 5,
            repeat: -1
        });
        this.player.anims.play('bounce');

        this.timerEvent = this.time.addEvent({
            delay: 4000,
            callback: () => {
                this.player.removeInteractive();
                PlayFabClientSDK.ExecuteCloudScript({ FunctionName: 'addUserVirtualCurrency', FunctionParameter: { amount: this.totalClick, virtualCurrency: 'CL' } }, (result, error) => {
                    if (this.totalClick >= 10) {
                        this.scene.start('Store');
                    } else {
                        this.scene.start('GameOver');
                    }
                })
            }
        });

        this.graphics = this.add.graphics({ x: 0, y: 0 });
    }
    
    update() {
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
        var controller = this;
        PlayFab.settings.titleId = '7343B';
        var loginRequest = {
            TitleId: PlayFab.settings.titleId,
            CustomId: 'GettingStartedGuide',
            CreateAccount: true
        };

        var LoginCallback = function (result, error) {
            if (result !== null) {
                var playfabId = result.data.PlayFabId
                console.log(`Logged in! PlayFabId: ${playfabId}`)
                controller.scene.add('GameOver', GameOverScene);
                controller.scene.add('GameWon', GameWonScene);
                controller.scene.add('Store', StoreScene);
                controller.scene.add('Level1', LevelOneScene);

                controller.scene.start('Level1');
            } else if (error !== null) {
                console.log(error)
            }
        }

        PlayFabClientSDK.LoginWithCustomID(loginRequest, LoginCallback);
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