package com.placement.portal.config;

import com.placement.portal.security.JwtFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth

                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/error").permitAll()

                // Student self (PUT + GET FIRST)
                .requestMatchers(HttpMethod.GET, "/students/me")
                    .hasAnyAuthority("ROLE_STUDENT", "ROLE_ADMIN")

                .requestMatchers(HttpMethod.PUT, "/students/me")
                    .hasAnyAuthority("ROLE_STUDENT", "ROLE_ADMIN")

                // Placement
                .requestMatchers("/applications/placement")
                    .hasAuthority("ROLE_PLACEMENT")

                // Company
                .requestMatchers("/applications/company")
                    .hasAuthority("ROLE_COMPANY")

                .requestMatchers("/applications/company/shortlist")
                    .hasAuthority("ROLE_COMPANY")
                
                // Student applications
                .requestMatchers("/applications/me")
                    .hasAuthority("ROLE_STUDENT")

                .requestMatchers("/students/fit-score")
                    .hasAuthority("ROLE_STUDENT")

                // Admin only (KEEP AFTER /students/me)
                .requestMatchers(HttpMethod.POST, "/students")
                    .hasAuthority("ROLE_ADMIN")

                .requestMatchers(HttpMethod.GET, "/students")
                    .hasAuthority("ROLE_ADMIN")

                .requestMatchers(HttpMethod.PUT, "/students/**")
                    .hasAuthority("ROLE_ADMIN")

                .requestMatchers(HttpMethod.DELETE, "/students/**")
                    .hasAuthority("ROLE_ADMIN")

                .requestMatchers("/applications/company/shortlist/**")
                    .hasAuthority("ROLE_COMPANY")
                
                .requestMatchers("/applications/*/status")
                    .hasAuthority("ROLE_COMPANY")
                
                // Applications general
                .requestMatchers("/applications/**")
                    .hasAnyAuthority("ROLE_ADMIN", "ROLE_COMPANY", "ROLE_PLACEMENT", "ROLE_STUDENT")
                
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
            
        return http.build();
    }
}