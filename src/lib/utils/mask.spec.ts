import { applyMask, isMaskActive } from './mask';

describe('mask utilities', () => {
    describe('isMaskActive', () => {
        it('is false for empty / nullish masks', () => {
            expect(isMaskActive('')).toBe(false);
            expect(isMaskActive(null)).toBe(false);
            expect(isMaskActive(undefined)).toBe(false);
        });

        it('is false for masks with no input tokens', () => {
            expect(isMaskActive('----')).toBe(false);
            expect(isMaskActive('+ / ')).toBe(false);
        });

        it('is true when the mask has at least one token', () => {
            expect(isMaskActive('0000')).toBe(true);
            expect(isMaskActive('AA-00')).toBe(true);
            expect(isMaskActive('***')).toBe(true);
        });
    });

    describe('applyMask', () => {
        it('formats digits with literal separators (card)', () => {
            expect(applyMask('1234567812345678', '0000 0000 0000 0000')).toEqual({
                masked: '1234 5678 1234 5678',
                unmasked: '1234567812345678'
            });
        });

        it('inserts the separator only once enough characters are typed (date)', () => {
            expect(applyMask('12', '00/00/0000').masked).toBe('12');
            expect(applyMask('123', '00/00/0000').masked).toBe('12/3');
            expect(applyMask('12122026', '00/00/0000').masked).toBe('12/12/2026');
        });

        it('re-formats input that already contains separators', () => {
            expect(applyMask('12/12/2026', '00/00/0000').masked).toBe('12/12/2026');
            expect(applyMask('1234 5678', '0000 0000 0000 0000').masked).toBe('1234 5678');
        });

        it('skips characters that do not match the token', () => {
            // letters are ignored by digit tokens
            expect(applyMask('12ab34', '0000').masked).toBe('1234');
        });

        it('supports letter and alphanumeric tokens (IBAN-like)', () => {
            expect(applyMask('ES7620770024', 'AA00 0000 0000').masked).toBe('ES76 2077 0024');
            expect(applyMask('AB12cd', '** ** **').masked).toBe('AB 12 cd');
        });

        it('truncates input that exceeds the mask length', () => {
            expect(applyMask('123456', '0000').masked).toBe('1234');
            expect(applyMask('123456', '0000').unmasked).toBe('1234');
        });

        it('returns empty result for empty input', () => {
            expect(applyMask('', '0000 0000')).toEqual({ masked: '', unmasked: '' });
            expect(applyMask(null, '0000')).toEqual({ masked: '', unmasked: '' });
        });

        it('never shows a trailing separator before the next character', () => {
            expect(applyMask('1234', '0000 0000').masked).toBe('1234');
        });
    });
});
