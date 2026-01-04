const mockSendMail = jest.fn().mockResolvedValue();

jest.mock('nodemailer', () => ({
    createTransport: jest.fn(() => ({ sendMail: mockSendMail })),
}));

const originalUser = process.env.EMAIL_USER;
const originalPass = process.env.EMAIL_PASS;
process.env.EMAIL_USER = 'noreply@example.com';
process.env.EMAIL_PASS = 'password';

const nodemailer = require('nodemailer');
const sendEmail = require('../../../src/utils/sendEmail');

describe('standalone sendEmail helper', () => {
    afterAll(() => {
        process.env.EMAIL_USER = originalUser;
        process.env.EMAIL_PASS = originalPass;
    });

    beforeEach(() => {
        mockSendMail.mockClear();
    });

    it('reuses the configured transporter to send mail', async () => {
        await sendEmail('user-1', 'New message');

        expect(nodemailer.createTransport).toHaveBeenCalledWith({
            service: 'gmail',
            auth: {
                user: 'noreply@example.com',
                pass: 'password',
            },
        });

        expect(mockSendMail).toHaveBeenCalledWith({
            from: 'noreply@example.com',
            to: 'user@example.com',
            subject: 'Notification',
            text: 'New message',
        });
    });
});
