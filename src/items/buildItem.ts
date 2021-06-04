import Torch from "./Torch";
import Igloo from "./Igloo";
import Penguin from "./Penguin";
import GameScene from "../components/game";
import * as PlayFab from "playfab-sdk/Scripts/PlayFab/PlayFabClient.js";

const buildItem = (item: PlayFab.ItemInstance, game: GameScene, x: number, y: number) => {
	if (item.DisplayName === "Penguin") {
		return new Penguin(game, x, y, 1, 3, "penguin");
	} else if (item.DisplayName === "Igloo") {
		return new Igloo(game, x, y, 1, 3, "igloo");
	} else if (item.DisplayName === "Torch") {
		return new Torch(game, x, y, 1, 3, "torch");
	} else {
		console.log("not valid item");
	}
};

export default buildItem;
