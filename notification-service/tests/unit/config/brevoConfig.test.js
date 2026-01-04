jest.mock('axios', () => ({
    create: jest.fn((config) => ({ defaults: { baseURL: config.baseURL, headers: config.headers } })),
}));

const axios = require('axios');

describe('brevoConfig', () => {
    const originalUrl = process.env.BREVO_API_URL;
    const originalKey = process.env.BREVO_API_KEY;

    afterAll(() => {
        process.env.BREVO_API_URL = originalUrl;
        process.env.BREVO_API_KEY = originalKey;
    });

    beforeEach(() => {
        delete require.cache[require.resolve('../../../src/config/brevoConfig')];
        axios.create.mockClear();
    });

    it('creates an axios client using Brevo environment variables', () => {
        process.env.BREVO_API_URL = 'https://brevo.test';
        process.env.BREVO_API_KEY = 'brevo-key';

        const client = require('../../../src/config/brevoConfig');

        expect(axios.create).toHaveBeenCalledWith({
            baseURL: 'https://brevo.test',
            headers: {
                'api-key': 'brevo-key',
                'Content-Type': 'application/json',
            },
        });
        expect(client.defaults.baseURL).toBe('https://brevo.test');
        expect(client.defaults.headers['api-key']).toBe('brevo-key');
    });
});
