import {
	darkBackgroundColor,
	errorHex,
	lightBackgroundColor,
	overlayDepth,
	popupDepth,
	textStyle,
	toastDepth,
} from "../utils/constants";
import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";
import { PlayFabClient } from "playfab-sdk";
import { ItemDetail, BundleDetail } from "../utils/types";
import Button from "../utils/button";
import CloseButton from "../utils/closeButton";

abstract class AScene extends Phaser.Scene {
	toast: Phaser.GameObjects.Text;
	itemsMap: { [key: number]: ItemDetail };
	bundlesMap: { [key: number]: BundleDetail };
	currencyContainer: Phaser.GameObjects.Container;
	currencyItems: PlayFabClientModels.StoreItem[];
	interactiveObjects: Phaser.GameObjects.GameObject[];

	init() {
		this.toast = this.add
			.text(400, 584, "", textStyle)
			.setAlpha(0)
			.setDepth(toastDepth)
			.setAlign("center")
			.setOrigin(0.5, 1);
		this.currencyItems = [];
		this.itemsMap = {};
		this.bundlesMap = {};
		this.interactiveObjects = [];
		this.makeCurrencyContainer();
	}

	makeCurrencyContainer() {
		const overlay = this.add.rectangle(0, 0, 800, 600, 0x000000).setDepth(overlayDepth).setAlpha(0.6);
		const mainBackground = this.add.existing(new RoundRectangle(this, 0, 0, 665, 255, 15, darkBackgroundColor));
		const currencyList = this.add.container(0, 0, []);
		const text = this.add
			.text(
				0,
				160,
				"*This is a mock of the payment process. \nNo real transaction will take place in the PlayFab backend.",
				textStyle
			)
			.setAlign("center")
			.setOrigin(0.5, 0.5);
		this.currencyContainer = this.add
			.container(400, 300, [overlay, mainBackground, currencyList, text])
			.setAlpha(0)
			.setDepth(popupDepth);
		const closeButton = this.add.existing(
			new CloseButton(this, 320, -115).addCallback(this.currencyContainer, () => {
				const currencyList = this.currencyContainer.getAt(2) as Phaser.GameObjects.Container;
				currencyList.removeAll(true);
				this.currencyItems = [];
			})
		);
		this.currencyContainer.add(closeButton);
	}

	showCurrencyContainer() {
		PlayFabClient.GetStoreItems({ StoreId: "CurrenciesWithDiscount" }, (error, result) => {
			result.data.Store.forEach((storeItem: PlayFabClientModels.StoreItem) => {
				this.makeCurrency(storeItem);
			});
			const overlay = this.currencyContainer.getAt(0) as Phaser.GameObjects.Rectangle;
			const bg = this.currencyContainer.getAt(1) as RoundRectangle;
			const closeButton = this.currencyContainer.getAt(4) as CloseButton;
			if (result.data.StoreId === "CurrenciesWithDiscount") {
				overlay.setY(-25);
				bg.height = 305;
				bg.y = -25;
				closeButton.setY(-165);
				this.currencyContainer.setY(325);
				const discountText = this.add
					.text(
						0,
						-145,
						"ONE TIME OFFER!!\nReceive 10% off ALL in-game items after your first icicle purchase!",
						textStyle
					)
					.setAlign("center")
					.setOrigin(0.5, 0.5);
				const currencyList = this.currencyContainer.getAt(2) as Phaser.GameObjects.Container;
				currencyList.add(discountText);
			} else {
				overlay.setY(0);
				bg.height = 255;
				bg.y = 0;
				closeButton.setY(-115);
				this.currencyContainer.setY(300);
			}
		});
		this.add.tween({
			targets: [this.currencyContainer],
			ease: "Sine.easeIn",
			duration: 500,
			alpha: 1,
			callbackScope: this,
		});
	}

	makeCurrency(storeItem: PlayFabClientModels.StoreItem) {
		const bundleDetail: BundleDetail = this.bundlesMap[storeItem.ItemId];
		const usd = storeItem.VirtualCurrencyPrices.RM;

		const index = this.currencyItems.length;
		const x = 160 * index - 240;
		this.currencyItems.push(storeItem);
		const background = this.add.existing(new RoundRectangle(this, x, 0, 140, 220, 15, lightBackgroundColor));

		let imageKey: string;
		if (storeItem.ItemId === "100") {
			imageKey = "icicle1";
		} else if (storeItem.ItemId === "101") {
			imageKey = "icicle2";
		} else if (storeItem.ItemId === "102") {
			imageKey = "icicle3";
		} else if (storeItem.ItemId === "103") {
			imageKey = "icicle4";
		}
		const image = this.add.image(x, -10, imageKey).setScale(0.7);
		const nameText = this.add
			.text(x, -90, bundleDetail.DisplayName.toUpperCase(), textStyle)
			.setAlign("center")
			.setOrigin(0.5, 0.5);
		const button = this.add.existing(
			new Button(this, x, 80, "red")
				.setText(`$ ${usd}.00`)
				.addCallback(() => this.purchaseCurrency(bundleDetail, usd, button))
		);
		const currencyList = this.currencyContainer.getAt(2) as Phaser.GameObjects.Container;
		currencyList.add([background, image, nameText, button]);
	}

	purchaseCurrency(bundleDetail: BundleDetail, usd: number, button: Button) {
		button.toggleLoading(true);
		PlayFabClient.ExecuteCloudScript(
			{
				FunctionName: "grantIcicleBundle",
				FunctionParameter: { itemId: bundleDetail.ItemId, usd: usd },
			},
			(error, result) => {
				this.time.addEvent({
					delay: 200,
					callback: () => {
						button.toggleLoading(false);
						this.registry.values.IC += bundleDetail.Icicles;
						this.showToast(`${bundleDetail.DisplayName} successfully purchased`, false);
					},
				});
			}
		);
	}

	showToast(message: string, isError: boolean) {
		this.toast.setText(message);
		if (isError) {
			this.toast.setColor(errorHex);
		} else {
			this.toast.setColor("#ffffff");
		}

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

export default AScene;
