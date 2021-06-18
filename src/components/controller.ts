import { PlayFabClient } from "playfab-sdk";
import LeaderboardScene from "./leaderboard";
import GameScene from "./game";
import SigninScene from "./signin";
import sky from "../assets/sky.png";
import fire from "../assets/fire.png";
import igloo from "../assets/igloo.png";
import snowball1 from "../assets/snowball1.png";
import snowball2 from "../assets/snowball2.png";
import snowball3 from "../assets/snowball3.png";
import snowman from "../assets/snowman.png";
import mittens from "../assets/mittens.png";
import vault from "../assets/vault.png";
import close from "../assets/close.png";
import lock from "../assets/lock.png";
import MenuScene from "./menu";

class Controller extends Phaser.Scene {
	constructor() {
		super("Controller");
	}

	preload() {
		this.load.image("sky", sky);
		this.load.image("fire", fire);
		this.load.image("igloo", igloo);
		this.load.image("snowball1", snowball1);
		this.load.image("snowball2", snowball2);
		this.load.image("snowball3", snowball3);
		this.load.image("snowman", snowman);
		this.load.image("mittens", mittens);
		this.load.image("vault", vault);
		this.load.image("close", close);
		this.load.image("lock", lock);
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
