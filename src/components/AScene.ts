import {
	buttonClick,
	buttonHover,
	buttonNormal,
	closeButtonFill,
	darkBackgroundColor,
	errorHex,
	fontFamily,
	lightBackgroundColor,
	outlineClick,
	outlineHover,
	outlineNormal,
	overlayDepth,
	popupDepth,
	textStyle,
	toastDepth,
} from "../utils/constants";
import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";
import { PlayFabClient } from "playfab-sdk";
import { ItemDetail } from "../utils/types";

abstract class AScene extends Phaser.Scene {
	toast: Phaser.GameObjects.Text;
	itemsMap: { [key: number]: ItemDetail };
	currencyContainer: Phaser.GameObjects.Container;
	currencyItems: PlayFabClientModels.StoreItem[];
	interactiveObjects: Phaser.GameObjects.GameObject[];
	constructor(key: string) {
		super(key);
	}

	init() {
		this.toast = this.add
			.text(400, 584, "", textStyle)
			.setAlpha(0)
			.setDepth(toastDepth)
			.setAlign("center")
			.setOrigin(0.5, 1);
		this.currencyItems = [];
		this.itemsMap = {};
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
		const closeButton = this.add
			.existing(
				new RoundRectangle(this, 320, -115, 35, 35, 5, closeButtonFill).setStrokeStyle(6, outlineNormal, 1)
			)
			.setInteractive({ useHandCursor: true })
			.on("pointerover", () => {
				closeButton.setStrokeStyle(6, outlineHover, 1);
			})
			.on("pointerout", () => {
				closeButton.setStrokeStyle(6, outlineNormal, 1);
			})
			.on("pointerdown", () => {
				closeButton.setStrokeStyle(6, outlineClick, 1);
			})
			.on("pointerup", () => {
				closeButton.setStrokeStyle(6, outlineNormal, 1);
				this.add.tween({
					targets: [this.currencyContainer],
					ease: "Sine.easeIn",
					duration: 100,
					alpha: 0,
					onComplete: () => {
						this.interactiveObjects.forEach(object => object.setInteractive({ useHandCursor: true }));
						const currencyList = this.currencyContainer.getAt(2) as Phaser.GameObjects.Container;
						currencyList.removeAll(true);
						this.currencyItems = [];
					},
					callbackScope: this,
				});
			});
		const line1 = this.add.line(0, 0, 320, -97.5, 337, -114.5, outlineClick).setLineWidth(3, 3);
		const line2 = this.add.line(0, 0, 320, -114.5, 337, -97.5, outlineClick).setLineWidth(3, 3);
		this.currencyContainer.add([closeButton, line1, line2]);
	}

	showCurrencyContainer() {
		PlayFabClient.GetStoreItems({ StoreId: "CurrenciesWithDiscount" }, (error, result) => {
			result.data.Store.forEach((storeItem: PlayFabClientModels.StoreItem) => {
				this.makeCurrency(storeItem);
			});
			const overlay = this.currencyContainer.getAt(0) as Phaser.GameObjects.Rectangle;
			const bg = this.currencyContainer.getAt(1) as RoundRectangle;
			const closeButton = this.currencyContainer.getAt(4) as RoundRectangle;
			const line1 = this.currencyContainer.getAt(5) as Phaser.GameObjects.Line;
			const line2 = this.currencyContainer.getAt(6) as Phaser.GameObjects.Line;
			if (result.data.StoreId === "CurrenciesWithDiscount") {
				overlay.setY(-25);
				bg.height = 305;
				bg.y = -25;
				closeButton.setY(-165);
				line1.setPosition(0, -50);
				line2.setPosition(0, -50);
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
				line1.setPosition(0, 0);
				line2.setPosition(0, 0);
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
		const itemDetail: ItemDetail = this.itemsMap[storeItem.ItemId];
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
			.text(x, -90, itemDetail.DisplayName.toUpperCase(), textStyle)
			.setAlign("center")
			.setOrigin(0.5, 0.5);
		const usdText = this.add.text(x, 80, `$ ${usd}.00`, textStyle).setAlign("center").setOrigin(0.5, 0.5);
		const highlight = this.add
			.existing(new RoundRectangle(this, x, 80, usdText.width + 16, usdText.height + 16, 10, 0xffffff))
			.setAlpha(0);
		const usdButton = this.add
			.existing(new RoundRectangle(this, x, 80, usdText.width + 16, usdText.height + 16, 10, buttonNormal))
			.setInteractive({ useHandCursor: true })
			.on("pointerover", () => {
				usdButton.setFillStyle(buttonHover, 1);
			})
			.on("pointerout", () => {
				usdButton.setFillStyle(buttonNormal, 1);
			})
			.on("pointerdown", () => {
				usdButton.setFillStyle(buttonClick, 1);
				this.add.tween({
					targets: [highlight],
					ease: "Sine.easeIn",
					props: {
						width: {
							value: usdText.width + 21,
							duration: 150,
							ease: "Sine.easeIn",
						},
						height: {
							value: usdText.height + 21,
							duration: 150,
							ease: "Sine.easeIn",
						},
						alpha: {
							value: 0.3,
							duration: 150,
							ease: "Sine.easeIn",
						},
					},
					callbackScope: this,
				});
			})
			.on("pointerup", (pointer: Phaser.Input.Pointer) => {
				this.setCurrencyLoading(true, usd, usdButton, usdText, highlight);
				PlayFabClient.ExecuteCloudScript(
					{
						FunctionName: "grantIcicleBundle",
						FunctionParameter: { itemId: itemDetail.ItemId, usd: usd },
					},
					(error, result) => {
						PlayFabClient.UnlockContainerItem({ ContainerItemId: itemDetail.ItemId }, (e, r) => {
							this.setCurrencyLoading(false, usd, usdButton, usdText, highlight);
							this.registry.values.IC += r.data.VirtualCurrency.IC;
							this.showToast(`${itemDetail.DisplayName} successfully purchased`, false);
						});
					}
				);
				this.add.tween({
					targets: [highlight],
					ease: "Sine.easeIn",
					duration: 300,
					alpha: 0,
					delay: 300,
					callbackScope: this,
				});
			});
		const currencyList = this.currencyContainer.getAt(2) as Phaser.GameObjects.Container;
		currencyList.add([background, image, nameText, highlight, usdButton, usdText]);
	}

	setCurrencyLoading(
		isLoading: boolean,
		usd: number,
		button: RoundRectangle,
		text: Phaser.GameObjects.Text,
		highlight: RoundRectangle
	) {
		if (isLoading) {
			text.setText(". . .").setOrigin(0.5, 0.725).setStyle({
				fontFamily: fontFamily,
				fontSize: "32px",
				stroke: "#ffffff",
				strokeThickness: 3,
			});
			button.setFillStyle(buttonClick, 1).disableInteractive().removeListener("pointerout");
		} else {
			text.setText(`$ ${usd}.00`)
				.setOrigin(0.5, 0.5)
				.setStyle({ ...textStyle, strokeThickness: 0 });
			button
				.setFillStyle(buttonNormal, 1)
				.setInteractive({ useHandCursor: true })
				.on("pointerout", () => {
					button.setFillStyle(buttonNormal, 1);
				});
			highlight.setAlpha(0);
		}
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
