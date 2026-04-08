package com.placement.portal.controller;

import com.placement.portal.dto.ApplicationDTO;
import com.placement.portal.dto.ApplicationResponseDTO;
import com.placement.portal.dto.FitScoreResponse;
import com.placement.portal.entity.Application;
import com.placement.portal.entity.ApplicationStatus;
import com.placement.portal.entity.Job;
import com.placement.portal.entity.Student;
import com.placement.portal.repository.ApplicationRepository;
import com.placement.portal.repository.JobRepository;
import com.placement.portal.repository.StudentRepository;
import com.placement.portal.service.AuditService;
import com.placement.portal.service.FitScoreService;
import com.placement.portal.service.StudentSecurityService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/applications")
public class ApplicationController {

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private AuditService auditService;

    @Autowired
    private FitScoreService fitScoreService;

    @Autowired
    private StudentSecurityService studentSecurityService;

    @PostMapping
    public Application apply(@RequestBody Application application) {
        if (!hasStudentRole()) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only students can apply for jobs");
        }

        if (application.getJob() == null || application.getJob().getId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Job id is required");
        }

        Student student = resolveSingleStudentByEmail(currentUsername());

        if (!studentSecurityService.isProfileClean(student)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Student profile is tampered. Re-sign before applying.");
        }

        if (application.getStudent() != null && application.getStudent().getId() != null
                && !application.getStudent().getId().equals(student.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only apply using your own student profile");
        }

        Job job = jobRepository.findById(application.getJob().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        FitScoreResponse fit = fitScoreService.calculateFitScore(student, job);
        String payload = fitScoreService.buildSignedPayload(student, job, fit.getScore());

        application.setStudent(student);
        application.setJob(job);
        application.setSignedScore(fit.getScore());
        application.setSignedPayload(payload);
        application.setSignature(fit.getSignature());

        return applicationRepository.save(application);
    }

    @GetMapping
    public List<Application> getAllApplications() {
        return applicationRepository.findAll();
    }

    @GetMapping("/placement")
    public List<ApplicationDTO> getAllApplicationsForPlacement() {
        List<Application> applications = applicationRepository.findAll();

        return applications.stream()
                .map(app -> new ApplicationDTO(
                        app.getStudent().getName(),
                        app.getJob().getTitle(),
                        app.getStatus().toString()
                ))
                .toList();
    }

    @GetMapping("/me")
    public List<ApplicationDTO> getMyApplications() {

        Student student = resolveSingleStudentByEmail(currentUsername());

        List<Application> applications =
                applicationRepository.findByStudentEmail(student.getEmail());

        return applications.stream()
                .map(app -> new ApplicationDTO(
                        app.getStudent().getName(),
                        app.getJob().getTitle(),
                        app.getStatus().toString()
                ))
                .toList();
    }

    @GetMapping("/company")
    public List<ApplicationResponseDTO> getCompanyApplications() {

        String companyName = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        List<Application> applications =
                applicationRepository.findByJobCompanyName(companyName);

        List<ApplicationResponseDTO> response = new ArrayList<>();

        for (Application app : applications) {

                Student student = app.getStudent();

                FitScoreResponse fit = fitScoreService.calculateFitScore(student, app.getJob());

                boolean valid = fitScoreService.verifyStoredSignature(app);
                
                String studentIntegrityStatus = studentSecurityService.verifyProfileStatus(student);

                if (!valid) {
                        app.setStatus(ApplicationStatus.REJECTED);
                        applicationRepository.save(app);

                        auditService.log(
                                "TAMPER_DETECTED",
                                "SYSTEM",
                                "Application ID: " + app.getId() + " was auto-rejected"
                        );
                }

                response.add(new ApplicationResponseDTO(
                        app.getId(),
                        student.getName(),
                        student.getEmail(),
                        student.getPhone(),
                        student.getCgpa(),
                        student.getSkills(),
                        student.getProjects(),
                        student.getResumeLink(),
                        student.getUniversity(),
                        student.getGraduationYear(),
                        app.getJob().getTitle(),
                        app.getJob().getCompany().getName(),
                        app.getJob().getCompany().getRole(),
                        app.getJob().getDescription(),
                        app.getJob().getRequiredSkills(),
                        fit.getScore(),
                        fit.getLevel(),
                        app.getStatus().toString(),
                        app.getSignature(),
                        valid ? "VALID DATA" : "TAMPERED DATA",
                        studentIntegrityStatus
                ));
        }

        response.sort((a, b) -> b.getFitScore() - a.getFitScore());

        return response;
    }

    @GetMapping("/company/shortlist")
    public List<ApplicationResponseDTO> getTopCandidates() {

        String companyName = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        List<Application> applications =
                applicationRepository.findByJobCompanyName(companyName);

        List<ApplicationResponseDTO> response = new ArrayList<>();

        for (Application app : applications) {

                Student student = app.getStudent();

                var fit = fitScoreService.calculateFitScore(student, app.getJob());
                
                String studentIntegrityStatus = studentSecurityService.verifyProfileStatus(student);

                response.add(new ApplicationResponseDTO(
                        app.getId(),
                        student.getName(),
                        student.getEmail(),
                        student.getPhone(),
                        student.getCgpa(),
                        student.getSkills(),
                        student.getProjects(),
                        student.getResumeLink(),
                        student.getUniversity(),
                        student.getGraduationYear(),
                        app.getJob().getTitle(),
                        app.getJob().getCompany().getName(),
                        app.getJob().getCompany().getRole(),
                        app.getJob().getDescription(),
                        app.getJob().getRequiredSkills(),
                        fit.getScore(),
                        fit.getLevel(),
                        app.getStatus().toString(),
                        app.getSignature(),
                        fitScoreService.verifyStoredSignature(app) ? "VALID DATA" : "TAMPERED DATA",
                        studentIntegrityStatus
                ));
        }

        response.sort((a, b) -> b.getFitScore() - a.getFitScore());

        return response.stream().limit(5).toList();
    }

    @GetMapping("/company/shortlist/{jobId}")
    public List<ApplicationResponseDTO> getShortlistByJob(
            @PathVariable Long jobId,
            @RequestParam(defaultValue = "5") int limit,
            @RequestParam(defaultValue = "0") int minScore
    ) {

        String companyName = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        List<Application> applications =
                applicationRepository.findByJobId(jobId);

        List<ApplicationResponseDTO> response = new ArrayList<>();

        for (Application app : applications) {

                if (!app.getJob().getCompany().getName().equals(companyName)) {
                continue;
                }

                Student student = app.getStudent();

                var fit = fitScoreService.calculateFitScore(student, app.getJob());
                
                String studentIntegrityStatus = studentSecurityService.verifyProfileStatus(student);

                if (fit.getScore() >= minScore) {
                        response.add(new ApplicationResponseDTO(
                                app.getId(),
                                student.getName(),
                                student.getEmail(),
                                student.getPhone(),
                                student.getCgpa(),
                                student.getSkills(),
                                student.getProjects(),
                                student.getResumeLink(),
                                student.getUniversity(),
                                student.getGraduationYear(),
                                app.getJob().getTitle(),
                                app.getJob().getCompany().getName(),
                                app.getJob().getCompany().getRole(),
                                app.getJob().getDescription(),
                                app.getJob().getRequiredSkills(),
                                fit.getScore(),
                                fit.getLevel(),
                                app.getStatus().toString(),
                                app.getSignature(),
                                fitScoreService.verifyStoredSignature(app) ? "VALID DATA" : "TAMPERED DATA",
                                studentIntegrityStatus
                        ));
                }
        }

        response.sort((a, b) -> b.getFitScore() - a.getFitScore());

        return response.stream().limit(limit).toList();
    }

    @PutMapping("/{id}/status")
    public Application updateStatus(
            @PathVariable Long id,
            @RequestParam String status
    ) {
        String companyName = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        Application app = applicationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));

