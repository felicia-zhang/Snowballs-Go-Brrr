import GameScene from "../components/game";
import BaseItem from "./BaseItem";

export default class Torch extends BaseItem {
	timerEvent: Phaser.Time.TimerEvent;
	constructor(scene: GameScene, x, y, level, totalLevel, description) {
		super(scene, x, y, "fire", level, totalLevel, description);
	}

	useItem() {
		this.timerEvent = this.scene.time.addEvent({
			delay: 1000,
			callback() {
				this.scene.totalClick += this.level;
			},
			callbackScope: this,
			loop: true,
		});
	}
}
