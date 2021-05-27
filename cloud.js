handlers.addUserVirtualCurrency = function (args, context) {
    var amount = args.amount;
    var virtualCurrency = args.virtualCurrency;
    var request = {
        PlayFabId: currentPlayerId, 
        VirtualCurrency: virtualCurrency,
        Amount: amount
    };
    server.AddUserVirtualCurrency(request);
    return;
};

handlers.syncInventoryToCatalog = function (args, context) {
    var catalogItems = server.GetCatalogItems({CatalogVersion: 1}).Catalog
    var itemInstances = server.GetUserInventory({PlayFabId: currentPlayerId}).Inventory
    var itemIdToInstanceIds = {}
    itemInstances.forEach((instance) => {
        itemIdToInstanceIds[instance.ItemId] = itemIdToInstanceIds[instance.ItemId] || []
        itemIdToInstanceIds[instance.ItemId].push(instance.ItemInstanceId)
    })

    catalogItems.forEach((item) => {
        if (item.ItemId in itemIdToInstanceIds) {
            itemIdToInstanceIds[item.ItemId].forEach((instanceId) => {
                var request = {
                    ItemInstanceId: instanceId,
                    PlayFabId: currentPlayerId,
                    Data: {"Description": item.Description, "ImageData": item.CustomData}
                }
                server.UpdateUserInventoryItemCustomData(request);
            })
        }
    })
    return;
};

handlers.completeLevel = function (args, context) {
    server.UpdateUserInternalData({
        PlayFabId: currentPlayerId,
        Data: {
            lastLevelCompleted: args.level
        }
    });
};

handlers.updateStatistics = function (args, context) {
    server.UpdatePlayerStatistics({
        PlayFabId: currentPlayerId, 
        Statistics: [{
                StatisticName: "level_clicks",
                Value: args.clicks
            }]
    });
};
