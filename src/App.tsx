import { PhaserGame } from "./components/phaser";
import React, { useEffect, useState } from "react";
import GoogleLogin, { GoogleLoginResponse } from "react-google-login";

const App: React.FC = () => {
	const [game, setGame] = useState<PhaserGame>();
	const [isGoogleSignedIn, setGoogleSignedIn] = useState(false);

	useEffect(() => {
		setGame(new PhaserGame());
		return () => {
			game.destroy(true);
		};
	}, []);

	const onGoogleSuccess = (response: GoogleLoginResponse) => {
		setGoogleSignedIn(true);
		game.signIn(response.accessToken);
	};

	const onGoogleFailure = (error: any) => {
		console.log("Something went wrong", error);
	};

	return (
		<div style={{ position: "absolute", left: "300px", top: "400px" }}>
			{isGoogleSignedIn ? null : (
				<GoogleLogin
					clientId="168518881059-39uvi2d24ev5rjscb6go5q4cljni1tgd.apps.googleusercontent.com"
					buttonText="Sign in with Google"
					onSuccess={onGoogleSuccess}
					onFailure={onGoogleFailure}
					cookiePolicy={"single_host_origin"}
					isSignedIn={isGoogleSignedIn}
				/>
			)}
		</div>
	);
};

export default App;
