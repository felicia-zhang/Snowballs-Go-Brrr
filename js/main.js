class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOver');
    }

    create() {
        this.add.image(400, 300, 'sky');
        this.title = this.add.text(400, 300, 'GAME OVER', { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' });
    }
}




class GameWonScene extends Phaser.Scene {
    constructor() {
        super('GameWon');
    }

    create() {
        this.add.image(400, 300, 'sky');
        this.title = this.add.text(400, 300, 'GAME WON', { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' });
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
        this.add.image(400, 300, 'sky');
        this.clickText = this.add.text(16, 16, '', { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' })
        var store = this;
        var GetCatalogItemsCallback = function (result, error) {
            if (result !== null) {
                store.items = result.data.Catalog
                store.items.forEach((item, i) => {
                    console.log(item)
                    var nameText = store.add.text(200, 200 + i * 100, item.DisplayName, { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' })
                    var priceText = store.add.text(16, 200 + i * 100, `${item.VirtualCurrencyPrices.CL} Clicks`, { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' })
                    if (item.CustomData !== undefined && JSON.parse(item.CustomData).hasOwnProperty('image')) {
                        var customData = JSON.parse(item.CustomData)
                        var image = store.add.sprite(160, 200 + i * 100, customData['image']).setScale(0.3)
                    }
                    nameText.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
                        PlayFabClientSDK.PurchaseItem({ ItemId: item.ItemId, Price: item.VirtualCurrencyPrices.CL, VirtualCurrency: 'CL' }, (result, error) => {
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
        var itemText = this.add.text(300, 9, "STORE", { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' })

        var nextButton = this.add.text(700, 400, "NEXT", { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' });
        nextButton.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
            this.scene.start('Level1');
        })
    }
}





class LevelOneScene extends Phaser.Scene {
    constructor() {
        super('Level1');
        this.player;
        this.totalClick;
        this.graphics;
        this.timerEvent;
        this.bar;
        this.consumables;
        this.durables;
        this.consumed;
    }

    init() {
        this.totalClick = 0
        this.consumables = []
        this.durables = []
        this.consumed = {}
    }

    preload() {
        this.load.image('penguin1', 'assets/penguin1.png', { frameWidth: 355, frameHeight: 450 });
        this.load.image('penguin2', 'assets/penguin2.png', { frameWidth: 355, frameHeight: 450 });
        this.load.image('penguin3', 'assets/penguin3.png', { frameWidth: 355, frameHeight: 450 });
    }

    create() {
        PlayFabClientSDK.ExecuteCloudScript({ FunctionName: 'syncInventoryToCatalog', FunctionParameter: {} }, (result, error) => {
            console.log(result)
        })

        var scene = this
        var GetInventoryCallback = function (result, error) {
            if (result !== null) {
                var inventory = result.data.Inventory
                inventory.forEach((inventory, i) => {
                    if (inventory.RemainingUses !== undefined) {
                        var remainingUses = inventory.RemainingUses
                        scene.consumables.push({item: inventory, remainingUses: remainingUses})
                    } else {
                        scene.durables.push(inventory)
                    }
                })

                scene.durables.forEach((durable, i) => {
                    scene.add.text(200, 200 + i * 100, durable.DisplayName, { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' })
                })
                scene.consumables.forEach((consumable, i) => {
                    var item = consumable.item
                    var nameText = scene.add.text(600, 200 + i * 100, item.DisplayName, { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' })
                    var remainingUsesText = scene.add.text(700, 200 + i * 100, consumable.remainingUses, { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' })
                    nameText.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
                        scene.consumed[item.ItemInstanceId] = scene.consumed[item.ItemInstanceId] || 0
                        scene.consumed[item.ItemInstanceId]++
                        if (consumable.remainingUses - scene.consumed[item.ItemInstanceId] > 0) {
                        remainingUsesText.setText(consumable.remainingUses - scene.consumed[item.ItemInstanceId])
                        } else {
                            nameText.destroy()
                            remainingUsesText.destroy()
                        }
                    })
                })
            } else if (error !== null) {
                console.log(error)
            }
        }

        PlayFabClientSDK.GetUserInventory({}, GetInventoryCallback)

        this.add.image(400, 300, 'sky');
        this.player = this.add.sprite(100, 450, 'penguin3').setScale(0.3)

        var clickText = this.add.text(16, 16, `click: ${this.totalClick}`, { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' });

        this.player.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
            clickText.setText(`click: ${++this.totalClick}`)
        })
        this.anims.create({
            key: 'bounce',
            frames: [
                { key: 'penguin3' },
                { key: 'penguin2' },
                { key: 'penguin1' },
                { key: 'penguin2' }
            ],
            frameRate: 8,
            repeat: -1
        });
        this.player.anims.play('bounce');

        this.timerEvent = this.time.addEvent({
            delay: 4000,
            callback: () => {
                Object.entries(this.consumed).forEach((consumedItem) => {
                    PlayFabClientSDK.ConsumeItem({ItemInstanceId: consumedItem[0], ConsumeCount: consumedItem[1]}, (result, error) => console.log(result))
                })
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
        this.graphics.fillStyle(0xFFFFFF, 1.0);
        this.graphics.fillRect(0, 46, 800 * this.timerEvent.getProgress(), 8);
    }
}







class Controller extends Phaser.Scene {
    constructor() {
        super('Controller');
    }

    preload() {
        this.load.image('sky', 'assets/sky.png');
        this.load.image('fire', 'assets/fire.png', { frameWidth: 355, frameHeight: 450 });
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