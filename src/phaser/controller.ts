import GameScene from "./game";
import SigninScene from "./signin";
import AScene from "./AScene";
import MapScene from "./map";
import Load from "./load";

class Controller extends AScene {
	finishLoading: () => any;
	constructor(finishLoading: () => any) {
		super("Controller");
		this.finishLoading = finishLoading;
	}

	create() {
		this.game.input.mouse.disableContextMenu();
		this.scene.add("Signin", SigninScene);
		this.scene.add("Game", GameScene);
		this.scene.add("Map", MapScene);
		this.scene.add("Load", Load);

		if (this.registry.has("FinishedSignIn")) {
			console.log("Controller -- has finished sign in");
		} else {
			this.scene.start("Load", this.finishLoading);
		}
	}
}

export default Controller;
