export default interface ItemDetail {
	ItemId: string;
	FullPrice: number;
	DisplayName: string;
	Description: string;
	Instances: { [key: string]: PlayFabClientModels.ItemInstance };
}

export default interface LandDetail {
	ItemId: string;
	FullSnowballPrice: number;
	FullIciclePrice: number;
	DisplayName: string;
}
