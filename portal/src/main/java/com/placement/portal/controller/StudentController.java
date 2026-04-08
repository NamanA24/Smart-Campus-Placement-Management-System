package com.placement.portal.controller;

import com.placement.portal.dto.StudentPlacementDTO;
import com.placement.portal.dto.FitScoreResponse;
import com.placement.portal.entity.Student;
import com.placement.portal.repository.StudentRepository;
import com.placement.portal.service.AuditService;
import com.placement.portal.service.FitScoreService;
import com.placement.portal.service.StudentSecurityService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/students")
public class StudentController {

    private static final Path RESUME_ROOT = Paths.get("uploads", "resumes");

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
        validateGender(student.getGender());
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

            student.setIntegrityStatus(studentSecurityService.verifyProfileStatus(student));
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
            if (updatedStudent.getGender() != null && !updatedStudent.getGender().isBlank()) {
                student.setGender(updatedStudent.getGender());
            }
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

        if (updatedStudent.getGender() != null && !updatedStudent.getGender().isBlank()) {
            student.setGender(updatedStudent.getGender());
        }
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

    @PostMapping(value = "/me/resume", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Student uploadMyResume(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resume file is required");
        }

        String email = currentUsername();
        Student student = resolveSingleStudentByEmail(email);

        String storedFileName = storeResumeFile(student.getId(), file);
        student.setResumeLink("/students/resume/" + student.getId() + "/" + storedFileName);
        studentSecurityService.signProfile(student);

        Student saved = studentRepository.save(student);
        auditService.log("STUDENT_RESUME_UPLOADED", saved.getEmail(), "Resume uploaded: " + storedFileName);
        return applyIntegrityStatus(saved);
    }

    @GetMapping("/resume/{studentId}/{filename:.+}")
    public ResponseEntity<Resource> getResume(
            @PathVariable Long studentId,
            @PathVariable String filename
    ) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));

        String expectedLink = "/students/resume/" + studentId + "/" + filename;
        if (student.getResumeLink() == null || !student.getResumeLink().equals(expectedLink)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Resume not found");
        }

        Path filePath = RESUME_ROOT.resolve(String.valueOf(studentId)).resolve(filename).normalize();
        if (!Files.exists(filePath)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Resume file not found on disk");
        }

        try {
            Resource resource = new UrlResource(filePath.toUri());
            String contentType = Files.probeContentType(filePath);
            if (contentType == null || contentType.isBlank()) {
                contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (MalformedURLException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not load resume", ex);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not determine resume type", ex);
        }
    }

    @GetMapping("/placement-view")
    public List<StudentPlacementDTO> getPlacementView() {
        return studentRepository.findAll().stream()
                .map(student -> new StudentPlacementDTO(
                        student.getId(),
                        student.getName(),
                        student.getCgpa(),
                        student.getSkills(),
                        student.getProjects(),
                        student.getResumeLink(),
                        student.getGraduationYear(),
                        student.getUniversity(),
                        student.getGender(),
                        student.getPhone(),
                        student.getEmail()
                ))
                .toList();
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

    private void validateGender(String gender) {
        if (gender == null || gender.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Gender is required");
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

    private String storeResumeFile(Long studentId, MultipartFile file) {
        String originalName = file.getOriginalFilename() == null
                ? "resume"
                : Paths.get(file.getOriginalFilename()).getFileName().toString();

        String safeName = originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
        String storedName = LocalDateTime.now().toString().replace(":", "-") + "_" + safeName;

        Path studentDir = RESUME_ROOT.resolve(String.valueOf(studentId));
        try {
            Files.createDirectories(studentDir);
            Path target = studentDir.resolve(storedName).normalize();
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return storedName;
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store resume", ex);
        }
    }
}

