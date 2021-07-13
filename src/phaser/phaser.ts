import Phaser from "phaser";
import Controller from "./controller";
import * as PlayFab from "playfab-sdk/Scripts/PlayFab/PlayFabClient.js";
import { PlayFabClient } from "playfab-sdk";
import InputTextPlugin from "phaser3-rex-plugins/plugins/inputtext-plugin.js";
import SigninScene from "./signin";

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

interface LoginRequest extends PlayFabClientModels.LoginWithGoogleAccountRequest {
	AccessToken: string;
}

export class PhaserGame extends Phaser.Game {
	constructor() {
		super(config);
		this.scene.add("Controller", new Controller());
		this.scene.start("Controller");
	}

	grantInitialItemToNewPlayer(finishSignIn: () => void) {
		PlayFabClient.ExecuteCloudScript(
			{ FunctionName: "grantInitialItemsToUser", FunctionParameter: {} },
			(error, result) => {
				console.log("Granted initial items to new player", result.data.FunctionResult);
				finishSignIn();
			}
		);
	}

	socialSignInCallback(error: PlayFabModule.IPlayFabError, result, name: string, finishSignIn: () => void) {
		if (result === null) {
			console.log("Failed to sign in", error);
		} else {
			if (result.data.NewlyCreated) {
				PlayFabClient.UpdateUserTitleDisplayName({ DisplayName: name }, () => {
					console.log("Added new player", name);
				});
				this.grantInitialItemToNewPlayer(finishSignIn);
			} else {
				finishSignIn();
			}
			console.log("Signed in as", result.data.PlayFabId);
		}
	}

	playfabSignInCallback(error: PlayFabModule.IPlayFabError, result, finishSignIn: () => void) {
		if (result === null) {
			if (this.scene.isActive("Signin")) {
				const scene = this.scene.getScene("Signin") as SigninScene;
				const errorMessage = error.errorDetails ? Object.values(error.errorDetails)[0] : error.errorMessage;
				scene.showToast(`${errorMessage}`, true);
			}
		} else {
			finishSignIn();
			console.log(`Signed in as ${result.data.PlayFabId}`);
		}
	}

	playfabRegisterCallback(error: PlayFabModule.IPlayFabError, result, finishSignIn: () => void) {
		if (result === null) {
			console.log(error);
			if (this.scene.isActive("Signin")) {
				const scene = this.scene.getScene("Signin") as SigninScene;
				const errorMessage = error.errorDetails ? Object.values(error.errorDetails)[0] : error.errorMessage;
				scene.showToast(`${errorMessage}`, true);
			}
		} else {
			console.log(`Registered as ${result.data.PlayFabId}`);
			this.grantInitialItemToNewPlayer(finishSignIn);
		}
	}

	signInWithPlayFab(username: string, password: string, finishSignIn: () => void) {
		PlayFab.settings.titleId = "7343B";
		PlayFabClient.LoginWithPlayFab(
			{
				Username: username,
				Password: password,
			},
			(error, result) => this.playfabSignInCallback(error, result, finishSignIn)
		);
	}

	registerWithPlayFab(email: string, username: string, password: string, finishSignIn: () => void) {
		PlayFab.settings.titleId = "7343B";
		PlayFabClient.RegisterPlayFabUser(
			{
				Email: email,
				DisplayName: username,
				Username: username,
				Password: password,
			},
			(error, result) => {
				this.playfabRegisterCallback(error, result, finishSignIn);
			}
		);
	}

	signInWithGoogle(accessToken: string, name: string, finishSignIn: () => void) {
		PlayFab.settings.titleId = "7343B";
		PlayFabClient.LoginWithGoogleAccount(
			{
				AccessToken: accessToken,
				CreateAccount: true,
			} as LoginRequest,
			(error, result) => this.socialSignInCallback(error, result, name, finishSignIn)
		);
	}

	signInWithFacebook(accessToken: string, name: string, finishSignIn: () => void) {
		PlayFab.settings.titleId = "7343B";
		PlayFabClient.LoginWithFacebook(
			{
				AccessToken: accessToken,
				CreateAccount: true,
			},
			(error, result) => this.socialSignInCallback(error, result, name, finishSignIn)
		);
	}
}
