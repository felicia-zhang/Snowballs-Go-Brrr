import { PlayFabClient } from "playfab-sdk";
import LeaderboardScene from "./leaderboard";
import GameScene from "./game";
import SigninScene from "./signin";
import sky from "../assets/sky.png";
import fire from "../assets/fire.png";
import igloo from "../assets/igloo.png";
import snowball from "../assets/snowball.png";
import snowman from "../assets/snowman.png";
import MenuScene from "./menu";

class Controller extends Phaser.Scene {
	constructor() {
		super("Controller");
	}

	preload() {
		this.load.image("sky", sky);
		this.load.image("fire", fire);
		this.load.image("igloo", igloo);
		this.load.image("snowball", snowball);
		this.load.image("snowman", snowman);
	}

	create() {
		this.game.input.mouse.disableContextMenu();
		this.scene.add("Leaderboard", LeaderboardScene);
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
