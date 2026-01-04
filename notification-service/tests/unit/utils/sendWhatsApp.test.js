const twilioMessages = { create: jest.fn().mockResolvedValue({}) };
const mockTwilio = jest.fn(() => ({ messages: twilioMessages }));

jest.mock('twilio', () => mockTwilio, { virtual: true });

const originalSid = process.env.TWILIO_SID;
const originalToken = process.env.TWILIO_AUTH_TOKEN;
const originalNumber = process.env.TWILIO_WHATSAPP_NUMBER;
process.env.TWILIO_SID = 'sid';
process.env.TWILIO_AUTH_TOKEN = 'token';
process.env.TWILIO_WHATSAPP_NUMBER = '+111222333';

const sendWhatsApp = require('../../../src/utils/sendWhatsApp');

describe('sendWhatsApp helper', () => {
    afterAll(() => {
        process.env.TWILIO_SID = originalSid;
        process.env.TWILIO_AUTH_TOKEN = originalToken;
        process.env.TWILIO_WHATSAPP_NUMBER = originalNumber;
    });

    beforeEach(() => {
        twilioMessages.create.mockClear();
    });

    it('creates a Twilio client and sends WhatsApp messages', async () => {
        await sendWhatsApp('user-1', 'Hello WhatsApp');

        expect(mockTwilio).toHaveBeenCalledWith('sid', 'token');
        expect(twilioMessages.create).toHaveBeenCalledWith({
            body: 'Hello WhatsApp',
            from: 'whatsapp:+111222333',
            to: 'whatsapp:+1234567890',
        });
    });
});
