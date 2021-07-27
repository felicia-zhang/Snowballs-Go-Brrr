import { PlayFabClient } from "playfab-sdk";
import { textStyle, clickAnimationDepth } from "../utils/constants";
import { BundleDetail, ItemDetail } from "../utils/types";
import Button from "../utils/button";
import { numberWithCommas, wrapString } from "../utils/stringFormat";
import LeaderboardContainer from "./leaderboardContainer";
import ResetContainer from "./resetContainer";
import StoreContainer from "./storeContainer";
import { showToast } from "./showToast";
import CurrencyContainer from "./currencyContainer";

class GameScene extends Phaser.Scene {
	readonly syncDelay = 60000;
	resetBonus: number;
	biomeId: string;
	biomeName: string;
	clickMultiplier: number;
	totalAddedSnowballs: number;
	syncTimer: Phaser.Time.TimerEvent;
	inventoryObjects: Phaser.GameObjects.GameObject[];
	inventoryTimers: Phaser.Time.TimerEvent[];
	snowballText: Phaser.GameObjects.Text;
	snowballIcon: Phaser.GameObjects.Image;
	icicleText: Phaser.GameObjects.Text;
	icicleIcon: Phaser.GameObjects.Image;
	resetBonusText: Phaser.GameObjects.Text;
	resetBonusIcon: Phaser.GameObjects.Image;
	storeContainer: StoreContainer;
	resetContainer: ResetContainer;
	currencyContainer: CurrencyContainer;
	leaderboardContainer: LeaderboardContainer;
	clickPenguinInstruction: Phaser.GameObjects.Text;
	clickStoreInstruction: Phaser.GameObjects.Text;
	itemsMap: { [key: string]: ItemDetail };
	bundlesMap: { [key: number]: BundleDetail };
	interactiveObjects: Phaser.GameObjects.GameObject[];
	firstItemPrice: number;

	constructor() {
		super("Game");
	}

