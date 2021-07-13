import AScene from "./AScene";

class SigninScene extends AScene {
	constructor() {
		super("Signin");
	}

	create() {
		this.add.image(400, 300, "sky").setScrollFactor(0);

		this.createAligned(this, "mountain3", 0.2);
		this.createAligned(this, "mountain2", 0.5);
		this.createAligned(this, "mountain1", 1);
	}

	createAligned(scene: AScene, texture: string, scrollFactor: number) {
		const count = 10 * scrollFactor;

		let x = 0;
		for (let i = 0; i < count; ++i) {
			const image = scene.add.image(x, 600, texture).setOrigin(0, 1).setScrollFactor(scrollFactor);
			x += image.width;
		}
	}

	update() {
		this.cameras.main.scrollX += 0.25;

		if (this.registry.has("FinishedSignIn")) {
			this.scene.start("Menu");
		}
	}
}

export default SigninScene;
