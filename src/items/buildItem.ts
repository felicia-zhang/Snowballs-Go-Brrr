import Torch from "./Torch";
import Igloo from "./Igloo";
import Friend from "./Friend";
import GameScene from "../components/game";
import * as PlayFab from "playfab-sdk/Scripts/PlayFab/PlayFabClient.js";

const buildItem = (item: PlayFab.ItemInstance, scene: GameScene, x: number, y: number) => {
	if (item.DisplayName === "Penguin") {
		return new Friend(scene, x, y, 1, 3, "penguin");
	} else if (item.DisplayName === "Igloo") {
		return new Igloo(scene, x, y, 1, 3, "igloo");
	} else if (item.DisplayName === "Torch") {
		return new Torch(scene, x, y, 1, 3, "torch");
	} else {
		console.log("not valid item");
	}
};

export default buildItem;
