import Torch from "./Torch";
import Igloo from "./Igloo";
import Penguin from "./Penguin";
import GameScene from "../components/game";

const buildItem = (item: PlayFabClientModels.ItemInstance, scene: GameScene, x: number, y: number) => {
	if (item.DisplayName === "Penguin") {
		return new Penguin(scene, x, y, item);
	} else if (item.DisplayName === "Igloo") {
		return new Igloo(scene, x, y, item);
	} else if (item.DisplayName === "Torch") {
		return new Torch(scene, x, y, item);
	} else {
		console.log("not valid item");
	}
};

export default buildItem;
