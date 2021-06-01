import { PlayFabClient } from 'playfab-sdk';
import { fontFamily } from '../utils/font'
import InputText from 'phaser3-rex-plugins/plugins/inputtext.js';
import * as PlayFab from "playfab-sdk/Scripts/PlayFab/PlayFabClient.js";

class LoginScene extends Phaser.Scene {
    playerName: string
    constructor() {
        super('Login');
    }

    create() {
        this.add.image(400, 300, 'sky');
        var inputText = new InputText(this, 400, 300, 100, 20, {
            type: 'textarea',
            text: 'hello world',
            fontFamily: fontFamily
        }).on('textchange', function (inputText) {
            this.playerName = inputText.text
        });
        this.add.existing(inputText);


        const login = this;
        PlayFab.settings.titleId = '7343B';

        const LoginCallback = (error, result) => {
            const playfabId = result.data.PlayFabId
            console.log(`Logged in! PlayFabId: ${playfabId}`)

            PlayFabClient.ExecuteCloudScript({ FunctionName: 'syncInventoryToCatalog', FunctionParameter: {} }, (r, e) => {
                login.scene.start('Game');
            })
        }

        const loginButton = this.add.text(700, 400, "login", { fontFamily: fontFamily });
        loginButton.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
            this.playerName = inputText.text
            const loginRequest = {
                TitleId: PlayFab.settings.titleId,
                CustomId: this.playerName,
                CreateAccount: true
            };
            PlayFabClient.LoginWithCustomID(loginRequest, LoginCallback);
        })
    }
}

export default LoginScene;