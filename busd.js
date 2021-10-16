
var Web3 = require('web3');
var proccess = require('process');
var web3 = new Web3('http://localhost:8545')
var Paired = {
    BUSD : "0xe9e7cea3dedca5984780bafc599bd69add087d56",
    WBNB : "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
    USDT : "0x55d398326f99059ff775485246999027b3197955",
    CAKE : "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82"
}

    var params = process.argv.slice(2);
    var args = {};
    for (var i = 0, len = params.length; i < len; i+=1) {
        var key_value = params[i].split('=');
        var key = key_value[0].replace('--','');
        args[key] = key_value[1];
    }

    if(!args.buy) exit('--buy not defined try use --buy="0x000000000')
    else if(!args.with) exit('--with not defined try use --with="BUSD"');
    else if(!args.amount) exit('--amount not defined try use --amount=100');
    else if(!args.slippage) exit('--slippage not defined try use --slippage=20');

    function exit(data)
    {
        console.log(data);
        return proccess.exit(1);
    }


/**EDITE CONFIGURATION */
var setPaired = Paired[args.with]; // Change Pair -> USDT
var tokenToBuy = args.buy; // Token Sniper
var buyingAmount = web3.utils.toWei(args.amount, 'ether'); //100 -> 100BUSD
var OurPK = "";
var slippage = args.slippage;
/**
 * Main Configuration
 */

var PancakeRouter = "0x10ed43c718714eb63d5aa57b78b54704e256024e";
var pancakeContractABI = require('./contract.json');
var pairedPath = [setPaired,tokenToBuy];

async function SubmitTx(txData){
    
    const account = await web3.eth.accounts.privateKeyToAccount(OurPK)
    var txNonce =  web3.eth.getTransactionCount(account.address, "pending");
    const tx = {
        from: account.address,
        to: PancakeRouter,
        gas:  web3.utils.numberToHex(500000),
        gasPrice:  web3.utils.numberToHex(12000000000),
        value: 0,
        nonce : txNonce,
        data: txData,   
        };

     web3.eth.accounts.signTransaction(tx, account.privateKey)
        .then(tx => {
            var rawTx = tx.rawTransaction;
            web3.eth.sendSignedTransaction(rawTx).on('transactionHash', console.log);
        });
}


async function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time))
}

(async function () {

    // Inisialisasi Web3 Akun

        const account = await web3.eth.accounts.privateKeyToAccount(OurPK)
        
        var pancakeContract = new web3.eth.Contract(pancakeContractABI, PancakeRouter);
    while(true){

        try {
        await pancakeContract.methods.getAmountsOut(buyingAmount, pairedPath).call({}, async function(amountsOutError, amountsOutResult)   {
            if( !amountsOutError ){
                var amountOut = amountsOutResult[1];
                amountOut = amountOut - (amountOut * slippage / 100);
                amountOut = BigInt(Math.round(amountOut));
                amountOut = amountOut.toString();
                var deadline = Math.floor(Date.now() / 1000) + 60 * 1; // 20 mins time

                var SwapData =  pancakeContract.methods.swapExactTokensForTokensSupportingFeeOnTransferTokens(
                    buyingAmount,
                    amountOut, 
                    pairedPath,
                    account.address,
                    deadline
                ).encodeABI();

                await SubmitTx(SwapData);
                

            }
       

        })
        break;
    }catch(err){
        console.log("Liquidity Not Found");
    }

    await sleep(30);

}


    
        
})()
