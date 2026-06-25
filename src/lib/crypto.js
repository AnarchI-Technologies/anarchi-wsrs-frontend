'use client';

async function getKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

function hexToUint8Array(hex) {
    if (hex.length % 2 !== 0) throw new Error("Invalid hex string.");
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
}

export async function decryptDataWithPassword(encryptedString, password) {
    const parts = encryptedString.split(':');
    if (parts.length !== 4) {
        throw new Error('Invalid encrypted data format. Expected 4 parts separated by colons.');
    }

    const [saltHex, ivHex, authTagHex, dataHex] = parts;

    const saltBuffer = hexToUint8Array(saltHex);
    const ivBuffer = hexToUint8Array(ivHex);
    const authTagBuffer = hexToUint8Array(authTagHex);
    const dataBuffer = hexToUint8Array(dataHex);

    const key = await getKey(password, saltBuffer);

    // The Web Crypto API's AES-GCM implementation expects the auth tag to be appended to the ciphertext.
    const combinedBuffer = new Uint8Array(dataBuffer.length + authTagBuffer.length);
    combinedBuffer.set(dataBuffer);
    combinedBuffer.set(authTagBuffer, dataBuffer.length);
    try {
        const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBuffer }, key, combinedBuffer);
        return JSON.parse(new TextDecoder().decode(decrypted));
    } catch (e) {
        throw new Error("Decryption failed. Please double-check your password.");
    }
}