import GameScene from "../components/game";
import BaseItem from "./BaseItem";

export default class Torch extends BaseItem {
	constructor(scene: GameScene, x, y, level, totalLevel, description) {
		super(scene, x, y, "fire", level, totalLevel, description);
	}

	useItem() {}
}
