import express from "express";
import fetch from "node-fetch";
import { Connection, PublicKey } from "@solana/web3.js";

const app = express();
const port = process.env.PORT || 3000;

const BTC_ADDRESS = "PUT_BTC_ADDRESS";
const SOL_ADDRESS = "PUT_SOL_ADDRESS";

const ETF_SHARES = 100000;

const connection = new Connection("https://api.mainnet-beta.solana.com");

async function getBTCBalance() {

const res = await fetch(`https://blockstream.info/api/address/${BTC_ADDRESS}`);
const data = await res.json();

const funded = data.chain_stats.funded_txo_sum;
const spent = data.chain_stats.spent_txo_sum;

return (funded - spent) / 1e8;

}

async function getSOLBalance(){

const pubkey = new PublicKey(SOL_ADDRESS);

const balance = await connection.getBalance(pubkey);

return balance / 1e9;

}

async function getPrices(){

const res = await fetch(
"https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,solana&vs_currencies=usd"
);

const data = await res.json();

return {

btc: data.bitcoin.usd,
sol: data.solana.usd

};

}

app.get("/api/dashboard", async (req,res)=>{

const btc = await getBTCBalance();
const sol = await getSOLBalance();

const prices = await getPrices();

const btcValue = btc * prices.btc;
const solValue = sol * prices.sol;

const totalValue = btcValue + solValue;

const nav = totalValue / ETF_SHARES;

res.json({

btc,
sol,
btcValue,
solValue,
totalValue,
nav,
shares:ETF_SHARES

});

});

app.use(express.static("public"));

app.listen(port, ()=>{

console.log("server running");

});
