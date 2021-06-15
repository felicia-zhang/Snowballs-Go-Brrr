import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";
import { PlayFabClient } from "playfab-sdk";
import { fontFamily } from "../utils/font";
import GameScene from "./game";

class StoreScene extends Phaser.Scene {
	items: PlayFabClientModels.CatalogItem[];
	snowballText: Phaser.GameObjects.Text;
	gameScene: GameScene;
	popup: Phaser.GameObjects.Container;
	toast: Phaser.GameObjects.Container;

	constructor() {
		super("Store");
	}

	create() {
		this.add.image(400, 300, "sky");
		this.items = [];
		this.snowballText = this.add.text(16, 16, "", { fontFamily: fontFamily });
		this.gameScene = this.scene.get("Game") as GameScene;
		this.makePopup();
		this.makeToast();
		//TODO: change to store items
		PlayFabClient.GetCatalogItems({ CatalogVersion: "1" }, (error, result) => {
			result.data.Catalog.forEach(item => this.makeIcon(item));
		});

		this.add
			.text(700, 450, "GAME", { fontFamily: fontFamily })
			.setInteractive({ useHandCursor: true })
			.on("pointerup", () => {
				this.scene.stop("Store");
				this.scene.bringToTop("Game");
			});
	}

	update() {
		this.snowballText.setText(`Snowballs: ${this.gameScene.totalSnowballs}`);
		if (!PlayFabClient.IsClientLoggedIn()) {
			this.scene.start("Signin");
		}
	}

	makeIcon(item: PlayFabClientModels.CatalogItem) {
		const index = this.items.length;
		this.items.push(item);
		let image: Phaser.GameObjects.Image;
		if (item.DisplayName === "Penguin") {
			image = this.add.image(100 + 100 * index, 200, "penguin3").setScale(0.1);
		} else if (item.DisplayName === "Igloo") {
			image = this.add.image(100 + 100 * index, 200, "igloo").setScale(0.1);
		} else if (item.DisplayName === "Torch") {
			image = this.add.image(100 + 100 * index, 200, "fire2").setScale(0.1);
		} else if (item.DisplayName === "Fishie") {
			image = this.add.image(100 + 100 * index, 200, "fish").setScale(0.1);
		}
		image
			.setInteractive()
			.on("pointerover", (pointer: Phaser.Input.Pointer, localX, localY, event) =>
				this.showItemDetails(pointer, localX, localY, event, item)
			)
			.on("pointerout", (pointer: Phaser.Input.Pointer, event) => {
				const levelsContainer = this.popup.getAt(3) as Phaser.GameObjects.Container;
				levelsContainer.removeAll(true);
				this.popup.setVisible(false);
			});

		const priceText = this.add
			.text(0, 0, `${item.VirtualCurrencyPrices.SB}`, { fontFamily: fontFamily })
			.setOrigin(1, 0.5);
		const sb = this.add.circle(priceText.width + 15, 0, 10, 0xffffff, 1).setOrigin(1, 0.5);
		const background = this.add.existing(new RoundRectangle(this, 0, 0, 70, 36, 15, 0x3f4c4f));
		this.add
			.container(100 + 100 * index, 250, [background, priceText, sb])
			.setDepth(2)
			.setSize(70, 36)
			.setInteractive({ useHandCursor: true })
			.on("pointerup", (pointer: Phaser.Input.Pointer) => {
				this.gameScene.sync(() => this.purchaseItem(item));
			});
	}

	purchaseItem(item: PlayFabClientModels.CatalogItem) {
		const price = item.VirtualCurrencyPrices.SB;
		PlayFabClient.PurchaseItem({ ItemId: item.ItemId, Price: price, VirtualCurrency: "SB" }, (e, r) => {
			if (e !== null) {
				this.showToast("Not enough snowballs");
			} else {
				this.gameScene.totalSnowballs -= price;
				PlayFabClient.ExecuteCloudScript(
					{
						FunctionName: "updateItemLevel",
						FunctionParameter: {
							cost: "0",
							instanceId: r.data.Items[0].ItemInstanceId,
							level: "1",
						},
					},
					(a, b) => {
						const newItem: PlayFabClientModels.ItemInstance = b.data.FunctionResult;
						this.gameScene.makeItem(newItem);
						this.showToast(`1 ${item.DisplayName.toLowerCase()} successfully purchased`);
					}
				);

				PlayFabClient.ExecuteCloudScript(
					{
						FunctionName: "updateStatistics",
						FunctionParameter: {
							[`${item.DisplayName}_purchased`]: 1,
						},
					},
					() => {}
				);
			}
		});
	}

	makePopup() {
		const nameText = this.add.text(0, 0, "", { fontFamily: fontFamily });
		const descriptionText = this.add.text(0, 20, "", { fontFamily: fontFamily });
		const priceText = this.add.text(0, 40, "", { fontFamily: fontFamily });
		const levelsContainer = this.add.container(0, 60, []);
		const container = this.add.container(0, 0, [nameText, descriptionText, priceText, levelsContainer]);
		this.popup = container;
		this.popup.setVisible(false);
		this.popup.setDepth(1);
	}

	showItemDetails(pointer: Phaser.Input.Pointer, localX, localY, event, item: PlayFabClientModels.CatalogItem) {
		const nameText = this.popup.getAt(0) as Phaser.GameObjects.Text;
		nameText.setText(`Name: ${item.DisplayName}`);
		const descriptionText = this.popup.getAt(1) as Phaser.GameObjects.Text;
		descriptionText.setText(`Description: ${item.Description}`);
		const priceText = this.popup.getAt(2) as Phaser.GameObjects.Text;
		priceText.setText(`Price: ${item.VirtualCurrencyPrices.SB}`);

		const levelsContainer = this.popup.getAt(3) as Phaser.GameObjects.Container;
		const levels = JSON.parse(item.CustomData)["Levels"];
		Object.keys(levels).forEach((key, i) => {
			const levelText = this.add.text(0, i * 20, key, { fontFamily: fontFamily });
			const costText = this.add.text(50, i * 20, `Cost: ${levels[key]["Cost"]}`, { fontFamily: fontFamily });
			const effectText = this.add.text(200, i * 20, `Effect: ${levels[key]["Effect"]}`, {
				fontFamily: fontFamily,
			});
			levelsContainer.add([levelText, costText, effectText]);
		});

		this.popup.setX(pointer.x);
		this.popup.setY(pointer.y);
		this.popup.setVisible(true);
	}

	makeToast() {
		const toastText = this.add.text(0, 0, "", { fontFamily: fontFamily });
		const bg = this.add.rectangle(0, 0, 0, 0, 0xffffff, 0.1).setStrokeStyle(2, 0xffffff, 1);
		this.toast = this.add.container(0, 0, [bg, toastText]).setAlpha(0).setDepth(1);
	}

	showToast(message: string) {
		const toastText = this.toast.getAt(1) as Phaser.GameObjects.Text;
		toastText.setText(message).setAlign("center").setOrigin(0.5, 0.5);

		const bg = this.toast.getAt(0) as Phaser.GameObjects.Rectangle;
		bg.setSize(toastText.width + 16, toastText.height + 8).setOrigin(0.5, 0.5);

		this.toast.setPosition(400, 8 + bg.displayHeight / 2);
		this.add.tween({
			targets: [this.toast],
			ease: "Sine.easeIn",
			duration: 300,
			alpha: 1,
			completeDelay: 1000,
			onComplete: () => {
				this.toast.setAlpha(0);
			},
			callbackScope: this,
		});
	}
}

export default StoreScene;
