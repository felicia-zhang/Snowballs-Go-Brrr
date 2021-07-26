import { PhaserGame } from "./phaser/phaser";
import React from "react";
import { GoogleLoginResponse } from "react-google-login";
import {
	Button,
	ChakraProvider,
	Divider,
	SlideFade,
	HStack,
	Spacer,
	TabList,
	TabPanel,
	TabPanels,
	Tabs,
	VStack,
} from "@chakra-ui/react";
import { fontFamily, normalFontSize } from "./utils/constants";
import { CustomSocialSignins } from "./CustomSocialSignins";
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
	errors: string[];
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
			errors: [],
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

	toggleSignIn = (isSignedIn: boolean, errors?: string[]) => {
		if (errors !== undefined) {
			this.setState({
				errors: errors,
			});
		}
		this.setState({
			isSignedIn: isSignedIn,
		});
		this.state.game.registry.set("IsSignedIn", isSignedIn);
	};

	signInWithPlayFab = () => {
		this.setState({
			errors: [],
		});
		this.state.game.signInWithPlayFab(this.state.username, this.state.password, this.toggleSignIn);
	};

	registerWithPlayFab = () => {
		this.setState({
			errors: [],
		});
		this.state.game.registerWithPlayFab(
			this.state.email,
			this.state.username,
			this.state.password,
			this.toggleSignIn
		);
	};

	onGoogleSuccess = (response: GoogleLoginResponse) => {
		this.state.game.signInWithGoogle(response.accessToken, response.getBasicProfile().getName(), this.toggleSignIn);
	};

	onGoogleFailure = (error: any) => {
		console.log("Something went wrong", error);
	};

	onFacebookSignin = response => {
		this.state.game.signInWithFacebook(response.accessToken, response.name, this.toggleSignIn);
	};

	render() {
		const seen = !this.state.isSignedIn && !this.state.isLoading;
		return (
			<ChakraProvider>
				<SlideFade in={seen} unmountOnExit={true} delay={{ enter: 0.5, exit: 0 }}>
					<HStack
						position="absolute"
						width={500}
						left={0}
						right={0}
						top={320}
						marginLeft="auto"
						marginRight="auto">
						<Tabs isFitted onChange={() => this.setState({ errors: [] })}>
							<TabList>
								<CustomTab cursor={seen ? "pointer" : "default"}>Register</CustomTab>
								<CustomTab cursor={seen ? "pointer" : "default"}>Sign In</CustomTab>
							</TabList>

							<TabPanels>
								<TabPanel>
									<VStack>
										<CustomInput
											errors={this.state.errors}
											seen={seen}
											placeholder="Email"
											handleChange={e => {
												this.setState({ email: e.target.value });
											}}
										/>
										<CustomInput
											errors={this.state.errors}
											seen={seen}
											placeholder="Username"
											handleChange={e => {
												this.setState({ username: e.target.value });
											}}
										/>
										<CustomInput
											errors={this.state.errors}
											seen={seen}
											type="password"
											placeholder="Password"
											handleChange={e => {
												this.setState({ password: e.target.value });
											}}
										/>
										<Button
											cursor={seen ? "pointer" : "default"}
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
											errors={this.state.errors}
											seen={seen}
											placeholder="Username"
											handleChange={e => {
												this.setState({ username: e.target.value });
											}}
										/>
										<CustomInput
											errors={this.state.errors}
											seen={seen}
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
						<CustomSocialSignins
							seen={seen}
							isSignedIn={this.state.isSignedIn}
							onGoogleSuccess={this.onGoogleSuccess}
							onGoogleFailure={this.onGoogleFailure}
							onFacebookSignin={this.onFacebookSignin}
						/>
					</HStack>
				</SlideFade>
			</ChakraProvider>
		);
	}
}

export default App;
