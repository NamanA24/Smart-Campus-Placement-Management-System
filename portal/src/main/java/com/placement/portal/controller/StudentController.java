package com.placement.portal.controller;

import com.placement.portal.dto.FitScoreResponse;
import com.placement.portal.entity.Student;
import com.placement.portal.repository.StudentRepository;
import com.placement.portal.service.AuditService;
import com.placement.portal.service.FitScoreService;
import com.placement.portal.service.StudentSecurityService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/students")
public class StudentController {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private StudentSecurityService studentSecurityService;

    @Autowired
    private AuditService auditService;

    @Autowired
    private FitScoreService fitScoreService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping
    public Student createStudent(@RequestBody Student student) {
        validateEmailForCreate(student.getEmail());
        ensurePassword(student);
        studentSecurityService.signProfile(student);

        Student saved = studentRepository.save(student);
        auditService.log("STUDENT_CREATED", saved.getEmail(), "Student profile created and signed");
        return applyIntegrityStatus(saved);
    }

    @GetMapping
    public List<Student> getAllStudents() {
        List<Student> students = studentRepository.findAll();
        for (Student student : students) {
            if (student.getPublicKey() == null || student.getPrivateKey() == null) {
                studentSecurityService.ensureKeys(student);
                studentRepository.save(student);
            }
        }
        return students;
    }

    @DeleteMapping("/{id}")
    public String deleteStudent(@PathVariable Long id) {

        Optional<Student> student = studentRepository.findById(id);

        if (student.isPresent()) {
            studentRepository.delete(student.get());
            return "Student deleted successfully";
        } else {
            return "Student not found";
        }
    }

    @PutMapping("/{id}")
    public Student updateStudent(@PathVariable Long id, @RequestBody Student updatedStudent) {

        Optional<Student> studentOptional = studentRepository.findById(id);

        if (studentOptional.isPresent()) {
            Student student = studentOptional.get();

            String newEmail = updatedStudent.getEmail();

            boolean emailChanged = newEmail != null && !newEmail.equals(student.getEmail());
            if (emailChanged) {
                List<Student> existingWithEmail = studentRepository.findAllByEmail(newEmail);
                boolean emailBelongsToAnother = existingWithEmail.stream()
                        .anyMatch(s -> !s.getId().equals(id));

                if (emailBelongsToAnother) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
                }
            }

            student.setName(updatedStudent.getName());
            if (newEmail != null && !newEmail.isBlank()) {
                student.setEmail(newEmail);
            }
            student.setBranch(updatedStudent.getBranch());
            student.setCgpa(updatedStudent.getCgpa());
            student.setSkills(updatedStudent.getSkills());
            student.setProjects(updatedStudent.getProjects());
            student.setResumeLink(updatedStudent.getResumeLink());
            student.setPhone(updatedStudent.getPhone());
            student.setUniversity(updatedStudent.getUniversity());
            student.setGraduationYear(updatedStudent.getGraduationYear());

            Student saved = studentRepository.save(student);
            auditService.log("STUDENT_UPDATED_BY_ADMIN", saved.getEmail(), "Student profile updated by admin");
            return applyIntegrityStatus(saved);
        } else {
            return null;
        }
    }
    
    @GetMapping("/me")
    public Student getMyProfile() {

        String username = currentUsername();

        return applyIntegrityStatus(resolveSingleStudentByEmail(username));
    }

    @PutMapping("/me")
    public Student updateMyProfile(@RequestBody Student updatedStudent) {

        String email = currentUsername();

        Student student = resolveSingleStudentByEmail(email);

        student.setCgpa(updatedStudent.getCgpa());
        student.setSkills(updatedStudent.getSkills());
        student.setProjects(updatedStudent.getProjects());
        student.setResumeLink(updatedStudent.getResumeLink());
        student.setPhone(updatedStudent.getPhone());
        student.setUniversity(updatedStudent.getUniversity());
        student.setGraduationYear(updatedStudent.getGraduationYear());

        studentSecurityService.signProfile(student);

        Student saved = studentRepository.save(student);
        auditService.log("STUDENT_UPDATED_SELF", saved.getEmail(), "Student profile updated and re-signed by owner");

        return applyIntegrityStatus(saved);
    }

    @PostMapping("/me/resign")
    public Student resignMyProfile() {
        String email = currentUsername();

        Student student = resolveSingleStudentByEmail(email);
        studentSecurityService.signProfile(student);

        Student saved = studentRepository.save(student);
        auditService.log("STUDENT_RESIGNED", saved.getEmail(), "Student profile re-signed by owner");

        return applyIntegrityStatus(saved);
    }

    @GetMapping("/fit-score")
    public FitScoreResponse getFitScore() {

        String email = currentUsername();

        Student student = resolveSingleStudentByEmail(email);

        return fitScoreService.calculateFitScore(student, null);
    }

    private Student applyIntegrityStatus(Student student) {
        student.setIntegrityStatus(studentSecurityService.verifyProfileStatus(student));
        return student;
    }

    private Student resolveSingleStudentByEmail(String email) {

        List<Student> students = studentRepository.findAllByEmail(email);

        if (students.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Student profile not found");
        }

        if (students.size() > 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Duplicate student profiles found for the same email");
        }

        return students.get(0);
    }

    private void validateEmailForCreate(String email) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }

        List<Student> existing = studentRepository.findAllByEmail(email);
        if (!existing.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }
    }

    private String currentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        return authentication.getName();
    }

    private void ensurePassword(Student student) {
        String rawPassword = student.getPassword();
        if (rawPassword == null || rawPassword.isBlank()) {
            rawPassword = "dev";
        }
        student.setPassword(passwordEncoder.encode(rawPassword));
    }
}

