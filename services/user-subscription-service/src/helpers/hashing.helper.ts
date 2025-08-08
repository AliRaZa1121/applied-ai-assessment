import * as argon2 from 'argon2';

// Function to hash a password
export function HashPassword(plainText: string): Promise<string> {
  return argon2.hash(plainText);
}

// Function to compare a plain text password with a hashed password
export function ComparePassword(
  plainText: string,
  hash: string,
): Promise<boolean> {
  return argon2.verify(hash, plainText);
}
