import GameScene from "../components/game";
import BaseItem from "./BaseItem";

export default class Igloo extends BaseItem {
	constructor(game: GameScene, x, y, item) {
		super(game, x, y, item, "igloo");
	}

	useItem() {}
}
