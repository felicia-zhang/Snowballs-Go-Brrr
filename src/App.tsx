import { PhaserGame } from "./components/phaser";
import React, { useEffect, useState } from "react";
import GoogleLogin, { GoogleLoginResponse, useGoogleLogin } from "react-google-login";
import FacebookLogin from "react-facebook-login/dist/facebook-login-render-props";
import { Button, ChakraProvider, VStack } from "@chakra-ui/react";
import { FaFacebook, FaGoogle } from "react-icons/fa";

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

	const { signIn: signInToGoogle, loaded } = useGoogleLogin({
		clientId: "168518881059-39uvi2d24ev5rjscb6go5q4cljni1tgd.apps.googleusercontent.com",
		cookiePolicy: "single_host_origin",
		isSignedIn: isSignedIn,
		onSuccess: onGoogleSuccess,
		onFailure: onGoogleFailure,
	});

	return (
		<ChakraProvider>
			<div style={{ position: "absolute", left: "300px", top: "400px" }}>
				{isSignedIn ? null : (
					<VStack>
						<Button colorScheme="red" onClick={signInToGoogle} leftIcon={<FaGoogle />}>
							Sign in with Google
						</Button>
						<FacebookLogin
							appId="533322048080315"
							autoLoad={true}
							render={renderProps => (
								<Button colorScheme="facebook" onClick={renderProps.onClick} leftIcon={<FaFacebook />}>
									Sign in with Facebook
								</Button>
							)}
							callback={onFacebookSignin}
						/>
					</VStack>
				)}
			</div>
		</ChakraProvider>
	);
};

export default App;
