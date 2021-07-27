import { lightRed, lightBlue, textStyle, toastDepth } from "./constants";
import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";
import { wrapStringLong } from "./stringFormat";

export const showToast = (scene: Phaser.Scene, message: string, isError: boolean) => {
	const toastBackground = scene.add
		.existing(new RoundRectangle(scene, 400, 20, 0, 0, 10, lightBlue))
		.setAlpha(0)
		.setDepth(toastDepth);
	const toastText = scene.add
		.text(400, 20, wrapStringLong(message), textStyle)
		.setAlpha(0)
		.setDepth(toastDepth)
		.setAlign("center")
		.setOrigin(0.5, 0);
	toastBackground.setSize(toastText.width + 20, toastText.height + 20);
	toastBackground.y = (toastText.height + 40) / 2;
	if (isError) {
		toastBackground.setFillStyle(lightRed);
	} else {
		toastBackground.setFillStyle(lightBlue);
	}

	scene.add.tween({
		targets: [toastBackground, toastText],
		ease: "Sine.easeIn",
		duration: 500,
		alpha: 1,
		completeDelay: 2000,
		onComplete: (tween, targets) => {
			scene.add.tween({
				targets: targets,
				ease: "Sine.easeIn",
				duration: 300,
				alpha: 0,
				onComplete: (tween, targets) => {
					toastText.destroy(true);
					toastBackground.destroy(true);
				},
			});
		},
	});
};
