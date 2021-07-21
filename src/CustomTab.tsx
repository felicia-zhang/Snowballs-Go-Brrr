import { chakra, useStyles, useTab, Text } from "@chakra-ui/react";
import { fontFamily, largeFontSize } from "./utils/constants";

const StyledTab = chakra("button", { themeKey: "Tabs.Tab" } as {});

export const CustomTab = props => {
	const tabProps = useTab(props);
	const styles = useStyles();

	return (
		<StyledTab __css={styles.tab} {...tabProps}>
			<Text fontFamily={fontFamily} fontSize={largeFontSize} color="white">
				{tabProps.children}
			</Text>
		</StyledTab>
	);
};
