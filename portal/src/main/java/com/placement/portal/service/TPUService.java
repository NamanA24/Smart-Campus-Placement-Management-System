package com.placement.portal.service;

import com.placement.portal.util.RSAUtil;
import org.springframework.stereotype.Service;

import java.security.KeyPair;
import java.security.PrivateKey;
import java.security.PublicKey;

@Service
public class TPUService {

    // GENERATE RSA KEY PAIR
    public KeyPair generateKeys() {
        return RSAUtil.generateKeyPair();
    }

    // ENCODE KEYS (for storing in DB)
    public String encodePublicKey(PublicKey key) {
        return RSAUtil.encodePublicKey(key);
    }

    public String encodePrivateKey(PrivateKey key) {
        return RSAUtil.encodePrivateKey(key);
    }

    // SIGN DATA (String → PrivateKey → Signature)
    public String signData(String data, String privateKeyStr) {
        if (privateKeyStr == null || privateKeyStr.isBlank()) {
            return "NO_SIGNATURE";
        }

        try {
            PrivateKey privateKey = RSAUtil.decodePrivateKey(privateKeyStr);
            return RSAUtil.sign(data, privateKey);
        } catch (RuntimeException ex) {
            return "NO_SIGNATURE";
        }
    }

    // VERIFY DATA (String → PublicKey → verify)
    public boolean verifyData(String data, String signature, String publicKeyStr) {
        if (publicKeyStr == null || publicKeyStr.isBlank()) {
            return false;
        }

        if (signature == null || signature.isBlank() || "NO_SIGNATURE".equals(signature)) {
            return false;
        }

        try {
            PublicKey publicKey = RSAUtil.decodePublicKey(publicKeyStr);
            return RSAUtil.verify(data, signature, publicKey);
        } catch (RuntimeException ex) {
            return false;
        }
    }
}