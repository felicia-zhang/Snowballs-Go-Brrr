import * as PlayFab from  "playfab-sdk/Scripts/PlayFab/PlayFabClient.js";
import { PlayFabClient } from 'playfab-sdk';
import LeaderboardScene from './leaderboard'
import GameScene from './game'
import StoreScene from './store'
import sky from "../assets/sky.png";
import fire from "../assets/fire.png";

class Controller extends Phaser.Scene {
    constructor() {
        super('Controller');
    }

    preload() {
        this.load.image('sky', sky);
        this.load.image('fire', fire, { frameWidth: 355, frameHeight: 450 } as any);
    }

    create() {
        const controller = this;
        PlayFab.settings.titleId = '7343B';
        const loginRequest = {
            TitleId: PlayFab.settings.titleId,
            CustomId: 'GettingStartedGuide',
            CreateAccount: true
        };

        const LoginCallback: PlayFabModule.ApiCallback<PlayFabClientModels.LoginResult> = (error, result) => {
            const playfabId = result.data.PlayFabId
            console.log(`Logged in! PlayFabId: ${playfabId}`)

            PlayFabClient.ExecuteCloudScript({ FunctionName: 'syncInventoryToCatalog', FunctionParameter: {} }, (r, e) => {
                controller.scene.add('Leaderboard', LeaderboardScene);
                controller.scene.add('Store', StoreScene);
                controller.scene.add('Scene', GameScene);

                controller.scene.start('Store');
            })
        }

        PlayFabClient.LoginWithCustomID(loginRequest, LoginCallback);
    }
}

export default Controller