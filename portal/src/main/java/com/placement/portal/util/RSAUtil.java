package com.placement.portal.util;

import java.security.*;
import java.util.Base64;

public class RSAUtil {

    // Generate RSA Key Pair
    public static KeyPair generateKeyPair() {
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048); // as per your doc
            return generator.generateKeyPair();
        } catch (Exception e) {
            throw new RuntimeException("Error generating RSA key pair");
        }
    }

    // Sign data using private key
    public static String sign(String data, PrivateKey privateKey) {
        try {
            Signature signature = Signature.getInstance("SHA256withRSA");
            signature.initSign(privateKey);
            signature.update(data.getBytes());

            byte[] signedBytes = signature.sign();
            return Base64.getEncoder().encodeToString(signedBytes);

        } catch (Exception e) {
            throw new RuntimeException("Error signing data");
        }
    }

    // Verify signature using public key
    public static boolean verify(String data, String signatureStr, PublicKey publicKey) {
        try {
            Signature signature = Signature.getInstance("SHA256withRSA");
            signature.initVerify(publicKey);
            signature.update(data.getBytes());

            byte[] signatureBytes = Base64.getDecoder().decode(signatureStr);

            return signature.verify(signatureBytes);

        } catch (Exception e) {
            throw new RuntimeException("Error verifying signature");
        }
    }

    // Convert PublicKey to String (store in DB)
    public static String encodePublicKey(PublicKey key) {
        return Base64.getEncoder().encodeToString(key.getEncoded());
    }

    // Convert PrivateKey to String (store in DB)
    public static String encodePrivateKey(PrivateKey key) {
        return Base64.getEncoder().encodeToString(key.getEncoded());
    }

    // Convert String → PublicKey
    public static PublicKey decodePublicKey(String keyStr) {
        try {
            byte[] keyBytes = Base64.getDecoder().decode(keyStr);
            KeyFactory factory = KeyFactory.getInstance("RSA");
            return factory.generatePublic(new java.security.spec.X509EncodedKeySpec(keyBytes));
        } catch (Exception e) {
            throw new RuntimeException("Error decoding public key");
        }
    }

    // Convert String → PrivateKey
    public static PrivateKey decodePrivateKey(String keyStr) {
        try {
            byte[] keyBytes = Base64.getDecoder().decode(keyStr);
            KeyFactory factory = KeyFactory.getInstance("RSA");
            return factory.generatePrivate(new java.security.spec.PKCS8EncodedKeySpec(keyBytes));
        } catch (Exception e) {
            throw new RuntimeException("Error decoding private key");
        }
    }
}