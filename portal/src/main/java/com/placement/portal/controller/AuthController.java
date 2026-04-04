package com.placement.portal.controller;

import com.placement.portal.security.JwtUtil;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final JwtUtil jwtUtil;

    public AuthController(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    // Login API
   @PostMapping("/login")
    public String login(@RequestParam String username,
                        @RequestParam String password) {

        String role;

    if (username.startsWith("admin")) {
        role = "ADMIN";
    } else if (username.startsWith("company")) {
        role = "COMPANY";
    } else if (username.startsWith("placement")) {
        role = "PLACEMENT";
    } else {
        role = "STUDENT";
    }

        return jwtUtil.generateToken(username, role);
    }
}