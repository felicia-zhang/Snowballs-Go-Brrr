interface ItemDetail {
	ItemId: "mittens" | "bonfire" | "snowman" | "igloo" | "vault";
	DisplayName: string;
	Description: string;
	Instances: { [key: string]: PlayFabClientModels.ItemInstance };
}

interface BiomeDetail {
	ItemId: "icebiome" | "marinebiome" | "savannabiome" | "tropicalbiome" | "magmabiome";
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
	mittens: number;
	bonfire: number;
	snowman: number;
	igloo: number;
	vault: number;
}

export type { ItemDetail, BiomeDetail, BundleDetail, ItemCounter };
