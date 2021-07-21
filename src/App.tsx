import { PhaserGame } from "./phaser/phaser";
import React from "react";
import { GoogleLoginResponse } from "react-google-login";
import {
	Button,
	ChakraProvider,
	Divider,
	HStack,
	Spacer,
	TabList,
	TabPanel,
	TabPanels,
	Tabs,
	VStack,
} from "@chakra-ui/react";
import { fontFamily, normalFontSize } from "./utils/constants";
import { SocialSignins } from "./SocialSignins";
import { CustomTab } from "./CustomTab";
import { CustomInput } from "./CustomInput";

interface IState {
	game: PhaserGame;
	isSignedIn: boolean;
	isRegistering: boolean;
	isLoading: boolean;
	email: string;
	username: string;
	password: string;
}

class App extends React.PureComponent<any, IState> {
	constructor(props: any) {
		super(props);
		this.state = {
			game: null,
			isSignedIn: false,
			isRegistering: true,
			isLoading: true,
			email: "",
			username: "",
			password: "",
		};
	}

	componentDidMount() {
		this.setState({
			game: new PhaserGame(this.finishLoading),
			isSignedIn: false,
		});
	}

	componentWillUnmount() {
		this.state.game.destroy(true);
	}

	finishLoading = () => {
		this.setState({
			isLoading: false,
		});
	};

	finishSignIn = () => {
		this.setState({
			isSignedIn: true,
		});
		this.state.game.registry.set("FinishedSignIn", true);
	};

	signInWithPlayFab = () => {
		this.state.game.signInWithPlayFab(this.state.username, this.state.password, this.finishSignIn);
	};

	registerWithPlayFab = () => {
		this.state.game.registerWithPlayFab(
			this.state.email,
			this.state.username,
			this.state.password,
			this.finishSignIn
		);
	};

	onGoogleSuccess = (response: GoogleLoginResponse) => {
		this.state.game.signInWithGoogle(response.accessToken, response.getBasicProfile().getName(), this.finishSignIn);
	};

	onGoogleFailure = (error: any) => {
		console.log("Something went wrong", error);
	};

	onFacebookSignin = response => {
		this.state.game.signInWithFacebook(response.accessToken, response.name, this.finishSignIn);
	};

	render() {
		return (
			<ChakraProvider>
				{this.state.isSignedIn || this.state.isLoading ? null : (
					<HStack
						position="absolute"
						width={500}
						left={0}
						right={0}
						top={320}
						marginLeft="auto"
						marginRight="auto">
						<Tabs isFitted>
							<TabList>
								<CustomTab>Register</CustomTab>
								<CustomTab>Sign In</CustomTab>
							</TabList>

							<TabPanels>
								<TabPanel>
									<VStack>
										<CustomInput
											placeholder="Email"
											handleChange={e => {
												this.setState({ email: e.target.value });
											}}
										/>
										<CustomInput
											placeholder="Username"
											handleChange={e => {
												this.setState({ username: e.target.value });
											}}
										/>
										<CustomInput
											type="password"
											placeholder="Password"
											handleChange={e => {
												this.setState({ password: e.target.value });
											}}
										/>
										<Button
											width={225}
											fontFamily={fontFamily}
											fontSize={normalFontSize}
											onClick={this.registerWithPlayFab}>
											Register
										</Button>
									</VStack>
								</TabPanel>
								<TabPanel>
									<VStack>
										<CustomInput
											placeholder="Username"
											handleChange={e => {
												this.setState({ username: e.target.value });
											}}
										/>
										<CustomInput
											type="password"
											placeholder="Password"
											handleChange={e => {
												this.setState({ password: e.target.value });
											}}
										/>
										<Button
											width={225}
											fontFamily={fontFamily}
											fontSize={normalFontSize}
											onClick={this.signInWithPlayFab}>
											Sign in
										</Button>
									</VStack>
								</TabPanel>
							</TabPanels>
						</Tabs>

						<Spacer />
						<Divider orientation="vertical" />
						<Spacer />
						<SocialSignins
							isSignedIn={this.state.isSignedIn}
							onGoogleSuccess={this.onGoogleSuccess}
							onGoogleFailure={this.onGoogleFailure}
							onFacebookSignin={this.onFacebookSignin}
						/>
					</HStack>
				)}
			</ChakraProvider>
		);
	}
}

export default App;
