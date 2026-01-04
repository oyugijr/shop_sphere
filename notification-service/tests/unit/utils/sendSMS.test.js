jest.mock('axios', () => ({
    post: jest.fn().mockResolvedValue({}),
}));

const axios = require('axios');
const sendSMS = require('../../../src/utils/sendSMS');

describe('sendSMS helper', () => {
    const originalKey = process.env.FAST2SMS_API_KEY;

    afterAll(() => {
        process.env.FAST2SMS_API_KEY = originalKey;
    });

    beforeEach(() => {
        process.env.FAST2SMS_API_KEY = 'api-key';
        axios.post.mockClear();
    });

    it('invokes the Fast2SMS endpoint with expected payload and headers', async () => {
        await sendSMS('user-1', 'Hello SMS');

        expect(axios.post).toHaveBeenCalledWith(
            'https://www.fast2sms.com/dev/bulk',
            {
                message: 'Hello SMS',
                language: 'english',
                route: 'p',
                numbers: '1234567890',
            },
            { headers: { Authorization: 'api-key' } }
        );
    });
});
