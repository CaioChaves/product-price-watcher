"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanPrice = cleanPrice;
exports.detectCurrency = detectCurrency;
exports.convertToEur = convertToEur;
exports.scrapeProductPrice = scrapeProductPrice;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const EXCHANGE_RATES = {
    EUR: 1.00,
    USD: 0.92,
    GBP: 1.17,
    CHF: 1.04,
    JPY: 0.0059
};
// Standard User-Agent to mimic a desktop browser
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
/**
 * Clean string and convert to numeric price
 */
function cleanPrice(priceStr) {
    // Remove spaces, currency symbols and keep digits, dots, and commas
    const cleaned = priceStr.replace(/[^0-9.,]/g, '').trim();
    if (!cleaned)
        return 0;
    // Handle European formatting e.g., 1.234,56 or 45,99
    const commaIndex = cleaned.lastIndexOf(',');
    const dotIndex = cleaned.lastIndexOf('.');
    if (commaIndex > dotIndex) {
        // Comma is the decimal separator. Remove dots (thousand separators) and replace comma with dot
        const standard = cleaned.replace(/\./g, '').replace(/,/g, '.');
        return parseFloat(standard) || 0;
    }
    else if (dotIndex > commaIndex) {
        // Dot is the decimal separator. Remove commas
        const standard = cleaned.replace(/,/g, '');
        return parseFloat(standard) || 0;
    }
    else {
        // No separators or just one type, parse it directly
        return parseFloat(cleaned) || 0;
    }
}
/**
 * Detect currency from string
 */
function detectCurrency(str) {
    const upper = str.toUpperCase();
    if (upper.includes('$') || upper.includes('USD'))
        return 'USD';
    if (upper.includes('£') || upper.includes('GBP'))
        return 'GBP';
    if (upper.includes('CHF'))
        return 'CHF';
    if (upper.includes('¥') || upper.includes('JPY'))
        return 'JPY';
    return 'EUR'; // Default fallback
}
/**
 * Currency converter helper to Euros
 */
function convertToEur(price, currency) {
    const rate = EXCHANGE_RATES[currency.toUpperCase()] || 1.00;
    return parseFloat((price * rate).toFixed(2));
}
/**
 * Extract JSON-LD product data
 */
function extractJsonLd(html) {
    const $ = cheerio.load(html);
    let result = null;
    $('script[type="application/ld+json"]').each((_, elem) => {
        try {
            const text = $(elem).text().trim();
            if (!text)
                return;
            const json = JSON.parse(text);
            const findProduct = (obj) => {
                if (!obj || typeof obj !== 'object')
                    return null;
                if (obj['@type'] === 'Product')
                    return obj;
                if (Array.isArray(obj)) {
                    for (const item of obj) {
                        const res = findProduct(item);
                        if (res)
                            return res;
                    }
                }
                if (obj['@graph'] && Array.isArray(obj['@graph'])) {
                    for (const item of obj['@graph']) {
                        const res = findProduct(item);
                        if (res)
                            return res;
                    }
                }
                for (const key in obj) {
                    const res = findProduct(obj[key]);
                    if (res)
                        return res;
                }
                return null;
            };
            const product = findProduct(json);
            if (product && product.offers) {
                const offers = product.offers;
                let priceStr = '';
                let currencyStr = '';
                if (Array.isArray(offers) && offers.length > 0) {
                    priceStr = String(offers[0].price || offers[0].lowPrice || '');
                    currencyStr = String(offers[0].priceCurrency || '');
                }
                else if (typeof offers === 'object') {
                    priceStr = String(offers.price || offers.lowPrice || '');
                    currencyStr = String(offers.priceCurrency || '');
                }
                if (priceStr) {
                    result = {
                        price: cleanPrice(priceStr),
                        currency: currencyStr ? detectCurrency(currencyStr) : detectCurrency(priceStr),
                        name: product.name ? String(product.name) : undefined
                    };
                    return false; // Break loop
                }
            }
        }
        catch (e) {
            // Ignore parsing errors for other JSON-LD tags
        }
    });
    return result;
}
/**
 * Extract OpenGraph / Meta tag product data
 */
