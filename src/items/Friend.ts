import BaseItem from "./BaseItem";

export default class Friend extends BaseItem {
	constructor(scene, x, y, level, totalLevel, description) {
		super(scene, x, y, "penguin3", level, totalLevel, description);
	}

	useItem() {
		this.scene.clickMultiplier += this.level;

		this.anims.create({
			key: "bounce",
			frames: [{ key: "penguin3" }, { key: "penguin2" }, { key: "penguin1" }, { key: "penguin2" }],
			frameRate: 8,
			repeat: -1,
		});
		this.anims.play("bounce");
	}
}
