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
