export async function initializeCurrencyConverter() {
  const VITE_EXCHANGE_RATE_API_KEY = "fca_live_hOYelks0UiDKvpzQX1Vo2dtcjCRN00wfHmXlRNgw";
  const priceBadges = document.querySelectorAll('.price-badge')

async function getCurrencyData() {
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) {
      throw new Error(`IP API request failed with status ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching user currency:', error);
    return null;
  }
}

async function getExchangeRates(userCurrency) {
  try {
    const response = await fetch(`https://api.freecurrencyapi.com/v1/latest?apikey=${VITE_EXCHANGE_RATE_API_KEY}&base_currency=USD`);
    if (!response.ok) {
      throw new Error(`Exchange rate API request failed with status ${response.status}`);
    }
    const data = await response.json();
    const rate = data.data[userCurrency];
    if (!rate) {
      throw new Error(`Exchange rate not available for currency: ${userCurrency}`);
    }
    return rate;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return null;
  }
}

function updatePrice(badge, userCurrency, exchangeRate) {
  const priceUSD = parseFloat(badge.getAttribute('data-price-usd'));
  if (!priceUSD) return;

  const originalPriceText = badge.innerHTML;

  try {
    const convertedPrice = (priceUSD * exchangeRate).toFixed(0);
    badge.innerHTML = `Limited Offer <b>${userCurrency} ${convertedPrice}</b>`;

    const schemaId = badge.getAttribute('data-schema-id');
    if (schemaId) {
      const schemaElement = document.getElementById(schemaId);
      if (schemaElement) {
        const schema = JSON.parse(schemaElement.textContent);
        schema.priceCurrency = userCurrency;
        schema.price = convertedPrice;
        schemaElement.textContent = JSON.stringify(schema, null, 2);
      } else {
        console.warn(`Schema element with ID "${schemaId}" not found.`);
      }
    }
  } catch (error) {
    console.error('Error updating price:', error);
    // Fallback to original price if conversion fails
    badge.innerHTML = originalPriceText;
  }
}

export async function initializeCurrencyConverter() {
  const priceBadges = document.querySelectorAll('.price-badge[data-price-usd]');
  if (priceBadges.length === 0) {
    return;
  }

  const currencyData = await getCurrencyData();
  if (!currencyData || !currencyData.currency || currencyData.currency === 'USD') {
    console.log('User currency is USD or could not be determined. Skipping conversion.');
    return;
  }

  const userCurrency = currencyData.currency;
  const exchangeRate = await getExchangeRates(userCurrency);

  if (exchangeRate) {
    priceBadges.forEach(badge => {
      updatePrice(badge, userCurrency, exchangeRate);
    });
  } else {
    console.log('Could not retrieve exchange rate. Prices will remain in USD.');
  }
}
