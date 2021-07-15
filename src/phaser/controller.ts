import GameScene from "./game";
import SigninScene from "./signin";
import AScene from "./AScene";
import MapScene from "./map";
import sky from "../assets/sky.png";
import title from "../assets/title.png";
import light1 from "../assets/light1.png";
import light2 from "../assets/light2.png";
import light3 from "../assets/light3.png";
import light4 from "../assets/light4.png";
import PreloadScene from "./preload";

class Controller extends AScene {
	constructor() {
		super("Controller");
	}

	preload() {
		this.load.image("sky", sky);
		this.load.image("title", title);
		this.load.image("light1", light1);
		this.load.image("light2", light2);
		this.load.image("light3", light3);
		this.load.image("light4", light4);
	}

	create(finishLoading: () => any) {
		this.game.input.mouse.disableContextMenu();
		this.scene.add("Signin", SigninScene);
		this.scene.add("Game", GameScene);
		this.scene.add("Map", MapScene);
		this.scene.add("Preload", PreloadScene);

		if (this.registry.has("FinishedSignIn")) {
			console.log("Controller -- has finished sign in");
		} else {
			this.scene.start("Preload", finishLoading);
		}
	}
}

export default Controller;
