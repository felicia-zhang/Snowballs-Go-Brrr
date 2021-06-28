interface ItemDetail {
	ItemId: string;
	FullPrice: number;
	DisplayName: string;
	Description: string;
	Instances: { [key: string]: PlayFabClientModels.ItemInstance };
}

interface BiomeDetail {
	ItemId: string;
	FullSnowballPrice: number;
	FullIciclePrice: number;
	DisplayName: string;
}

interface ItemCounter {
	Mittens: number;
	Bonfire: number;
	Snowman: number;
	"Igloo Factory": number;
	"Arctic Vault": number;
}

export type { ItemDetail, BiomeDetail, ItemCounter };
