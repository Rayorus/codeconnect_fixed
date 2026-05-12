import CryptoJS from "crypto-js";

const SECRET_KEY =
  process.env.NEXT_PUBLIC_CHAT_ENCRYPTION_KEY || "default-dev-key-change-me";

export function encryptMessage(plaintext: string): string {
  return CryptoJS.AES.encrypt(plaintext, SECRET_KEY).toString();
}

export function decryptMessage(ciphertext: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return "[Unable to decrypt message]";
  }
}
