import express from "express";
import fetch from "node-fetch";
import { Connection, PublicKey } from "@solana/web3.js";

const app = express();
const port = process.env.PORT || 3000;

/* WALLET ADDRESSES (можешь заменить позже) */

const BTC_ADDRESS =
"bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";

const SOL_ADDRESS =
"Vote111111111111111111111111111111111111111";

/* ETF PARAMETERS */

const ETF_SHARES = 100000;

/* SOLANA CONNECTION */

const connection =
new Connection("https://api.mainnet-beta.solana.com");

/* HISTORY STORAGE */

let history = [];

/* BTC BALANCE */

async function getBTCBalance(){

 const res =
 await fetch(
  `https://blockstream.info/api/address/${BTC_ADDRESS}`
 );

 const data = await res.json();

 const funded =
 data.chain_stats.funded_txo_sum;

 const spent =
 data.chain_stats.spent_txo_sum;

 return (funded - spent) / 1e8;

}

/* SOL BALANCE */

async function getSOLBalance(){

 const pubkey =
 new PublicKey(SOL_ADDRESS);

 const balance =
 await connection.getBalance(pubkey);

 return balance / 1e9;

}

/* PRICES */

async function getPrices(){

 const res =
 await fetch(
 "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,solana&vs_currencies=usd"
 );

 const data = await res.json();

 return {
  btc:data.bitcoin.usd,
  sol:data.solana.usd
 };

}

/* DASHBOARD API */

app.get("/api/dashboard", async (req,res)=>{

 try{

  const btc =
  await getBTCBalance();

  const sol =
  await getSOLBalance();

  const prices =
  await getPrices();

  const btcValue =
  btc * prices.btc;

  const solValue =
  sol * prices.sol;

  const totalValue =
  btcValue + solValue;

  const nav =
  totalValue / ETF_SHARES;

  const coverage =
  totalValue / (nav * ETF_SHARES);

  const stakingYield = 0.07;

  const stakedSOL = sol * 0.8;

  history.push({
   time:Date.now(),
   aum:totalValue
  });

  if(history.length > 60){
   history.shift();
  }

  res.json({

   reserves:{
    btc,
    sol
   },

   prices,

   valuation:{
    btcValue,
    solValue,
    totalValue
   },

   fund:{
    shares:ETF_SHARES,
    nav,
    coverage
   },

   staking:{
    stakedSOL,
    yield:stakingYield
   },

   custody:{
    btcAddress:BTC_ADDRESS,
    solAddress:SOL_ADDRESS
   },

   history,

   updated:new Date()

  });

 }catch(e){

  res.status(500).json({
   error:e.message
  });

 }

});

/* STATIC SITE */

app.use(express.static("public"));

app.listen(port,()=>{

 console.log("server running");

});