        if (!app.getJob().getCompany().getName().equals(companyName)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to update this application");
        }

        try {
                app.setStatus(ApplicationStatus.valueOf(status.toUpperCase()));
        } catch (IllegalArgumentException ex) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status value");
        }

        Application savedApp = applicationRepository.save(app);

        auditService.log(
                "APPLICATION_STATUS_UPDATED",
                companyName,
                "Application ID: " + id + " changed to " + status
        );

        return savedApp;
    }

    @GetMapping("/{id}/verify")
    public String verifyApplication(@PathVariable Long id) {

        Application app = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        boolean valid = fitScoreService.verifyStoredSignature(app);

        return valid ? "VALID DATA" : "TAMPERED DATA";
    }

    @GetMapping("/analytics/top")
    public List<ApplicationResponseDTO> getTopCandidatesByJob(
            @RequestParam Long jobId
    ) {

        List<Application> applications = applicationRepository.findByJobId(jobId);

        List<ApplicationResponseDTO> response = new ArrayList<>();

        for (Application app : applications) {

                Student student = app.getStudent();

                FitScoreResponse fit = fitScoreService.calculateFitScore(student, app.getJob());

                boolean valid = fitScoreService.verifyStoredSignature(app);
                
                String studentIntegrityStatus = studentSecurityService.verifyProfileStatus(student);

                response.add(new ApplicationResponseDTO(
                        app.getId(),
                        student.getName(),
                        student.getEmail(),
                        student.getPhone(),
                        student.getCgpa(),
                        student.getSkills(),
                        student.getProjects(),
                        student.getResumeLink(),
                        student.getUniversity(),
                        student.getGraduationYear(),
                        app.getJob().getTitle(),
                        app.getJob().getCompany().getName(),
                        app.getJob().getCompany().getRole(),
                        app.getJob().getDescription(),
                        app.getJob().getRequiredSkills(),
                        fit.getScore(),
                        fit.getLevel(),
                        app.getStatus().toString(),
                        app.getSignature(),
                        valid ? "VALID DATA" : "TAMPERED DATA",
                        studentIntegrityStatus
                ));
        }

        response.sort((a, b) -> b.getFitScore() - a.getFitScore());

        return response.stream().limit(5).toList();
    }

    @GetMapping("/analytics/average/{jobId}")
    public double getAverageScore(@PathVariable Long jobId) {

        List<Application> applications = applicationRepository.findByJobId(jobId);

        if (applications.isEmpty()) return 0;

        int total = 0;

        for (Application app : applications) {
                var fit = fitScoreService.calculateFitScore(
                        app.getStudent(),
                        app.getJob()
                );
                total += fit.getScore();
        }

        return (double) total / applications.size();
    }

    @GetMapping("/analytics/selection-ratio/{jobId}")
    public double getSelectionRatio(@PathVariable Long jobId) {

        List<Application> applications = applicationRepository.findByJobId(jobId);

        if (applications.isEmpty()) return 0;

        int total = applications.size();
        int shortlisted = 0;

        for (Application app : applications) {
                if (app.getStatus() == ApplicationStatus.SHORTLISTED) {
                shortlisted++;
                }
        }

        return ((double) shortlisted / total) * 100;
    }

    @GetMapping("/analytics/status/{jobId}")
    public Object getStatusDistribution(@PathVariable Long jobId) {

        List<Application> applications = applicationRepository.findByJobId(jobId);

        int applied = 0;
        int shortlisted = 0;
        int rejected = 0;

        for (Application app : applications) {
                if (app.getStatus() == ApplicationStatus.APPLIED) applied++;
                else if (app.getStatus() == ApplicationStatus.SHORTLISTED) shortlisted++;
                else if (app.getStatus() == ApplicationStatus.REJECTED) rejected++;
        }

        return Map.of(
                "applied", applied,
                "shortlisted", shortlisted,
                "rejected", rejected,
                "total", applications.size()
        );
    }

    private boolean hasStudentRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return false;
        }

        return authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_STUDENT".equals(authority.getAuthority()));
    }

    private String currentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        return authentication.getName();
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
}