package com.placement.portal.controller;

import com.placement.portal.entity.Company;
import com.placement.portal.repository.CompanyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/companies")
public class CompanyController {

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping
    public Company addCompany(@RequestBody Company company) {
        String rawPassword = company.getPassword();
        if (rawPassword == null || rawPassword.isBlank()) {
            rawPassword = "admin";
        }
        company.setPassword(passwordEncoder.encode(rawPassword));
        return companyRepository.save(company);
    }

    @GetMapping
    public List<Company> getAllCompanies() {
        return companyRepository.findAll();
    }
}