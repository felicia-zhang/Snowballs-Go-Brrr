import GameScene from "../components/game";

export default class Torch extends Phaser.GameObjects.Sprite {
    level: number
    totalLevel: number
    timerEvent: Phaser.Time.TimerEvent

    constructor(scene: GameScene, x, y, level, totalLevel) {
      super(scene, x, y, 'fire');
      this.level = level
      this.totalLevel = totalLevel
      this.timerEvent = scene.time.addEvent({
        delay: 1000,
        callback() {
            scene.totalClick += level
            console.log("torch")
        },
        callbackScope: this,
        loop: true,
      });
    }
  }