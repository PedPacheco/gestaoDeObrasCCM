import { generateRandomPassword } from 'src/utils/generatePassword';

describe('generateRandomPassword', () => {
  it('should generate a password of length 8', () => {
    const password = generateRandomPassword();
    expect(password).toHaveLength(8);
  });

  it('should contain at least one uppercase letter', () => {
    const password = generateRandomPassword();
    expect(password).toMatch(/[A-Z]/);
  });

  it('should contain at least one lowercase letter', () => {
    const password = generateRandomPassword();
    expect(password).toMatch(/[a-z]/);
  });

  it('should contain at least one number', () => {
    const password = generateRandomPassword();
    expect(password).toMatch(/\d/);
  });

  it('should contain at least one special character', () => {
    const password = generateRandomPassword();
    expect(password).toMatch(/[@$!%*?&]/);
  });

  it('should generate a different password each time', () => {
    const password1 = generateRandomPassword();
    const password2 = generateRandomPassword();
    expect(password1).not.toEqual(password2);
  });
});
