interface ItemDetail {
	ItemId: string;
	DisplayName: string;
	Description: string;
	Instances: { [key: string]: PlayFabClientModels.ItemInstance };
}

interface BiomeDetail {
	ItemId: string;
	FullSnowballPrice: number;
	FullIciclePrice: number;
	DisplayName: string;
	Description: string;
}

interface BundleDetail {
	ItemId: string;
	DisplayName: string;
	Icicles: number;
}

interface ItemCounter {
	Mittens: number;
	Bonfire: number;
	Snowman: number;
	"Igloo Factory": number;
	"Arctic Vault": number;
}

export type { ItemDetail, BiomeDetail, BundleDetail, ItemCounter };
