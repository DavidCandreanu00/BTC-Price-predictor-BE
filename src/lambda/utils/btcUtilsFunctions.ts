import axios from "axios";

export async function fetchBTCPrice() {
    const btcPriceResponse = await axios.get('https://min-api.cryptocompare.com/data/generateAvg?fsym=BTC&tsym=USD&e=coinbase');

    console.log(btcPriceResponse.data)
    return parseFloat(btcPriceResponse.data?.RAW.PRICE);
}
