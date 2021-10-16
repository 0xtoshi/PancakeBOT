
var Web3 = require('web3');
var web3 = new Web3('http://localhost:7005/')
var Paired = {
    BUSD : "0xe9e7cea3dedca5984780bafc599bd69add087d56",
    WBNB : "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
    USDT : "0x55d398326f99059ff775485246999027b3197955",
    CAKE : "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82"
}



/**EDITE CONFIGURATION */
var setPaired = Paired.USDT; // Change Pair -> USDT
var tokenToBuy = "0xcb2b25e783a414f0d20a65afa741c51b1ad84c49"; // Token Sniper
var buyingAmount = web3.utils.toWei('150', 'ether'); //100 -> 100BUSD
var OurPK = "";
var slippage = 20;
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
                var deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 mins time


                var SwapData =  pancakeContract.methods.swapExactTokensForTokens(
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

}


    
        
})()
