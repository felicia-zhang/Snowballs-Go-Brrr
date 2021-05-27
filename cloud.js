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
    var catalogItems = server.GetCatalogItems({CatalogVersion: 1})
    catalogItems.forEach((item) => {
        var request = {
            ItemInstanceId: item,
            PlayFabId: currentPlayerId,
            Data: {"Description": item.Description, "CustomData": item.CustomData}
        }
        server.UpdateUserInventoryItemCustomData(request);
    })
    return;
};