	create({ biomeId, biomeName }) {
		this.cameras.main.fadeIn(1000, 0, 0, 0);
		this.add.image(400, 300, "sky");

		this.resetBonus = this.registry.get("ResetBonus") === 0 ? 0 : this.registry.get("ResetBonus");
		this.biomeId = biomeId;
		this.biomeName = biomeName;
		this.clickMultiplier = 100;
		this.totalAddedSnowballs = 0;
		this.inventoryObjects = [];
		this.inventoryTimers = [];
		this.firstItemPrice = undefined;
		this.itemsMap = {};
		this.bundlesMap = {};
		this.interactiveObjects = [];
		this.makePenguin();
		this.storeContainer = this.add.existing(new StoreContainer(this, 400, 300));
		this.resetContainer = this.add.existing(new ResetContainer(this, 400, 300));
		this.currencyContainer = this.add.existing(new CurrencyContainer(this, 400, 300));
		this.leaderboardContainer = this.add.existing(new LeaderboardContainer(this, 400, 300));

		PlayFabClient.GetStoreItems({ StoreId: this.biomeId }, (error, result) => {
			const mittens: PlayFabClientModels.StoreItem = result.data.Store.find(
				(storeItem: PlayFabClientModels.StoreItem) => storeItem.ItemId === "mittens"
			);
			this.firstItemPrice = mittens.VirtualCurrencyPrices.SB;
		});

		this.registry
			.get("CatalogItems")
			.filter((item: PlayFabClientModels.CatalogItem) => item.ItemClass !== "biome")
			.forEach((item: PlayFabClientModels.CatalogItem, i) => {
				if (item.ItemClass === "item") {
					this.itemsMap[item.ItemId] = {
						ItemId: item.ItemId,
						DisplayName: item.DisplayName,
						Description: item.Description,
						Instances: {},
					} as ItemDetail;
				} else if (item.ItemClass === "bundle") {
					this.bundlesMap[item.ItemId] = {
						ItemId: item.ItemId,
						DisplayName: item.DisplayName,
						Icicles: item.Bundle.BundledVirtualCurrencies.IC,
					} as BundleDetail;
				}
			});

		this.registry
			.get("Inventories")
			.filter(
				(inventory: PlayFabClientModels.ItemInstance) =>
					inventory.CustomData !== undefined && inventory.CustomData.BiomeId === this.biomeId
			)
			.forEach(inventory => this.inventoryItemFactory(inventory));

		PlayFabClient.GetUserData({ Keys: [`${this.biomeId}LastUpdated`] }, (error, result) => {
			if (result.data.Data[`${this.biomeId}LastUpdated`] !== undefined) {
				const lastUpdated = result.data.Data[`${this.biomeId}LastUpdated`].Value;
				const elapsed = new Date().valueOf() - Number(lastUpdated);
				const elapsedSeconds = elapsed / 1000;
				console.log("Elapsed seconds:", elapsedSeconds);
				const numberOfBonfires = Object.keys(this.itemsMap.bonfire.Instances).length;
				const numberOfSnowmans = Object.keys(this.itemsMap.snowman.Instances).length;
				const numberOfIgloos = Object.keys(this.itemsMap.igloo.Instances).length;
				const numberOfVaults = Object.keys(this.itemsMap.vault.Instances).length;
				const sb =
					Math.floor(elapsedSeconds / 10) * numberOfBonfires * (100 + this.resetBonus) +
					Math.floor(elapsedSeconds) * numberOfSnowmans * (100 + this.resetBonus) +
					Math.floor(elapsedSeconds) * numberOfIgloos * (1000 + this.resetBonus) +
					Math.floor(elapsedSeconds) * numberOfVaults * (10000 + this.resetBonus);

				this.registry.values.SB += sb;
				this.totalAddedSnowballs += sb;
				showToast(this, `${numberWithCommas(sb / 100)} snowballs added while player was away`, false);
			} else {
				showToast(this, `Welcome to ${this.biomeName}`, false);
			}
		});

		this.registry.events.on("changedata", this.updateData, this);

		this.syncTimer = this.time.addEvent({
			delay: this.syncDelay,
			loop: true,
			callback: () => this.syncData(() => showToast(this, "Saved", false)),
		});

		this.snowballText = this.add.text(50, 16, `: ${numberWithCommas(this.registry.get("SB") / 100)}`, textStyle);
		this.snowballIcon = this.add.image(31, 25, "snowball").setScale(0.15);
		this.icicleText = this.add.text(50, 56, `: ${numberWithCommas(this.registry.get("IC"))}`, textStyle);
		this.icicleIcon = this.add.image(31, 65, "icicle").setScale(0.15);
		this.resetBonusText = this.add.text(50, 96, "", textStyle);
		this.resetBonusIcon = this.add.image(31, 105, "star").setScale(0.15).setAlpha(0);
		if (this.resetBonus !== 0) {
			this.resetBonusText.setText(`: +${numberWithCommas(this.resetBonus / 100)}`);
			this.resetBonusIcon.setAlpha(1);
		}

		this.add.text(400, 16, this.biomeName.toUpperCase(), textStyle).setAlign("center").setOrigin(0.5, 0);

		const storeButton = this.add.existing(
			new Button(this, 30, 390)
				.addIcon("store")
				.addHoverText("Store")
				.addCallback(() => {
					this.interactiveObjects.forEach(object => object.disableInteractive());
					if (this.clickStoreInstruction.alpha === 1) {
						this.registry.set("hasShownClickStoreInstruction", true);
						this.add.tween({
							targets: [this.clickStoreInstruction],
							duration: 200,
							alpha: 0,
						});
					}
					this.storeContainer.show();
				})
		);
		this.interactiveObjects.push(storeButton);

		const mapButton = this.add.existing(
			new Button(this, 30, 435)
				.addIcon("map")
				.addHoverText("Map")
				.addCallback(() => {
					this.syncData(() => {
						this.cameras.main.fadeOut(500, 0, 0, 0);
						this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, (cam, effect) => {
							this.scene.start("Map");
						});
					});
				})
		);
		this.interactiveObjects.push(mapButton);

		const leaderboardButton = this.add.existing(
			new Button(this, 30, 480)
				.addIcon("leaderboard")
				.addHoverText("Leaderboard")
				.addCallback(() => {
					this.interactiveObjects.forEach(object => object.disableInteractive());
					this.leaderboardContainer.show();
				})
		);
		this.interactiveObjects.push(leaderboardButton);

