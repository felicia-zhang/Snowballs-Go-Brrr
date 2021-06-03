import * as PlayFab from "playfab-sdk/Scripts/PlayFab/PlayFabClient.js";
import { PlayFabClient } from "playfab-sdk";
import LeaderboardScene from "./leaderboard";
import GameScene from "./game";
import LoginScene from "./login";
import StoreScene from "./store";
import sky from "../assets/sky.png";
import fire from "../assets/fire.png";
import igloo from "../assets/igloo.png";

class Controller extends Phaser.Scene {
	constructor() {
		super("Controller");
	}

	preload() {
		this.load.image("sky", sky);
		this.load.image("fire", fire, { frameWidth: 355, frameHeight: 450 } as PlayFab.ImageFrameConfig);
		this.load.image("igloo", igloo, { frameWidth: 770, frameHeight: 620 } as PlayFab.ImageFrameConfig);
	}

	create() {
		this.scene.add("Leaderboard", LeaderboardScene);
		this.scene.add("Store", StoreScene);
		this.scene.add("Login", LoginScene);
		this.scene.add("Game", GameScene);

		if (PlayFabClient.IsClientLoggedIn()) {
			this.scene.start("Store");
		} else {
			this.scene.start("Login");
		}
	}
}

export default Controller;
