export function generateRandomPassword(): string {
  const upperCaseLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowerCaseLetters = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specialCharacters = '@$!%*?&';

  const allCharacters =
    upperCaseLetters + lowerCaseLetters + numbers + specialCharacters;

  let password = '';

  password +=
    upperCaseLetters[Math.floor(Math.random() * upperCaseLetters.length)];
  password +=
    lowerCaseLetters[Math.floor(Math.random() * lowerCaseLetters.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password +=
    specialCharacters[Math.floor(Math.random() * specialCharacters.length)];

  for (let i = 4; i < 8; i++) {
    password +=
      allCharacters[Math.floor(Math.random() * specialCharacters.length)];
  }

  password = password
    .split('')
    .sort(() => 0.5 - Math.random())
    .join('');

  return password;
}
