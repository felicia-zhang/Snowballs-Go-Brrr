handlers.addSnowballs = function (args, context) {
	var request = {
		PlayFabId: currentPlayerId,
		VirtualCurrency: "SB",
		Amount: args.amount,
	};
	return server.AddUserVirtualCurrency(request).Balance;
};

handlers.grantIcicleBundle = function (args, context) {
	var result = { consumedItems: [] };

	var grantedItems = server.GrantItemsToUser({
		PlayFabId: currentPlayerId,
		ItemIds: [args.itemId],
	}).ItemGrantResults;
	result.grantedItems = grantedItems;

	grantedItems.forEach(item => {
		var consumedItem = server.ConsumeItem({
			PlayFabId: currentPlayerId,
			ItemInstanceId: item.ItemInstanceId,
			ConsumeCount: 1,
		});
		result.consumedItems.push(consumedItem);
	});

	server.UpdatePlayerStatistics({
		PlayFabId: currentPlayerId,
		Statistics: [
			{
				StatisticName: "usd",
				Value: args.usd,
			},
		],
	});

	return result;
};

handlers.updateInventoryCustomData = function (args, context) {
	var request = {
		ItemInstanceId: args.instanceId,
		PlayFabId: currentPlayerId,
		Data: { BiomeId: args.biomeId },
	};
	server.UpdateUserInventoryItemCustomData(request);
	var result = server.GetUserInventory({ PlayFabId: currentPlayerId });
	return result.Inventory.find(inventory => inventory.ItemInstanceId === args.instanceId);
};

handlers.resetGame = function (args, context) {
	var result = { revokeItemsErrors: [] };

	args.inventoryGroupsToRevoke.forEach(ids => {
		var revokedItems = [];
		ids.forEach(id => revokedItems.push({ PlayFabId: currentPlayerId, ItemInstanceId: id }));
		var errors = server.RevokeInventoryItems({ items: revokedItems }).Errors;
		result.revokeItemsErrors.push(errors);
	});

	server.UpdatePlayerStatistics({
		PlayFabId: currentPlayerId,
		Statistics: [
			{
				StatisticName: "resetBonus",
				Value: args.bonus,
			},
		],
	});

	var updateUserDataResult = server.UpdateUserData({
		PlayFabId: currentPlayerId,
		KeysToRemove: [
			"icebiomeLastUpdated",
			"marinebiomeLastUpdated",
			"savannabiomeLastUpdated",
			"tropicalbiomeLastUpdated",
			"magmabiomeLastUpdated",
		],
	});
	result.updateUserDataResult = updateUserDataResult;

	if (args.snowballsToRevoke > 0) {
		var subtractSBResult = server.SubtractUserVirtualCurrency({
			PlayFabId: currentPlayerId,
			VirtualCurrency: "SB",
			Amount: args.snowballsToRevoke,
		});
		result.subtractSBResult = subtractSBResult;
	} else {
		result.subtractSBResult = args.snowballsToRevoke;
	}

	return result;
};

handlers.grantInitialItemsToUser = function (args, context) {
	var result = server.GrantItemsToUser({
		ItemIds: ["icebiome"],
		PlayFabId: currentPlayerId,
	});
	return result.ItemGrantResults;
};

handlers.updateSnowballStatistics = function (args, context) {
	server.UpdatePlayerStatistics({
		PlayFabId: currentPlayerId,
		Statistics: [
			{
				StatisticName: "snowballs",
				Value: args.amount,
			},
		],
	});
};
