package com.placement.portal.controller;

import com.placement.portal.entity.Company;
import com.placement.portal.entity.Student;
import com.placement.portal.repository.CompanyRepository;
import com.placement.portal.repository.StudentRepository;
import com.placement.portal.security.JwtUtil;
import com.placement.portal.service.AuditService;
import com.placement.portal.service.StudentSecurityService;
import com.placement.portal.util.InputValidationUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final JwtUtil jwtUtil;
    private final StudentRepository studentRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;
    private final StudentSecurityService studentSecurityService;
    private final AuditService auditService;

    @Value("${auth.admin.username:admin}")
    private String adminUsername;

    @Value("${auth.admin.password:admin}")
    private String adminPassword;

    @Value("${auth.placement.username:placement1}")
    private String placementUsername;

    @Value("${auth.placement.password:admin}")
    private String placementPassword;

    public AuthController(JwtUtil jwtUtil,
                          StudentRepository studentRepository,
                          CompanyRepository companyRepository,
                          PasswordEncoder passwordEncoder,
                          StudentSecurityService studentSecurityService,
                          AuditService auditService) {
        this.jwtUtil = jwtUtil;
        this.studentRepository = studentRepository;
        this.companyRepository = companyRepository;
        this.passwordEncoder = passwordEncoder;
        this.studentSecurityService = studentSecurityService;
        this.auditService = auditService;
    }

    // Login API
   @PostMapping("/login")
    public String login(@RequestParam String username,
                        @RequestParam String password) {

        String role;

        if (username == null || username.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username is required");
        }

        if (password == null || password.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password is required");
        }

        if (isStudent(username, password)) {
            role = "STUDENT";
        } else if (isCompany(username, password)) {
            role = "COMPANY";
        } else if (isAdmin(username, password)) {
            role = "ADMIN";
        } else if (isPlacement(username, password)) {
            role = "PLACEMENT";
        } else {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unknown user");
        }

        return jwtUtil.generateToken(username, role);
    }

    @PostMapping("/register/student")
    public Student registerStudent(@RequestBody Student student) {
        InputValidationUtil.validateAndNormalizeStudentForCreate(student, true, true);

        List<Student> existing = studentRepository.findAllByEmail(student.getEmail());
        if (!existing.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        String rawPassword = student.getPassword();
        if (rawPassword == null || rawPassword.isBlank()) {
            rawPassword = "dev";
        }
        student.setPassword(passwordEncoder.encode(rawPassword));

        studentSecurityService.signProfile(student);
        Student saved = studentRepository.save(student);
        saved.setIntegrityStatus(studentSecurityService.verifyProfileStatus(saved));

        auditService.log("STUDENT_SELF_REGISTERED", saved.getEmail(), "Student account created via self registration");
        return saved;
    }

    private boolean isStudent(String username, String password) {
        List<Student> students = studentRepository.findAllByEmail(username);
        if (students.isEmpty()) {
            return false;
        }
        if (students.size() > 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Duplicate student profiles found for the same email");
        }

        Student student = students.get(0);
        String storedPassword = student.getPassword();

        if (storedPassword == null || storedPassword.isBlank()) {
            if (!"dev".equals(password)) {
                return false;
            }
            student.setPassword(passwordEncoder.encode(password));
            studentRepository.save(student);
            return true;
        }

        return passwordEncoder.matches(password, storedPassword);
    }

    private boolean isCompany(String username, String password) {
        List<Company> companies = companyRepository.findAllByName(username);
        if (companies.isEmpty()) {
            return false;
        }
        if (companies.size() > 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Duplicate company profiles found for the same name");
        }

        Company company = companies.get(0);
        String storedPassword = company.getPassword();

        if (storedPassword == null || storedPassword.isBlank()) {
            if (!"admin".equals(password)) {
                return false;
            }
            company.setPassword(passwordEncoder.encode(password));
            companyRepository.save(company);
            return true;
        }

        return passwordEncoder.matches(password, storedPassword);
    }

    private boolean isAdmin(String username, String password) {
        return adminUsername.equals(username) && adminPassword.equals(password);
    }

    private boolean isPlacement(String username, String password) {
        return placementUsername.equals(username) && placementPassword.equals(password);
    }
}