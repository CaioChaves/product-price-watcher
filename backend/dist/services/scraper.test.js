"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scraper_1 = require("./scraper");
describe('Price Extractor Utilities', () => {
    describe('cleanPrice', () => {
        test('should parse standard decimal prices correctly', () => {
            expect((0, scraper_1.cleanPrice)('45.99')).toBe(45.99);
            expect((0, scraper_1.cleanPrice)('€120.00')).toBe(120.00);
            expect((0, scraper_1.cleanPrice)('$9.99')).toBe(9.99);
        });
        test('should handle European comma formatting', () => {
            expect((0, scraper_1.cleanPrice)('45,99')).toBe(45.99);
            expect((0, scraper_1.cleanPrice)('1.250,50 €')).toBe(1250.50);
            expect((0, scraper_1.cleanPrice)('€ 12,50')).toBe(12.50);
        });
        test('should return 0 for empty or invalid inputs', () => {
            expect((0, scraper_1.cleanPrice)('contact store')).toBe(0);
            expect((0, scraper_1.cleanPrice)('')).toBe(0);
        });
    });
    describe('detectCurrency', () => {
        test('should correctly identify USD', () => {
            expect((0, scraper_1.detectCurrency)('$49.99')).toBe('USD');
            expect((0, scraper_1.detectCurrency)('49.99 USD')).toBe('USD');
        });
        test('should correctly identify GBP', () => {
            expect((0, scraper_1.detectCurrency)('£39.99')).toBe('GBP');
            expect((0, scraper_1.detectCurrency)('GBP 39.99')).toBe('GBP');
        });
        test('should fall back to EUR', () => {
            expect((0, scraper_1.detectCurrency)('45.99')).toBe('EUR');
            expect((0, scraper_1.detectCurrency)('45.99 €')).toBe('EUR');
            expect((0, scraper_1.detectCurrency)('45.99 EUR')).toBe('EUR');
        });
    });
    describe('convertToEur', () => {
        test('should return same price for EUR', () => {
            expect((0, scraper_1.convertToEur)(100.00, 'EUR')).toBe(100.00);
        });
        test('should convert USD to EUR using conversion rate', () => {
            // rate is 0.92
            expect((0, scraper_1.convertToEur)(100.00, 'USD')).toBe(92.00);
            expect((0, scraper_1.convertToEur)(50.00, 'USD')).toBe(46.00);
        });
        test('should convert GBP to EUR using conversion rate', () => {
            // rate is 1.17
            expect((0, scraper_1.convertToEur)(100.00, 'GBP')).toBe(117.00);
        });
    });
});
