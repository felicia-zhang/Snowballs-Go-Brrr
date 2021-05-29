import * as PlayFab from  "playfab-sdk/Scripts/PlayFab/PlayFabClient.js";
import { PlayFabClient } from 'playfab-sdk';

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
        const store = this;
        const GetCatalogItemsCallback = (error, result) => {
            store.items = result.data.Catalog
            store.items.forEach((item, i) => {
                const nameText = store.add.text(200, 200 + i * 100, item.DisplayName, { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' })
                const priceText = store.add.text(16, 200 + i * 100, `${item.VirtualCurrencyPrices.CL} Clicks`, { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' })
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
            store.clicks = result.data.VirtualCurrency.CL
            store.clickText.setText(`click: ${store.clicks}`);
        }

        PlayFabClient.GetUserInventory({}, GetInventoryCallback)
        const itemText = this.add.text(300, 9, "STORE", { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' })

        const nextButton = this.add.text(700, 400, "game", { fontFamily: 'Avantgarde, TeX Gyre Adventor, URW Gothic L, sans-serif' });
        nextButton.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
            this.scene.start('Scene');
        })
    }
}

export default StoreScene