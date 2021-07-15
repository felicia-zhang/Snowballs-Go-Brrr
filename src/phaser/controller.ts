import GameScene from "./game";
import SigninScene from "./signin";
import AScene from "./AScene";
import MapScene from "./map";
import sky from "../assets/sky.png";
import PreloadScene from "./preload";

class Controller extends AScene {
	finishLoading: () => any;
	constructor(finishLoading: () => any) {
		super("Controller");
		this.finishLoading = finishLoading;
	}

	preload() {
		this.load.image("sky", sky);
	}

	create() {
		this.game.input.mouse.disableContextMenu();
		this.scene.add("Signin", SigninScene);
		this.scene.add("Game", GameScene);
		this.scene.add("Map", MapScene);
		this.scene.add("Preload", PreloadScene);

		if (this.registry.has("FinishedSignIn")) {
			console.log("Controller -- has finished sign in");
		} else {
			this.scene.start("Preload", this.finishLoading);
		}
	}
}

export default Controller;
