import GameScene from "../components/game";
import BaseItem from "./BaseItem";

export default class Igloo extends BaseItem {
	constructor(scene: GameScene, x, y, level, totalLevel) {
		super(scene, x, y, "igloo", level, totalLevel);
	}

	useItem() {
		console.log("use igloo");
	}
}
