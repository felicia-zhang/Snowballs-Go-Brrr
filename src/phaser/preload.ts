import bonfire from "../assets/bonfire.png";
import igloo from "../assets/igloo.png";
import snowball from "../assets/snowball.png";
import icicle from "../assets/icicle.png";
import icicles10 from "../assets/icicles10.png";
import icicles50 from "../assets/icicles50.png";
import icicles100 from "../assets/icicles100.png";
import icicles500 from "../assets/icicles500.png";
import snowman from "../assets/snowman.png";
import mittens from "../assets/mittens.png";
import vault from "../assets/vault.png";
import lock from "../assets/lock.png";
import penguin1 from "../assets/penguin1.png";
import penguin2 from "../assets/penguin2.png";
import penguin3 from "../assets/penguin3.png";
import icebiome from "../assets/icebiome.png";
import savannabiome from "../assets/savannabiome.png";
import magmabiome from "../assets/magmabiome.png";
import marinebiome from "../assets/marinebiome.png";
import tropicalbiome from "../assets/tropicalbiome.png";
import mountain1 from "../assets/mountain1.png";
import mountain2 from "../assets/mountain2.png";
import mountain3 from "../assets/mountain3.png";
import leaderboard from "../assets/leaderboard.png";
import reset from "../assets/reset.png";
import iap from "../assets/iap.png";
import store from "../assets/store.png";
import map from "../assets/map.png";
import star from "../assets/star.png";
import { fontFamily, largeFontSize } from "../utils/constants";

class PreloadScene extends Phaser.Scene {
	constructor() {
		super("Preload");
	}

	preload() {
		this.add.image(400, 300, "sky");
		this.add.image(400, 220, "title").setScale(0.75);
		this.add
			.text(400, 350, "LOADING", { fontFamily: fontFamily, fontSize: largeFontSize })
			.setOrigin(0.5, 0.5)
			.setAlign("center");
		this.anims.create({
			key: "flash",
			yoyo: true,
			frames: [{ key: "light4" }, { key: "light3" }, { key: "light2" }, { key: "light1" }],
			frameRate: 8,
		});
		const light1 = this.add.sprite(370, 380, "light4").setScale(0.15);
		const light2 = this.add.sprite(400, 380, "light4").setScale(0.15);
		const light3 = this.add.sprite(430, 380, "light4").setScale(0.15);
		let count = 1;
		this.time.addEvent({
			delay: 250,
			loop: true,
			callback: () => {
				if (count === 1) {
					light1.anims.play("flash");
				} else if (count === 2) {
					light2.anims.play("flash");
				} else if (count === 3) {
					light3.anims.play("flash");
				} else if (count === 4) {
					count = -1;
				}
				count++;
			},
		});

		this.load.image("bonfire", bonfire);
		this.load.image("igloo", igloo);
		this.load.image("snowball", snowball);
		this.load.image("icicle", icicle);
		this.load.image("icicles10", icicles10);
		this.load.image("icicles50", icicles50);
		this.load.image("icicles100", icicles100);
		this.load.image("icicles500", icicles500);
		this.load.image("snowman", snowman);
		this.load.image("mittens", mittens);
		this.load.image("vault", vault);
		this.load.image("lock", lock);
		this.load.image("penguin1", penguin1);
		this.load.image("penguin2", penguin2);
		this.load.image("penguin3", penguin3);
		this.load.image("icebiome", icebiome);
		this.load.image("savannabiome", savannabiome);
		this.load.image("magmabiome", magmabiome);
		this.load.image("marinebiome", marinebiome);
		this.load.image("tropicalbiome", tropicalbiome);
		this.load.image("mountain1", mountain1);
		this.load.image("mountain2", mountain2);
		this.load.image("mountain3", mountain3);
		this.load.image("leaderboard", leaderboard);
		this.load.image("reset", reset);
		this.load.image("iap", iap);
		this.load.image("store", store);
		this.load.image("map", map);
		this.load.image("star", star);
	}

	create(toggleSignIn: (isSignedIn: boolean, errors?: string[]) => any) {
		this.time.addEvent({
			delay: 3500,
			loop: true,
			callback: () => {
				this.cameras.main.fadeOut(500, 0, 0, 0);
				this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, (cam, effect) => {
					toggleSignIn(true);
					this.scene.start("Signin");
				});
			},
		});
	}
}

export default PreloadScene;