		const resetButton = this.add.existing(
			new Button(this, 30, 525)
				.addIcon("reset")
				.addHoverText("Reset")
				.addCallback(() => {
					this.interactiveObjects.forEach(object => object.disableInteractive());
					this.resetContainer.show();
				})
		);
		this.interactiveObjects.push(resetButton);

		const iapButton = this.add.existing(
			new Button(this, 30, 570)
				.addIcon("iap")
				.addHoverText("In-app Purchase")
				.addCallback(() => {
					this.interactiveObjects.forEach(object => object.disableInteractive());
					this.currencyContainer.show();
				})
		);
		this.interactiveObjects.push(iapButton);

		this.clickPenguinInstruction = this.add
			.text(150, 300, wrapString("Click on the penguin to generate snowballs"), textStyle)
			.setAlign("left")
			.setOrigin(0, 1)
			.setAlpha(0);
		this.add.tween({
			targets: [this.clickPenguinInstruction],
			ease: "Sine.easeIn",
			duration: 500,
			x: 140,
			yoyo: true,
			repeat: -1,
		});
		this.clickStoreInstruction = this.add
			.text(100, 424, wrapString("Purchase your first item"), textStyle)
			.setAlign("left")
			.setOrigin(0, 1)
			.setAlpha(0);
		this.add.tween({
			targets: [this.clickStoreInstruction],
			ease: "Sine.easeIn",
			duration: 500,
			x: 90,
			yoyo: true,
			repeat: -1,
		});
	}

	updateData(parent, key, data) {
		if (this.scene.isActive()) {
			if (key === "SB") {
				this.snowballText.setText(`: ${numberWithCommas(data / 100)}`);
			} else if (key === "IC") {
				this.icicleText.setText(`: ${numberWithCommas(data)}`);
			} else if (key === "ResetBonus") {
				if (data !== 0) {
					this.resetBonus = data;
					this.resetBonusText.setText(`: +${numberWithCommas(data / 100)}`);
					this.resetBonusIcon.setAlpha(1);
				}
			}
		}
	}

	update() {
		if (this.registry.get("isNewPlayer")) {
			if (!this.registry.get("hasShownClickPenguinInstruction")) {
				this.clickPenguinInstruction.setAlpha(1);
			}

			if (
				!this.registry.get("hasShownClickStoreInstruction") &&
				this.firstItemPrice !== undefined &&
				this.registry.get("SB") >= this.firstItemPrice
			) {
				this.clickStoreInstruction.setAlpha(1);
			} else {
				this.clickStoreInstruction.setAlpha(0);
			}
		}

		if (!this.registry.has("IsSignedIn") || !this.registry.get("IsSignedIn")) {
			this.scene.start("Signin");
		}
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
						showToast(this, `${bundleDetail.DisplayName} successfully purchased`, false);
					},
				});
			}
		);
	}

	reset(button: Button) {
		button.toggleLoading(true);
		this.inventoryObjects.forEach((object: Phaser.GameObjects.GameObject) => {
			object.destroy(true);
		});
		this.inventoryObjects = [];
		this.inventoryTimers.forEach((timer: Phaser.Time.TimerEvent) => {
			timer.destroy();
		});
		this.inventoryTimers = [];

		this.syncData(() => {
			const bonus = Math.floor(this.registry.get("SB") / 1000000);
			const inventoryGroupsToRevoke: string[][] = [];
			let i = 0;
			const inventoryIds: string[] = this.registry
				.get("Inventories")
				.filter((inventory: PlayFabClientModels.ItemInstance) => inventory.ItemId !== "icebiome")
				.map((inventory: PlayFabClientModels.ItemInstance) => inventory.ItemInstanceId);
			while (i < inventoryIds.length) {
				inventoryGroupsToRevoke.push(inventoryIds.slice(i, i + 25));
				i += 25;
			}
			PlayFabClient.ExecuteCloudScript(
				{
					FunctionName: "resetGame",
					FunctionParameter: {
						inventoryGroupsToRevoke: inventoryGroupsToRevoke,
						bonus: bonus,
						snowballsToRevoke: this.registry.get("SB"),
					},
				},
				(e, r) => {
					this.clickMultiplier = 100;
					this.totalAddedSnowballs = 0;
					const icebiome: PlayFabClientModels.ItemInstance = this.registry
						.get("Inventories")
						.find((inventory: PlayFabClientModels.ItemInstance) => inventory.ItemId === "icebiome");
					this.registry.set("Inventories", [icebiome]);
					const currentResetBonus = this.registry.get("ResetBonus");
					this.registry.set("ResetBonus", currentResetBonus + bonus);
					this.registry.set("SB", 0);

					const result = r.data.FunctionResult;
					console.log("Revoked items errors: ", result.revokeItemsErrors);
					console.log("Added reset bonus statistics", bonus);
					console.log("Cleared biomes LastUpdated data");
					console.log("Revoked all snowballs: ", result.subtractSBResult);
					button.toggleLoading(false);
					this.add.tween({
						targets: [this.resetContainer],
						ease: "Sine.easeIn",
						duration: 300,
						alpha: 0,
						onComplete: () => {
							this.interactiveObjects.forEach(object => object.setInteractive({ useHandCursor: true }));
							showToast(this, "Reset Game", false);

							if (this.biomeId !== "icebiome") {
								this.cameras.main.fadeOut(500, 0, 0, 0);
								this.cameras.main.once(
									Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
									(cam, effect) => {
										this.scene.start("Game", { biomeId: "icebiome", biomeName: "Ice Biome" });
									}
								);
							}
						},
						callbackScope: this,
					});
				}
			);
		});
	}

	makePenguin() {
		this.anims.create({
			key: "squish",
			frames: [
				{ key: "penguin1" },
				{ key: "penguin2" },
				{ key: "penguin3" },
				{ key: "penguin2" },
				{ key: "penguin1" },
			],
			frameRate: 8,
		});

		const sprite = this.add
			.sprite(35, 300, "penguin1")
			.setOrigin(0, 0.5)
			.setScale(0.5)
			.setInteractive({ useHandCursor: true })
			.on("pointerup", (pointer: Phaser.Input.Pointer) => {
				if (this.clickPenguinInstruction.alpha === 1) {
					this.registry.set("hasShownClickPenguinInstruction", true);
					this.add.tween({
						targets: [this.clickPenguinInstruction],
						duration: 200,
						alpha: 0,
					});
				}
				const currentClickMultiplier = this.clickMultiplier + this.resetBonus;
				this.totalAddedSnowballs += currentClickMultiplier;
				this.registry.values.SB += currentClickMultiplier;
				const amountText = this.add
					.text(pointer.x, pointer.y, (currentClickMultiplier / 100).toString(), textStyle)
					.setAlpha(0)
					.setAlign("center")
					.setOrigin(0.5, 0.5)
					.setDepth(clickAnimationDepth);
				this.showClickAnimation(amountText);
				if (!sprite.anims.isPlaying) {
					sprite.anims.play("squish");
				}
			});
		this.interactiveObjects.push(sprite);
		return sprite;
	}

	purchaseItem(itemDetail: ItemDetail, maybeItemDiscountPrice: number, storeId: string, button: Button) {
		if (Object.keys(itemDetail.Instances).length === 6) {
			showToast(this, "Not enough room", true);
		} else {
			button.toggleLoading(true);
			this.syncData(() => {
				PlayFabClient.PurchaseItem(
					{
						ItemId: itemDetail.ItemId,
						Price: maybeItemDiscountPrice,
						StoreId: storeId,
						VirtualCurrency: "SB",
					},
					(e, r) => {
						if (e !== null) {
							this.time.addEvent({
								delay: 400,
								callback: () => {
									button.toggleLoading(false);
									showToast(this, "Not enough snowballs", true);
								},
							});
						} else {
							PlayFabClient.ExecuteCloudScript(
								{
									FunctionName: "updateInventoryCustomData",
									FunctionParameter: {
										instanceId: r.data.Items[0].ItemInstanceId,
										biomeId: this.biomeId,
									},
								},
								(error, result) => {
									button.toggleLoading(false);
									this.registry.values.SB -= maybeItemDiscountPrice;
									this.registry.values.Inventories.push(result.data.FunctionResult);
									this.inventoryItemFactory(result.data.FunctionResult);
									showToast(this, `1 ${itemDetail.DisplayName} successfully purchased`, false);
								}
							);
						}
					}
				);
			});
		}
	}

	inventoryItemFactory(inventory: PlayFabClientModels.ItemInstance) {
		const itemDetail: ItemDetail = this.itemsMap[inventory.ItemId];
		const index = Object.keys(itemDetail.Instances).length;
		itemDetail.Instances[inventory.ItemInstanceId] = inventory;
		let sprite: Phaser.GameObjects.Sprite;
		if (inventory.ItemId === "mittens") {
			sprite = this.makeMittens(index);
		} else if (inventory.ItemId === "bonfire") {
			sprite = this.makeItem(index, 150, 100, 10000, inventory.ItemId);
		} else if (inventory.ItemId === "snowman") {
			sprite = this.makeItem(index, 250, 100, 1000, inventory.ItemId);
		} else if (inventory.ItemId === "igloo") {
			sprite = this.makeItem(index, 350, 1000, 1000, inventory.ItemId);
		} else if (inventory.ItemId === "vault") {
			sprite = this.makeItem(index, 450, 10000, 1000, inventory.ItemId);
		}
		sprite.setOrigin(0, 0).setScale(0.5);
	}

	makeMittens(index: number) {
		this.clickMultiplier += 100;
		const sprite = this.add.sprite(170 + index * 100, 50, "mittens");
		this.inventoryObjects.push(sprite);
		return sprite;
	}

	makeItem(index: number, y: number, snowballGeneration: number, delay: number, imageKey: string) {
		const snowballsToAdd = snowballGeneration + this.resetBonus;
		const amountText = this.add
			.text(220 + index * 100, y, `+${snowballsToAdd / 100}`, textStyle)
			.setAlpha(0)
			.setAlign("center")
			.setOrigin(0.5, 0.5)
			.setDepth(clickAnimationDepth);
		const timer = this.time.addEvent({
			delay: delay,
			loop: true,
			callback: () => {
				amountText.setY(y);
				this.registry.values.SB += snowballsToAdd;
				this.totalAddedSnowballs += snowballsToAdd;
				this.showClickAnimation(amountText);
			},
		});
		const sprite = this.add.sprite(170 + index * 100, y, imageKey);
		this.inventoryObjects.push(sprite, amountText);
		this.inventoryTimers.push(timer);
		return sprite;
	}

	showClickAnimation(amountText: Phaser.GameObjects.Text) {
		const startingY = amountText.y;
		this.add.tween({
			targets: [amountText],
			props: {
				y: {
					value: startingY - 100,
					duration: 500,
					ease: "Sine.easeIn",
				},
				alpha: {
					value: 0,
					duration: 500,
					ease: "Sine.easeIn",
				},
			},
			onStart: () => {
				amountText.setAlpha(1);
			},
			callbackScope: this,
		});
	}

	syncData(func: () => any) {
		PlayFabClient.UpdateUserData(
			{ Data: { [`${this.biomeId}LastUpdated`]: new Date().valueOf().toString() } },
			() => {}
		);

		const totalAdded = this.totalAddedSnowballs;
		if (totalAdded === 0) {
			console.log("No change to snowballs since last sync");
			if (func !== undefined) {
				func();
			}
		} else {
			PlayFabClient.ExecuteCloudScript(
				{
					FunctionName: "addSnowballs",
					FunctionParameter: { amount: totalAdded },
				},
				(error, result) => {
					console.log("Amount of snowballs added:", totalAdded);
					this.totalAddedSnowballs -= totalAdded;
					PlayFabClient.ExecuteCloudScript(
						{
							FunctionName: "updateSnowballStatistics",
							FunctionParameter: {
								amount: this.registry.values.SB,
							},
						},
						() => {
							if (func !== undefined) {
								func();
							}
						}
					);
				}
			);
		}
	}
}

export default GameScene;
