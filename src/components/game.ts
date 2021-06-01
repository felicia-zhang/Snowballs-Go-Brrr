import * as PlayFab from "playfab-sdk/Scripts/PlayFab/PlayFabClient.js";
import { PlayFabClient } from 'playfab-sdk';
import penguin1 from "../assets/penguin1.png";
import penguin2 from "../assets/penguin2.png";
import penguin3 from "../assets/penguin3.png";
import { fontFamily } from '../utils/font'

class GameScene extends Phaser.Scene {
    player: any;
    totalClick: any;
    graphics: any;
    timerEvent: any;
    bar: any;
    consumables: any;
    durables: any;
    consumed: { [id: string]: number; };
    constructor() {
        super('Game');
    }

    init() {
        this.totalClick = 0
        this.consumables = []
        this.durables = []
        this.consumed = {}
    }

    preload() {
        this.load.image('penguin1', penguin1, { frameWidth: 355, frameHeight: 450 } as PlayFab.ImageFrameConfig);
        this.load.image('penguin2', penguin2, { frameWidth: 355, frameHeight: 450 } as PlayFab.ImageFrameConfig);
        this.load.image('penguin3', penguin3, { frameWidth: 355, frameHeight: 450 } as PlayFab.ImageFrameConfig);
    }

    create() {
        const scene = this
        const GetInventoryCallback = function (error, result) {
            const inventory: PlayFab.ItemInstance[] = result.data.Inventory
            inventory.forEach((inventory, i) => {
                if (inventory.RemainingUses !== undefined) {
                    const remainingUses = inventory.RemainingUses
                    scene.consumables.push({ item: inventory, remainingUses: remainingUses })
                } else {
                    scene.durables.push(inventory)
                }
            })

            scene.durables.forEach((durable, i) => {
                scene.add.text(200, 200 + i * 100, durable.DisplayName, { fontFamily: fontFamily })
            })
            scene.consumables.forEach((consumable, i) => {
                var image;
                const item = consumable.item
                if (consumable.item.CustomData !== undefined && JSON.parse(consumable.item.CustomData.ImageData).hasOwnProperty('image')) {
                    const imageData = JSON.parse(consumable.item.CustomData.ImageData)
                    image = scene.add.sprite(550, 200 + i * 100, imageData['image']).setScale(0.3)
                }
                const nameText = scene.add.text(600, 200 + i * 100, item.DisplayName, { fontFamily: fontFamily })
                const remainingUsesText = scene.add.text(700, 200 + i * 100, consumable.remainingUses, { fontFamily: fontFamily })
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

        const clickText = this.add.text(16, 16, `click: ${this.totalClick}`, { fontFamily: fontFamily });

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
                    PlayFabClient.ConsumeItem({ ItemInstanceId: consumedItem[0], ConsumeCount: consumedItem[1] }, (error, result) => console.log(result))
                })
                PlayFabClient.ExecuteCloudScript({ FunctionName: 'addUserVirtualCurrency', FunctionParameter: { amount: this.totalClick, virtualCurrency: 'CL' } }, (error, result) => {
                    PlayFabClient.ExecuteCloudScript({ FunctionName: 'updateStatistics', FunctionParameter: { clicks: this.totalClick, time: 4000 } }, () => { })
                })
            }
        });

        const storeButton = this.add.text(700, 400, "store", { fontFamily: fontFamily });
        storeButton.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
            this.scene.start('Store');
        })

        const leaderboardButton = this.add.text(700, 450, "leaderboard", { fontFamily: fontFamily });
        leaderboardButton.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
            this.scene.start('Leaderboard');
        })
    }
}

export default GameScene