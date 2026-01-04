let mockCapturedHandler;

jest.mock('../../../src/config/redisConfig', () => {
    const subscribe = jest.fn((channel, cb) => {
        if (cb) cb();
    });
    const on = jest.fn((event, handler) => {
        if (event === 'message') {
            mockCapturedHandler = handler;
        }
    });

    return {
        redisSub: { subscribe, on },
        __getCapturedHandler: () => mockCapturedHandler,
    };
});

const mockBrevoService = {
    sendEmail: jest.fn(),
    sendSMS: jest.fn(),
    sendWhatsApp: jest.fn(),
};

jest.mock('../../../src/utils/brevoService', () => mockBrevoService);

const { redisSub, __getCapturedHandler } = require('../../../src/config/redisConfig');
require('../../../src/workers/notificationWorker');

describe('notification worker', () => {
    const originalError = console.error;

    beforeEach(() => {
        console.error = jest.fn();
        mockBrevoService.sendEmail.mockReset();
        mockBrevoService.sendSMS.mockReset();
        mockBrevoService.sendWhatsApp.mockReset();
    });

    afterAll(() => {
        console.error = originalError;
    });

    it('subscribes to the notifications channel', () => {
        expect(redisSub.subscribe).toHaveBeenCalledWith('notifications', expect.any(Function));
        expect(typeof __getCapturedHandler()).toBe('function');
    });

    it('dispatches messages based on notification type', async () => {
        const handler = __getCapturedHandler();

        await handler('notifications', JSON.stringify({
            type: 'email',
            contact: 'user@example.com',
            message: 'Email body',
        }));

        await handler('notifications', JSON.stringify({
            type: 'sms',
            contact: '+1234567890',
            message: 'SMS body',
        }));

        await handler('notifications', JSON.stringify({
            type: 'whatsapp',
            contact: '+15555555555',
            message: 'WhatsApp body',
        }));

        expect(mockBrevoService.sendEmail).toHaveBeenCalledWith(
            'user@example.com',
            'New Notification',
            'Email body'
        );
        expect(mockBrevoService.sendSMS).toHaveBeenCalledWith('+1234567890', 'SMS body');
        expect(mockBrevoService.sendWhatsApp).toHaveBeenCalledWith('+15555555555', 'WhatsApp body');
    });

    it('logs errors thrown by notification senders', async () => {
        const handler = __getCapturedHandler();
        mockBrevoService.sendSMS.mockRejectedValue(new Error('failed to send'));

        await handler('notifications', JSON.stringify({
            type: 'sms',
            contact: '+1234567890',
            message: 'SMS body',
        }));

        expect(console.error).toHaveBeenCalledWith('Error sending notification:', 'failed to send');
    });
});
