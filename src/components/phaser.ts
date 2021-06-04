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

	grantInitialItemsToNewPlayer() {
		PlayFabClient.ExecuteCloudScript(
			{ FunctionName: "grantInitialItemsToUser", FunctionParameter: {} },
			(error, result) => {
				console.log("Granted initial items to new player");
				const grantedItems: PlayFabServerModels.GrantedItemInstance[] = result.data.FunctionResult;
				grantedItems.forEach(item => {
					PlayFabClient.ExecuteCloudScript(
						{
							FunctionName: "updateItemLevel",
							FunctionParameter: { itemId: item.ItemId, instanceId: item.ItemInstanceId, level: 1 },
						},
						() => {}
					);
				});
			}
		);
	}

	socialSignInCallback(error: PlayFabModule.IPlayFabError, result, name: string) {
		if (result === null) {
			console.log("Failed to sign in", error);
		} else {
			if (result.data.NewlyCreated) {
				PlayFabClient.UpdateUserTitleDisplayName({ DisplayName: name }, () => {
					console.log("Added new player", name);
				});
				this.grantInitialItemsToNewPlayer();
			}
			console.log("Signed in as", result.data.PlayFabId);
		}
	}

	playfabSignInCallback(error: PlayFabModule.IPlayFabError, result, handlePlayFab: (success: boolean) => void) {
		if (result === null) {
			console.log("Failed to sign in", error);
		} else {
			handlePlayFab(true);
			console.log("Signed in as", result.data.PlayFabId);
		}
	}

	signInWithPlayFab(username: string, password: string, handlePlayFab: (success: boolean) => void) {
		PlayFab.settings.titleId = "7343B";
		PlayFabClient.LoginWithPlayFab(
			{
				Username: username,
				Password: password,
			},
			(error, result) => this.playfabSignInCallback(error, result, handlePlayFab)
		);
	}

	registerWithPlayFab(email: string, username: string, password: string, handlePlayFab: (success: boolean) => void) {
		PlayFab.settings.titleId = "7343B";
		PlayFabClient.RegisterPlayFabUser(
			{
				Email: email,
				DisplayName: username,
				Username: username,
				Password: password,
			},
			(error, result) => {
				this.grantInitialItemsToNewPlayer();
				this.playfabSignInCallback(error, result, handlePlayFab);
			}
		);
	}

	signInWithGoogle(accessToken: string, name: string) {
		PlayFab.settings.titleId = "7343B";
		PlayFabClient.LoginWithGoogleAccount(
			{
				AccessToken: accessToken,
				CreateAccount: true,
			} as LoginWithGoogleAccountRequest,
			(error, result) => this.socialSignInCallback(error, result, name)
		);
	}

	signInWithFacebook(accessToken: string, name: string) {
		PlayFab.settings.titleId = "7343B";
		PlayFabClient.LoginWithFacebook(
			{
				AccessToken: accessToken,
				CreateAccount: true,
			},
			(error, result) => this.socialSignInCallback(error, result, name)
		);
	}
}
