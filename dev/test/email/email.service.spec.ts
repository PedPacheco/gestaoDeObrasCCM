import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { createTransport, Transporter } from 'nodemailer';
import { EmailService } from 'src/modules/email/email.service';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

describe('EmailService', () => {
  let mockCacheManager: Cache;
  let emailService: EmailService;
  let mockTransporter: Transporter;

  beforeEach(async () => {
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    } as unknown as Cache;

    mockTransporter = {
      sendMail: jest.fn(),
    } as unknown as Transporter;

    (createTransport as jest.Mock).mockReturnValue(mockTransporter);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    emailService = module.get<EmailService>(EmailService);
  });

  describe('sendEmail', () => {
    it('should throw an error if email limit is exceeded', async () => {
      jest.spyOn(mockCacheManager, 'get').mockResolvedValue(7);

      await expect(
        emailService.sendEmail('test@gmail.com', 'Subject', 'text'),
      ).rejects.toThrow('Número de emails máximo atingido');
    });

    it('should send an email and increment the email count', async () => {
      jest.spyOn(mockCacheManager, 'get').mockResolvedValue(1);
      jest.spyOn(mockCacheManager, 'set').mockResolvedValue(undefined);

      await emailService.sendEmail('test@gmail.com', 'Subject', 'text');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: process.env.GMAIL_USER,
        to: 'test@gmail.com',
        subject: 'Subject',
        text: 'text',
      });
      expect(mockCacheManager.set).toHaveBeenCalled();
    });
  });

  describe('incrementEmailCount', () => {
    it('should create a count if the value of cache is undefined', async () => {
      const today = new Date().toISOString().slice(0, 10);
      const key = `emailCount:${today}`;
      jest.spyOn(mockCacheManager, 'get').mockResolvedValue(undefined);

      await emailService['incrementEmailCount']();

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, 1, 0);
    });

    it('should increment a count of cache', async () => {
      const today = new Date().toISOString().slice(0, 10);
      const key = `emailCount:${today}`;
      jest.spyOn(mockCacheManager, 'get').mockResolvedValue(1);

      await emailService['incrementEmailCount']();

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, 1 + 1, 0);
    });
  });

  describe('getEmailCount', () => {
    it('should return the email count from the cache', async () => {
      jest.spyOn(mockCacheManager, 'get').mockResolvedValue(3);

      const count = await emailService['getEmailCount']();

      expect(count).toBe(3);
    });

    it('should return 0 if count is not found', async () => {
      jest.spyOn(mockCacheManager, 'get').mockResolvedValue(undefined);

      const count = await emailService['getEmailCount']();

      expect(count).toBe(0);
    });
  });
});
