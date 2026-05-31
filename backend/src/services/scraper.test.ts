import { cleanPrice, detectCurrency, convertToEur } from './scraper';

describe('Price Extractor Utilities', () => {
  
  describe('cleanPrice', () => {
    test('should parse standard decimal prices correctly', () => {
      expect(cleanPrice('45.99')).toBe(45.99);
      expect(cleanPrice('€120.00')).toBe(120.00);
      expect(cleanPrice('$9.99')).toBe(9.99);
    });

    test('should handle European comma formatting', () => {
      expect(cleanPrice('45,99')).toBe(45.99);
      expect(cleanPrice('1.250,50 €')).toBe(1250.50);
      expect(cleanPrice('€ 12,50')).toBe(12.50);
    });

    test('should return 0 for empty or invalid inputs', () => {
      expect(cleanPrice('contact store')).toBe(0);
      expect(cleanPrice('')).toBe(0);
    });
  });

  describe('detectCurrency', () => {
    test('should correctly identify USD', () => {
      expect(detectCurrency('$49.99')).toBe('USD');
      expect(detectCurrency('49.99 USD')).toBe('USD');
    });

    test('should correctly identify GBP', () => {
      expect(detectCurrency('£39.99')).toBe('GBP');
      expect(detectCurrency('GBP 39.99')).toBe('GBP');
    });

    test('should fall back to EUR', () => {
      expect(detectCurrency('45.99')).toBe('EUR');
      expect(detectCurrency('45.99 €')).toBe('EUR');
      expect(detectCurrency('45.99 EUR')).toBe('EUR');
    });
  });

  describe('convertToEur', () => {
    test('should return same price for EUR', () => {
      expect(convertToEur(100.00, 'EUR')).toBe(100.00);
    });

    test('should convert USD to EUR using conversion rate', () => {
      // rate is 0.92
      expect(convertToEur(100.00, 'USD')).toBe(92.00);
      expect(convertToEur(50.00, 'USD')).toBe(46.00);
    });

    test('should convert GBP to EUR using conversion rate', () => {
      // rate is 1.17
      expect(convertToEur(100.00, 'GBP')).toBe(117.00);
    });
  });

});
