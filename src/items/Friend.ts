import GameScene from "../components/game";
import { fontFamily } from "../utils/font";

export default class Friend extends Phaser.GameObjects.Sprite {
    level: number
    totalLevel: number
    scene: GameScene
    descriptionBox: Phaser.GameObjects.Text

    constructor(scene: GameScene, x, y, level, totalLevel) {
      super(scene, x, y, 'penguin3');
      this.scene = scene
      this.level = level
      this.totalLevel = totalLevel
      scene.clickMultiplier += level

      this.anims.create({
        key: 'bounce',
        frames: [
            { key: 'penguin3' },
            { key: 'penguin2' },
            { key: 'penguin1' },
            { key: 'penguin2' }
        ],
        frameRate: 8,
        repeat: -1
    });
    this.anims.play('bounce');
    this.setInteractive().on('pointerover', this.createDescriptionBox).on('pointerout', () => {this.descriptionBox.destroy(true)})
    }

    createDescriptionBox(pointer: Phaser.Input.Pointer, localX, localY, event) {
        this.descriptionBox = this.scene.add.text(pointer.x, pointer.y, "Description", { fontFamily: fontFamily })
    }
  }