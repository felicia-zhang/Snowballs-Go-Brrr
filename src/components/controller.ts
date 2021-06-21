import { PlayFabClient } from "playfab-sdk";
import LeaderboardScene from "./leaderboard";
import GameScene from "./game";
import SigninScene from "./signin";
import sky from "../assets/sky.png";
import fire from "../assets/fire.png";
import igloo from "../assets/igloo.png";
import snowball from "../assets/snowball.png";
import snowman from "../assets/snowman.png";
import mittens from "../assets/mittens.png";
import vault from "../assets/vault.png";
import close from "../assets/close.png";
import lock from "../assets/lock.png";
import penguin1 from "../assets/penguin1.png";
import penguin2 from "../assets/penguin2.png";
import penguin3 from "../assets/penguin3.png";
import MenuScene from "./menu";
import AScene from "./AScene";

class Controller extends AScene {
	constructor() {
		super("Controller");
	}

	preload() {
		this.load.image("sky", sky);
		this.load.image("fire", fire);
		this.load.image("igloo", igloo);
		this.load.image("snowball", snowball);
		this.load.image("snowman", snowman);
		this.load.image("mittens", mittens);
		this.load.image("vault", vault);
		this.load.image("close", close);
		this.load.image("lock", lock);
		this.load.image("penguin1", penguin1);
		this.load.image("penguin2", penguin2);
		this.load.image("penguin3", penguin3);
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
