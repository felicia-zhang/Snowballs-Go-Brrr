export default interface ItemDetail {
	ItemId: string;
	Price: number;
	DisplayName: string;
	Description: string;
	Instances: { [key: string]: PlayFabClientModels.ItemInstance };
}

export default interface LandDetail {
	ItemId: string;
	SnowballPrice: number;
	IciclePrice: number;
	DisplayName: string;
}
