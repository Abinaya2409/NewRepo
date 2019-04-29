const walletOperation = require('../models/wallet')
const _ = require('lodash')

async function getWallets(ctx) {
    const accessToken = ctx.request.header.authorization;
    const { userId } = ctx.params;
    try {
        const wallets = await walletOperation.getWallets(userId, accessToken);
        const wallet_details = await Promise.all(wallets.data.data.data.map(async (wallet) => {
                if(wallet.reference != "FIATWALLET"){
                const id = wallet.wallet_id;
                const coin = wallet.coin;
                const walletInformation = await walletOperation.getwallet(id, coin, accessToken);
                const walletData = walletInformation.data.data.data;
                const walletSave = {
                    "balance": walletData.balance,
                    "confirmed_balance": walletData.confirmed_balance,
                    "spendable_balance": walletData.spendable_balance,
                    "balance_string": walletData.balanceString,
                    "confirmedBalance_string": walletData.confirmedBalanceString,
                    "spendableBalance_string": walletData.spendableBalanceString
                }
                const updatedWallet = await walletOperation.updateWallet(walletSave, id);
                return updatedWallet.data.data;
            }else{
                return wallet;
            }
            }));
        ctx.body = {
            "status": 200,
            "data": wallet_details
        }
    }
    catch (error) {
        console.log(error);
    }
}

async function getWallet(ctx) {
    const { walletId, coin } = ctx.params;
    const accessToken = ctx.request.header.authorization;

    const walletDetails = await walletOperation.getwallet(walletId, coin, accessToken);
    const walletData = walletDetails.data.data.data;
    const walletSave = {
        "balance": walletData.balance,
        "confirmed_balance": walletData.confirmed_balance,
        "spendable_balance": walletData.spendable_balance,
        "balance_string": walletData.balanceString,
        "confirmedBalance_string": walletData.confirmedBalanceString,
        "spendableBalance_string": walletData.spendableBalanceString
    }
    const updatedWallet = await walletOperation.updateWallet(walletSave, walletId);
    ctx.body = updatedWallet.data;

}
async function generateDefaultWallets(ctx) {
    const accessToken = ctx.request.header.authorization;
    const { wallets, userId } = ctx.request.body;
    const { tbtc, tbch, teth } = wallets;
    try {
        const btcWallet = await walletOperation.addWallet("tbtc", accessToken, tbtc);
        const bchWallet = await walletOperation.addWallet("tbch", accessToken, tbch);
        const ethwallet = await walletOperation.addWallet("teth", accessToken, teth);
        const btcData = {
            "user_id": userId,
            "wallet_id": btcWallet.data.data.wallet._wallet.id,
            "coin": "tbtc",
            "reference": "CRYPTO WALLET",
            "label": tbtc.label,
            "public_address": btcWallet.data.data.wallet._wallet.receiveAddress.address,
            "confirmed_balance": btcWallet.data.data.wallet._wallet.confirmed_balance,
            "spendable_balance": btcWallet.data.data.wallet._wallet.spendable_balance
        };
        const bchData = {
            "user_id": userId,
            "wallet_id": bchWallet.data.data.wallet._wallet.id,
            "coin": "tbch",
            "reference": "CRYPTO WALLET",
            "label": tbtc.label,
            "public_address": bchWallet.data.data.wallet._wallet.receiveAddress.address,
            "confirmed_balance": bchWallet.data.data.wallet._wallet.confirmed_balance,
            "spendable_balance": bchWallet.data.data.wallet._wallet.spendable_balance
        };
        const ethData = {
            "user_id": userId,
            "wallet_id": ethwallet.data.data.wallet._wallet.id,
            "coin": "teth",
            "reference": "CRYPTO WALLET",
            "label": tbtc.label,
            "confirmed_balance": ethwallet.data.data.wallet._wallet.confirmed_balance,
            "spendable_balance": ethwallet.data.data.wallet._wallet.spendable_balance
        };

        const btcWalletDB = await walletOperation.saveWallet(btcData);
        const bchWalletDB = await walletOperation.saveWallet(bchData);
        const ethWalletDB = await walletOperation.saveWallet(ethData);

        const wallets =
        {
            "btc": btcWallet,
            "bch": bchWallet,
            "eth": ethwallet
        }
        const WalletResponse = {
            status: 200,
            data: wallets,
            message: "Generated Wallets"
        }
        ctx.body = WalletResponse;
    }
    catch (error) {
        console.log(error);
    }
}

async function addWallet(ctx) {
    const accessToken = ctx.request.header.authorization;
    const { coin } = ctx.params;
    const { wallet, userId } = ctx.request.body;
    console.log(coin)
    try {
        const currencies = await walletOperation.getAllDigitalCurriencies();
        const digitalcurrencies = currencies.data.data.map(currency => {
            console.log(currency)
            var findcurrency = _.find(currency, { "currency_code": coin })
            console.log(findcurrency)
            return findcurrency
        })
        if (!_.isNull(digitalcurrencies)) {
            const addWallet = await walletOperation.addWallet(coin, accessToken, wallet);
            const data = {
                "user_id": userId,
                "wallet_id": addWallet.data.data.wallet._wallet.id,
                "coin": coin,
                "label": wallet.label,
                "public_address": addWallet.data.data.wallet._wallet.receiveAddress.address,
                "confirmed_balance": addWallet.data.data.wallet._wallet.confirmed_balance,
                "spendable_balance": addWallet.data.data.wallet._wallet.spendable_balance
            };
            const db = await walletOperation.saveWallet(data);
            const WalletResponse = {
                status: 200,
                data: addWallet,
                message: "Created wallet"
            }
            ctx.body = WalletResponse;
        }
    }
    catch (error) {
        const err = {
            'error': {
                status: 401,
                message: "Couldn't find coin"
            }
        }
        ctx.body = err;
    }
}

module.exports = { getWallets, addWallet, generateDefaultWallets, getWallet }