function extractMetaTags(html) {
    const $ = cheerio.load(html);
    const priceMeta = $('meta[property="og:price:amount"]').attr('content') ||
        $('meta[property="product:price:amount"]').attr('content') ||
        $('meta[name="twitter:data1"]').attr('content') ||
        $('meta[itemprop="price"]').attr('content');
    const currencyMeta = $('meta[property="og:price:currency"]').attr('content') ||
        $('meta[property="product:price:currency"]').attr('content') ||
        $('meta[itemprop="priceCurrency"]').attr('content');
    const nameMeta = $('meta[property="og:title"]').attr('content') ||
        $('meta[name="twitter:title"]').attr('content') ||
        $('title').text().trim();
    if (priceMeta) {
        const parsedPrice = cleanPrice(priceMeta);
        if (parsedPrice > 0) {
            return {
                price: parsedPrice,
                currency: currencyMeta ? detectCurrency(currencyMeta) : detectCurrency(priceMeta),
                name: nameMeta || undefined
            };
        }
    }
    return null;
}
/**
 * Extract using custom CSS Selector
 */
function extractCustomSelector(html, selector) {
    const $ = cheerio.load(html);
    const text = $(selector).first().text().trim();
    if (text) {
        const parsedPrice = cleanPrice(text);
        if (parsedPrice > 0) {
            return {
                price: parsedPrice,
                currency: detectCurrency(text)
            };
        }
    }
    return null;
}
/**
 * Unified Price Extraction Service
 */
async function scrapeProductPrice(url, customSelector) {
    console.log(`Scraping product page: ${url}`);
    try {
        const response = await axios_1.default.get(url, {
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            timeout: 10000 // 10s timeout
        });
        const html = response.data;
        const $ = cheerio.load(html);
        // Fallback name parsing
        const pageTitle = $('title').text().trim() || $('meta[property="og:title"]').attr('content') || 'Tracked Product';
        let detectedName = pageTitle.split('-')[0].split('|')[0].trim(); // Get a cleaner name
        // 1. Try JSON-LD
        const jsonLdData = extractJsonLd(html);
        if (jsonLdData && jsonLdData.price > 0) {
            console.log(`✔ Extracted price via JSON-LD: ${jsonLdData.price} ${jsonLdData.currency}`);
            return {
                priceEur: convertToEur(jsonLdData.price, jsonLdData.currency),
                originalPrice: jsonLdData.price,
                originalCurrency: jsonLdData.currency,
                name: jsonLdData.name || detectedName
            };
        }
        // 2. Try OpenGraph / Meta tags
        const metaData = extractMetaTags(html);
        if (metaData && metaData.price > 0) {
            console.log(`✔ Extracted price via Meta tags: ${metaData.price} ${metaData.currency}`);
            return {
                priceEur: convertToEur(metaData.price, metaData.currency),
                originalPrice: metaData.price,
                originalCurrency: metaData.currency,
                name: metaData.name || detectedName
            };
        }
        // 3. Try custom CSS Selector if provided
        if (customSelector) {
            const customData = extractCustomSelector(html, customSelector);
            if (customData && customData.price > 0) {
                console.log(`✔ Extracted price via custom selector [${customSelector}]: ${customData.price} ${customData.currency}`);
                return {
                    priceEur: convertToEur(customData.price, customData.currency),
                    originalPrice: customData.price,
                    originalCurrency: customData.currency,
                    name: detectedName
                };
            }
        }
        // 4. Default selector fallbacks for common e-commerce layouts
        const commonSelectors = [
            '.price', '#price', '.current-price', '[class*="price-current"]',
            '[class*="product-price"]', '.a-price-whole', '.price-amount'
        ];
        for (const selector of commonSelectors) {
            const data = extractCustomSelector(html, selector);
            if (data && data.price > 0) {
                console.log(`✔ Extracted price via fallback selector [${selector}]: ${data.price} ${data.currency}`);
                return {
                    priceEur: convertToEur(data.price, data.currency),
                    originalPrice: data.price,
                    originalCurrency: data.currency,
                    name: detectedName
                };
            }
        }
        throw new Error(`Failed to extract a valid price from the product page at ${url}`);
    }
    catch (error) {
        console.error(`Scraping failed for ${url}: ${error.message}`);
        throw error;
    }
}
