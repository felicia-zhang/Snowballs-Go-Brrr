import AScene from "./AScene";
import { PlayFabClient } from "playfab-sdk";

class SigninScene extends AScene {
	updateCounter: number;
	mountain3: Phaser.GameObjects.Image;
	mountain2: Phaser.GameObjects.Image;
	mountain1: Phaser.GameObjects.Image;
	mountain3Backup: Phaser.GameObjects.Image;
	mountain2Backup: Phaser.GameObjects.Image;
	mountain1Backup: Phaser.GameObjects.Image;

	constructor() {
		super("Signin");
	}

	create() {
		this.updateCounter = 0;
		this.add.image(400, 300, "sky");
		this.anims.create({
			key: "shine",
			repeat: -1,
			yoyo: true,
			frames: [{ key: "light1" }, { key: "light2" }, { key: "light3" }, { key: "light4" }],
			frameRate: 4,
		});

		this.add.sprite(150, 70, "light1").setScale(0.15).anims.play("shine");
		this.add.sprite(40, 140, "light1").setScale(0.23).anims.play("shine");
		this.add.sprite(630, 190, "light1").setScale(0.2).anims.play("shine");
		this.add.sprite(670, 30, "light1").setScale(0.07).anims.play("shine");
		this.add.sprite(740, 120, "light1").setScale(0.15).anims.play("shine");
		this.add.sprite(240, 210, "light1").setScale(0.1).anims.play("shine");
		this.mountain3 = this.add.image(0, 600, "mountain3").setOrigin(0, 1);
		this.mountain3Backup = this.add.image(800, 600, "mountain3").setOrigin(0, 1);
		this.mountain2 = this.add.image(0, 600, "mountain2").setOrigin(0, 1);
		this.mountain2Backup = this.add.image(800, 600, "mountain2").setOrigin(0, 1);
		this.mountain1 = this.add.image(0, 600, "mountain1").setOrigin(0, 1);
		this.mountain1Backup = this.add.image(800, 600, "mountain1").setOrigin(0, 1);

		this.add.image(400, 120, "title").setScale(0.75);
	}

	update() {
		this.mountain3.x -= 0.1;
		this.mountain2.x -= 0.2;
		this.mountain1.x -= 0.4;
		this.mountain3Backup.x -= 0.1;
		this.mountain2Backup.x -= 0.2;
		this.mountain1Backup.x -= 0.4;

		[
			this.mountain1,
			this.mountain2,
			this.mountain3,
			this.mountain1Backup,
			this.mountain2Backup,
			this.mountain3Backup,
		].forEach((image: Phaser.GameObjects.Image) => {
			if (image.x <= -800) {
				const diff = -800 - image.x;
				image.setX(800 - diff);
			}
		});

		if (this.registry.has("FinishedSignIn") && this.updateCounter === 0) {
			this.updateCounter++;
			this.cameras.main.fadeOut(500, 0, 0, 0);

			PlayFabClient.GetCatalogItems({ CatalogVersion: "1" }, (error, result) => {
				this.registry.set("CatalogItems", result.data.Catalog);

				PlayFabClient.GetPlayerStatistics({ StatisticNames: ["resetBonus"] }, (e, r) => {
					const resetStat = r.data.Statistics.find(
						(stat: PlayFabClientModels.StatisticValue) => stat.StatisticName === "resetBonus"
					);
					this.registry.set("ResetBonus", resetStat === undefined ? 0 : resetStat.Value);

					PlayFabClient.GetUserInventory({}, (error, result) => {
						this.registry.set("SB", result.data.VirtualCurrency.SB);
						this.registry.set("IC", result.data.VirtualCurrency.IC);
						this.registry.set("Inventories", result.data.Inventory);

						this.scene.start("Game", { biomeId: "icebiome", biomeName: "Ice Biome" });
					});
				});
			});
		}
	}
}

export default SigninScene;
