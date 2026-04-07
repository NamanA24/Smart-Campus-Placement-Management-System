package com.placement.portal.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.util.Date;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.KeyFactory;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

@Component
public class JwtUtil {

    private final PrivateKey privateKey;
    private final PublicKey publicKey;
    private static final String KEY_STORE_DIR = "jwt_keys";
    private static final String PRIVATE_KEY_FILE = "jwt_keys/private_key.pem";
    private static final String PUBLIC_KEY_FILE = "jwt_keys/public_key.pem";

    public JwtUtil() {
        try {
            KeyPair keyPair = loadOrGenerateKeys();
            this.privateKey = keyPair.getPrivate();
            this.publicKey = keyPair.getPublic();
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to initialize RSA JWT keys", ex);
        }
    }

    private KeyPair loadOrGenerateKeys() throws Exception {
        Path privateKeyPath = Paths.get(PRIVATE_KEY_FILE);
        Path publicKeyPath = Paths.get(PUBLIC_KEY_FILE);

        // If keys exist, load them
        if (Files.exists(privateKeyPath) && Files.exists(publicKeyPath)) {
            PrivateKey privateKey = loadPrivateKey(privateKeyPath);
            PublicKey publicKey = loadPublicKey(publicKeyPath);
            return new KeyPair(publicKey, privateKey);
        }

        // Otherwise generate new keys and persist them
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        KeyPair keyPair = generator.generateKeyPair();

        // Ensure directory exists
        Files.createDirectories(Paths.get(KEY_STORE_DIR));

        // Save keys
        savePrivateKey(keyPair.getPrivate(), privateKeyPath);
        savePublicKey(keyPair.getPublic(), publicKeyPath);

        return keyPair;
    }

    private PrivateKey loadPrivateKey(Path path) throws Exception {
        String keyContent = Files.readString(path)
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s", "");
        byte[] decodedKey = Base64.getDecoder().decode(keyContent);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        return keyFactory.generatePrivate(new PKCS8EncodedKeySpec(decodedKey));
    }

    private PublicKey loadPublicKey(Path path) throws Exception {
        String keyContent = Files.readString(path)
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s", "");
        byte[] decodedKey = Base64.getDecoder().decode(keyContent);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        return keyFactory.generatePublic(new X509EncodedKeySpec(decodedKey));
    }

    private void savePrivateKey(PrivateKey key, Path path) throws Exception {
        String encoded = Base64.getEncoder().encodeToString(key.getEncoded());
        String pem = "-----BEGIN PRIVATE KEY-----\n" + 
                     encoded.replaceAll("(.{64})", "$1\n") + 
                     "\n-----END PRIVATE KEY-----";
        Files.writeString(path, pem);
    }

    private void savePublicKey(PublicKey key, Path path) throws Exception {
        String encoded = Base64.getEncoder().encodeToString(key.getEncoded());
        String pem = "-----BEGIN PUBLIC KEY-----\n" + 
                     encoded.replaceAll("(.{64})", "$1\n") + 
                     "\n-----END PUBLIC KEY-----";
        Files.writeString(path, pem);
    }

    // Generate Token
    public String generateToken(String username, String role) {
        return Jwts.builder()
                .setSubject(username)
                .claim("role", "ROLE_" + role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60))
                .signWith(privateKey, io.jsonwebtoken.SignatureAlgorithm.RS256)
                .compact();
    }

    // Extract Username
    public String extractUsername(String token) {
        return extractClaims(token).getSubject();
    }

    // Validate Token
    public boolean validateToken(String token) {
        try {
            extractClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public String extractRole(String token) {
        return extractClaims(token).get("role", String.class);
    }
    // Extract Claims (NEW API)
    private Claims extractClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(publicKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}