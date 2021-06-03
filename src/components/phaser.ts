import Phaser from "phaser";
import Controller from "./controller";
import * as PlayFab from "playfab-sdk/Scripts/PlayFab/PlayFabClient.js";
import { PlayFabClient } from "playfab-sdk";
import InputTextPlugin from "phaser3-rex-plugins/plugins/inputtext-plugin.js";

const config = {
	type: Phaser.AUTO,
	width: 800,
	height: 600,
	parent: "phaser-container",
	dom: {
		createContainer: true,
	},
	plugins: {
		global: [
			{
				key: "rexInputText",
				plugin: InputTextPlugin,
				start: true,
			},
		],
	},
};

interface LoginWithGoogleAccountRequest extends PlayFabClientModels.LoginWithGoogleAccountRequest {
	AccessToken: string;
}

export class PhaserGame extends Phaser.Game {
	constructor() {
		super(config);
		this.scene.add("Controller", new Controller());
		this.scene.start("Controller");
	}

	googleSignin(accessToken: string) {
		PlayFab.settings.titleId = "7343B";
		PlayFabClient.LoginWithGoogleAccount(
			{
				AccessToken: accessToken,
				CreateAccount: true,
			} as LoginWithGoogleAccountRequest,
			(error, result) => {
				console.log("Signed in as", result.data.PlayFabId);
			}
		);
	}

	facebookSignin(accessToken: string) {
		PlayFab.settings.titleId = "7343B";
		PlayFabClient.LoginWithFacebook(
			{
				AccessToken: accessToken,
				CreateAccount: true,
			},
			(error, result) => {
				console.log("Signed in as", result.data.PlayFabId);
			}
		);
	}
}
