import GameScene from "../components/game";
import BaseItem from "./BaseItem";

export default class Torch extends BaseItem {
	constructor(game: GameScene, x, y, level, totalLevel, description) {
		super(game, x, y, "fire", level, totalLevel, description);
	}

	useItem() {}

	upgrade() {
		this.level++;
		console.log(this.level, this.description);
	}
}
