jest.mock('../../../src/config/brevoConfig', () => ({
    post: jest.fn(),
}));

const brevoClient = require('../../../src/config/brevoConfig');
const { sendEmail, sendSMS, sendWhatsApp } = require('../../../src/utils/brevoService');

describe('brevoService helpers', () => {
    const originalError = console.error;

    beforeEach(() => {
        console.error = jest.fn();
        brevoClient.post.mockReset();
    });

    afterEach(() => {
        console.error = originalError;
    });

    it('sends transactional emails through the Brevo client', async () => {
        brevoClient.post.mockResolvedValue({ data: { id: 'email-1' } });

        const response = await sendEmail('user@example.com', 'Subject', 'Body');

        expect(brevoClient.post).toHaveBeenCalledWith('/smtp/email', {
            sender: { name: 'ShopSphere', email: 'noreply@shopsphere.com' },
            to: [{ email: 'user@example.com' }],
            subject: 'Subject',
            htmlContent: '<p>Body</p>',
        });
        expect(response).toEqual({ id: 'email-1' });
    });

    it('sends SMS messages through the Brevo client', async () => {
        brevoClient.post.mockResolvedValue({ data: { id: 'sms-1' } });

        const response = await sendSMS('+1234567890', 'Hello');

        expect(brevoClient.post).toHaveBeenCalledWith('/transactionalSMS/sms', {
            sender: 'ShopSphere',
            recipient: '+1234567890',
            content: 'Hello',
        });
        expect(response).toEqual({ id: 'sms-1' });
    });

    it('propagates WhatsApp errors and logs them', async () => {
        const error = new Error('bad request');
        brevoClient.post.mockRejectedValue(error);

        await expect(sendWhatsApp('+123', 'Hi')).rejects.toThrow('bad request');
        expect(console.error).toHaveBeenCalledWith(
            'Error sending WhatsApp:',
            'bad request'
        );
    });
});
