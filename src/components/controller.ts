import * as PlayFab from "playfab-sdk/Scripts/PlayFab/PlayFabClient.js";
import { PlayFabClient } from "playfab-sdk";
import LeaderboardScene from "./leaderboard";
import GameScene from "./game";
import SigninScene from "./signin";
import StoreScene from "./store";
import sky from "../assets/sky.png";
import fire1 from "../assets/fire1.png";
import fire2 from "../assets/fire2.png";
import fire3 from "../assets/fire3.png";
import fish from "../assets/fish.png";
import igloo from "../assets/igloo.png";
import penguin1 from "../assets/penguin1.png";
import penguin2 from "../assets/penguin2.png";
import penguin3 from "../assets/penguin3.png";
import MenuScene from "./menu";

class Controller extends Phaser.Scene {
	constructor() {
		super("Controller");
	}

	preload() {
		this.load.image("sky", sky);
		this.load.image("fire1", fire1, { frameWidth: 210, frameHeight: 270 } as PlayFab.ImageFrameConfig);
		this.load.image("fire2", fire2, { frameWidth: 210, frameHeight: 270 } as PlayFab.ImageFrameConfig);
		this.load.image("fire3", fire3, { frameWidth: 210, frameHeight: 270 } as PlayFab.ImageFrameConfig);
		this.load.image("fish", fish, { frameWidth: 360, frameHeight: 244 } as PlayFab.ImageFrameConfig);
		this.load.image("igloo", igloo, { frameWidth: 770, frameHeight: 620 } as PlayFab.ImageFrameConfig);
		this.load.image("penguin1", penguin1, { frameWidth: 355, frameHeight: 450 } as PlayFab.ImageFrameConfig);
		this.load.image("penguin2", penguin2, { frameWidth: 355, frameHeight: 450 } as PlayFab.ImageFrameConfig);
		this.load.image("penguin3", penguin3, { frameWidth: 355, frameHeight: 450 } as PlayFab.ImageFrameConfig);
	}

	create() {
		this.game.input.mouse.disableContextMenu();
		this.scene.add("Leaderboard", LeaderboardScene);
		this.scene.add("Store", StoreScene);
		this.scene.add("Signin", SigninScene);
		this.scene.add("Menu", MenuScene);
		this.scene.add("Game", GameScene);

		if (PlayFabClient.IsClientLoggedIn()) {
			this.scene.start("Menu");
		} else {
			this.scene.start("Signin");
		}
	}
}

export default Controller;
