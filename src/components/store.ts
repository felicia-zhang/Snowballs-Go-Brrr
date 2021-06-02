import * as PlayFab from "playfab-sdk/Scripts/PlayFab/PlayFabClient.js";
import { PlayFabClient } from 'playfab-sdk';
import { fontFamily } from '../utils/font'

class StoreScene extends Phaser.Scene {
    items: PlayFab.CatalogItem[];
    inventory: PlayFab.ItemInstance[];
    clickText: any;
    constructor() {
        super('Store');
        this.items = []
        this.inventory = []
    }

    create() {
        this.add.image(400, 300, 'sky');
        this.clickText = this.add.text(16, 16, '', { fontFamily: fontFamily })
        const store = this;
        const GetCatalogItemsCallback = (error, result) => {
            store.items = result.data.Catalog
            store.items.forEach((item, i) => {
                const nameText = store.add.text(200, 200 + i * 100, item.DisplayName, { fontFamily: fontFamily })
                const priceText = store.add.text(16, 200 + i * 100, `${item.VirtualCurrencyPrices.CL} Clicks`, { fontFamily: fontFamily })
                if (item.CustomData !== undefined && JSON.parse(item.CustomData).hasOwnProperty('image')) {
                    const customData = JSON.parse(item.CustomData)
                    const image = store.add.sprite(160, 200 + i * 100, customData['image']).setScale(0.3)
                }
                nameText.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
                    PlayFabClient.PurchaseItem({ ItemId: item.ItemId, Price: item.VirtualCurrencyPrices.CL, VirtualCurrency: 'CL' }, (error, result) => {
                        console.log(result)
                        PlayFabClient.GetUserInventory({}, GetInventoryCallback)
                    })
                })
            })
        }

        PlayFabClient.GetCatalogItems({ CatalogVersion: '1' }, GetCatalogItemsCallback)

        const GetInventoryCallback = (error, result) => {
            store.inventory = result.data.inventory
            store.clickText.setText(`click: ${result.data.VirtualCurrency.CL}`);
        }

        PlayFabClient.GetUserInventory({}, GetInventoryCallback)
        const itemText = this.add.text(300, 9, "STORE", { fontFamily: fontFamily })

        const backButton = this.add.text(700, 450, "back", { fontFamily: fontFamily });
        backButton.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
            this.scene.start('Game');
        })
    }
}

export default StoreScene