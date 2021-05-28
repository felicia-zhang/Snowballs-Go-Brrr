import Phaser from 'phaser'; 
import * as PlayFab from  "playfab-sdk/Scripts/PlayFab/PlayFabClient.js";
import sky from "./assets/sky.png";
import fire from "./assets/fire.png";
import penguin1 from "./assets/penguin1.png";
import penguin2 from "./assets/penguin2.png";
import penguin3 from "./assets/penguin3.png";
import { PlayFabClient } from 'playfab-sdk';

class LeaderboardScene extends Phaser.Scene {
    constructor() {
        super('Leaderboard');
    }

    create() {
        var leaderboard = this

        this.add.image(400, 300, 'sky');
        var title = this.add.text(300, 9, 'Leaderboard', { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' });
        PlayFabClient.GetLeaderboard({ StatisticName: 'level_clicks', StartPosition: 1 }, (error, result) => {
            leaderboard.add.text(200, 300, "PLACE", { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' })
            leaderboard.add.text(300, 300, "NAME", { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' })
            leaderboard.add.text(400, 300, "STATISTIC", { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' })
            var players = result.data.Leaderboard
            players.forEach((player, i) => {
                leaderboard.add.text(200, 320, (i + 1).toString(), { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' })
                leaderboard.add.text(300, 320, player.DisplayName, { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' })
                leaderboard.add.text(400, 320, (player.StatValue).toString(), { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' })
            })
        })

        var storeButton = this.add.text(700, 400, "store", { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' });
        storeButton.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
            this.scene.start('Store');
        })

        var gameButton = this.add.text(700, 450, "game", { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' });
        gameButton.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
            this.scene.start('Scene');
        })
    }
}



class StoreScene extends Phaser.Scene {
    items: PlayFab.CatalogItem[];
    inventory: PlayFab.ItemInstance[];
    clicks: number;
    clickText: any;
    constructor() {
        super('Store');
        this.items = []
        this.inventory = []
        this.clicks = 0;
    }

    create() {
        this.add.image(400, 300, 'sky');
        this.clickText = this.add.text(16, 16, '', { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' })
        var store = this;
        const GetCatalogItemsCallback = (error, result) => {
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
                    PlayFabClient.PurchaseItem({ ItemId: item.ItemId, Price: item.VirtualCurrencyPrices.CL, VirtualCurrency: 'CL' }, (result, error) => {
                        console.log(result)
                        PlayFabClient.GetUserInventory({}, GetInventoryCallback)
                    })
                })
            })
        }

        PlayFabClient.GetCatalogItems({ CatalogVersion: '1' }, GetCatalogItemsCallback)

        const GetInventoryCallback = (error, result) => {
            store.inventory = result.data.inventory
            store.clicks = result.data.VirtualCurrency.CL
            store.clickText.setText(`click: ${store.clicks}`);
        }

        PlayFabClient.GetUserInventory({}, GetInventoryCallback)
        var itemText = this.add.text(300, 9, "STORE", { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' })

        var nextButton = this.add.text(700, 400, "game", { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' });
        nextButton.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
            this.scene.start('Scene');
        })
    }
}





class GameScene extends Phaser.Scene {
    player: any;
    totalClick: any;
    graphics: any;
    timerEvent: any;
    bar: any;
    consumables: any;
    durables: any;
    consumed: { [id: string] : number; };
    constructor() {
        super('Scene');
        // this.player;
        // this.totalClick;
        // this.graphics;
        // this.timerEvent;
        // this.bar;
        // this.consumables;
        // this.durables;
        // this.consumed;
    }

    init() {
        this.totalClick = 0
        this.consumables = []
        this.durables = []
        this.consumed = {}
    }

    preload() {
        this.load.image('penguin1', penguin1, { frameWidth: 355, frameHeight: 450 } as any);
        this.load.image('penguin2', penguin2, { frameWidth: 355, frameHeight: 450 } as any);
        this.load.image('penguin3', penguin3, { frameWidth: 355, frameHeight: 450 } as any);
    }

    create() {
        var scene = this
        var GetInventoryCallback = function (error, result) {
                const inventory: PlayFab.ItemInstance[] = result.data.Inventory
                inventory.forEach((inventory, i) => {
                    if (inventory.RemainingUses !== undefined) {
                        var remainingUses = inventory.RemainingUses
                        scene.consumables.push({ item: inventory, remainingUses: remainingUses })
                    } else {
                        scene.durables.push(inventory)
                    }
                })

                scene.durables.forEach((durable, i) => {
                    scene.add.text(200, 200 + i * 100, durable.DisplayName, { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' })
                })
                scene.consumables.forEach((consumable, i) => {
                    var item = consumable.item
                    if (consumable.item.CustomData !== undefined && JSON.parse(consumable.item.CustomData.ImageData).hasOwnProperty('image')) {
                        var imageData = JSON.parse(consumable.item.CustomData.ImageData)
                        var image = scene.add.sprite(550, 200 + i * 100, imageData['image']).setScale(0.3)
                    }
                    var nameText = scene.add.text(600, 200 + i * 100, item.DisplayName, { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' })
                    var remainingUsesText = scene.add.text(700, 200 + i * 100, consumable.remainingUses, { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' })
                    nameText.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
                        scene.consumed[item.ItemInstanceId] = scene.consumed[item.ItemInstanceId] || 0
                        scene.consumed[item.ItemInstanceId]++
                        if (consumable.remainingUses - scene.consumed[item.ItemInstanceId] > 0) {
                            remainingUsesText.setText((consumable.remainingUses - scene.consumed[item.ItemInstanceId]).toString())
                        } else {
                            nameText.destroy()
                            remainingUsesText.destroy()
                            if (image !== undefined) {
                                image.destroy()
                            }
                        }
                    })
                })
        }

        PlayFabClient.GetUserInventory({}, GetInventoryCallback)

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
                    PlayFabClient.ConsumeItem({ ItemInstanceId: consumedItem[0], ConsumeCount: consumedItem[1] }, (result, error) => console.log(result))
                })
                PlayFabClient.ExecuteCloudScript({ FunctionName: 'addUserVirtualCurrency', FunctionParameter: { amount: this.totalClick, virtualCurrency: 'CL' } }, (result, error) => {
                    PlayFabClient.ExecuteCloudScript({ FunctionName: 'updateStatistics', FunctionParameter: { clicks: this.totalClick, time: 4000 } }, () => {})
                    this.scene.start('Leaderboard');
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
        this.load.image('sky', sky);
        this.load.image('fire', fire, { frameWidth: 355, frameHeight: 450 } as any);
    }

    create() {
        var controller = this;
        PlayFab.settings.titleId = '7343B';
        const loginRequest = {
            TitleId: PlayFab.settings.titleId,
            CustomId: 'GettingStartedGuide',
            CreateAccount: true
        };

        const LoginCallback = (error, result) => {
            var playfabId = result.data.PlayFabId
            console.log(`Logged in! PlayFabId: ${playfabId}`)

            PlayFabClient.ExecuteCloudScript({ FunctionName: 'syncInventoryToCatalog', FunctionParameter: {} }, (r, e) => {
                controller.scene.add('Leaderboard', LeaderboardScene);
                controller.scene.add('Store', StoreScene);
                controller.scene.add('Scene', GameScene);

                controller.scene.start('Store');
            })
        }

        PlayFabClient.LoginWithCustomID(loginRequest, LoginCallback);
    }
}


var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600
};

export class Game extends Phaser.Game {
    constructor() {
        super(config);
        this.scene.add('Controller', new Controller());
        this.scene.start('Controller');
    }
}