import { PlayFabClient } from "playfab-sdk";
import LeaderboardScene from "./leaderboard";
import GameScene from "./game";
import SigninScene from "./signin";
import sky from "../assets/sky.png";
import fire from "../assets/fire.png";
import igloo from "../assets/igloo.png";
import snowball from "../assets/snowball.png";
import icicle from "../assets/icicle.png";
import icicle1 from "../assets/icicle1.png";
import icicle2 from "../assets/icicle2.png";
import icicle3 from "../assets/icicle3.png";
import icicle4 from "../assets/icicle4.png";
import snowman from "../assets/snowman.png";
import mittens from "../assets/mittens.png";
import vault from "../assets/vault.png";
import close from "../assets/close.png";
import lock from "../assets/lock.png";
import penguin1 from "../assets/penguin1.png";
import penguin2 from "../assets/penguin2.png";
import penguin3 from "../assets/penguin3.png";
import banner from "../assets/banner.png";
import landIce from "../assets/land-ice.png";
import MenuScene from "./menu";
import AScene from "./AScene";
import MapScene from "./map";

class Controller extends AScene {
	constructor() {
		super("Controller");
	}

	preload() {
		this.load.image("sky", sky);
		this.load.image("fire", fire);
		this.load.image("igloo", igloo);
		this.load.image("snowball", snowball);
		this.load.image("icicle", icicle);
		this.load.image("icicle1", icicle1);
		this.load.image("icicle2", icicle2);
		this.load.image("icicle3", icicle3);
		this.load.image("icicle4", icicle4);
		this.load.image("snowman", snowman);
		this.load.image("mittens", mittens);
		this.load.image("vault", vault);
		this.load.image("close", close);
		this.load.image("lock", lock);
		this.load.image("penguin1", penguin1);
		this.load.image("penguin2", penguin2);
		this.load.image("penguin3", penguin3);
		this.load.image("banner", banner);
		this.load.image("landIce", landIce);
	}

	create() {
		this.game.input.mouse.disableContextMenu();
		this.scene.add("Leaderboard", LeaderboardScene);
		this.scene.add("Signin", SigninScene);
		this.scene.add("Menu", MenuScene);
		this.scene.add("Game", GameScene);
		this.scene.add("Map", MapScene);

		if (PlayFabClient.IsClientLoggedIn()) {
			this.scene.start("Menu");
		} else {
			this.scene.start("Signin");
		}
	}
}

export default Controller;
