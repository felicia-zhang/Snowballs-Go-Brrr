import { PhaserGame } from "./components/phaser";
import React, { useEffect, useState } from "react";
import GoogleLogin, { GoogleLoginResponse } from "react-google-login";
import FacebookLogin from "react-facebook-login";

const App: React.FC = () => {
	const [game, setGame] = useState<PhaserGame>();
	const [isSignedIn, signIn] = useState(false);

	useEffect(() => {
		setGame(new PhaserGame());
		return () => {
			game.destroy(true);
		};
	}, []);

	const onGoogleSuccess = (response: GoogleLoginResponse) => {
		signIn(true);
		game.googleSignin(response.accessToken, response.getBasicProfile().getName());
	};

	const onGoogleFailure = (error: any) => {
		console.log("Something went wrong", error);
	};

	const onFacebookSignin = response => {
		signIn(true);
		game.facebookSignin(response.accessToken, response.name);
	};

	return (
		<div style={{ position: "absolute", left: "300px", top: "400px" }}>
			{isSignedIn ? null : (
				<>
					<GoogleLogin
						clientId="168518881059-39uvi2d24ev5rjscb6go5q4cljni1tgd.apps.googleusercontent.com"
						buttonText="Sign in with Google"
						onSuccess={onGoogleSuccess}
						onFailure={onGoogleFailure}
						cookiePolicy={"single_host_origin"}
						isSignedIn={isSignedIn}
					/>
					<FacebookLogin
						appId="533322048080315"
						autoLoad={true}
						fields="name,email,picture"
						callback={onFacebookSignin}
					/>
				</>
			)}
		</div>
	);
};

export default App;
