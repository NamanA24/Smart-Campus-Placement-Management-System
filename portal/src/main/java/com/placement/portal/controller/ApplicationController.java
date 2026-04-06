package com.placement.portal.controller;

import com.placement.portal.dto.ApplicationDTO;
import com.placement.portal.dto.ApplicationResponseDTO;
import com.placement.portal.dto.FitScoreResponse;
import com.placement.portal.entity.Application;
import com.placement.portal.entity.ApplicationStatus;
import com.placement.portal.entity.Student;
import com.placement.portal.repository.ApplicationRepository;
import com.placement.portal.service.AuditService;
import com.placement.portal.service.FitScoreService;
import com.placement.portal.entity.Job;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
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
    private AuditService auditService;

    // APPLY TO JOB
    @PostMapping
    public Application apply(@RequestBody Application application) {
        return applicationRepository.save(application);
    }

    // VIEW ALL APPLICATIONS
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
                        app.getJob().getTitle()
                ))
                .toList();
    }

    @GetMapping("/me")
    public List<ApplicationDTO> getMyApplications() {

        String username = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        List<Application> applications =
                applicationRepository.findByStudentEmail(username);

        return applications.stream()
                .map(app -> new ApplicationDTO(
                        app.getStudent().getName(),
                        app.getJob().getTitle()
                ))
                .toList();
    }

   @Autowired
   private FitScoreService fitScoreService;

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

                        // calculate fit score
                        FitScoreResponse fit = fitScoreService.calculateFitScore(student, app.getJob());
                        app.setSignature(fit.getSignature()); // store signature in application for later verification
                        applicationRepository.save(app); // save updated application with signature

                        boolean valid = fitScoreService.verifySignature(
                                student,
                                app.getJob(),
                                fit.getScore(),
                                app.getSignature()
                        );

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
                                app.getJob().getTitle(),
                                fit.getScore(),
                                fit.getLevel(),
                                app.getStatus().toString(),
                                fit.getSignature(),
                                valid ? "VALID DATA" : "TAMPERED DATA"
                        ));
                }

                // SORT BY SCORE (DESCENDING)
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

                        response.add(new ApplicationResponseDTO(
                                app.getId(),
                                student.getName(),
                                app.getJob().getTitle(),
                                fit.getScore(),
                                fit.getLevel(),
                                app.getStatus().toString(),
                                fit.getSignature(),
                                fitScoreService.verifySignature(
                                        student,
                                        app.getJob(),
                                        fit.getScore(),
                                        app.getSignature()
                                ) ? "VALID DATA" : "TAMPERED DATA"
                        ));
                }

                // SORT DESCENDING
                response.sort((a, b) -> b.getFitScore() - a.getFitScore());

                // RETURN TOP 5 ONLY
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

                        // ensure company only sees its own job
                        if (!app.getJob().getCompany().getName().equals(companyName)) {
                        continue;
                        }

                        Student student = app.getStudent();

                        var fit = fitScoreService.calculateFitScore(student, app.getJob());

                        // apply minScore filter
                        if (fit.getScore() >= minScore) {
                                response.add(new ApplicationResponseDTO(
                                        app.getId(),
                                        student.getName(),
                                        app.getJob().getTitle(),
                                        fit.getScore(),
                                        fit.getLevel(),
                                        app.getStatus().toString(),
                                        fit.getSignature(),
                                        fitScoreService.verifySignature(
                                                student,
                                                app.getJob(),
                                                fit.getScore(),
                                                app.getSignature()
                                        ) ? "VALID DATA" : "TAMPERED DATA"

                                ));
                        }
                }

                //sort descending
                response.sort((a, b) -> b.getFitScore() - a.getFitScore());

                //limit results
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

                // ADD THIS BLOCK
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

                Student student = app.getStudent();
                Job job = app.getJob();

                // recalculate score
                int score = fitScoreService.calculateFitScore(student, job).getScore();

                // compare with STORED hash
                boolean valid = fitScoreService.verifySignature(
                        student,
                        job,
                        score,
                        app.getSignature()
                );

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

                        boolean valid = fitScoreService.verifySignature(
                                student,
                                app.getJob(),
                                fit.getScore(),
                                app.getSignature()
                        );

                        response.add(new ApplicationResponseDTO(
                                app.getId(),
                                student.getName(),
                                app.getJob().getTitle(),
                                fit.getScore(),
                                fit.getLevel(),
                                app.getStatus().toString(),
                                fit.getSignature(),
                                valid ? "VALID DATA" : "TAMPERED DATA"
                        ));
                }

                // sort by score (descending)
                response.sort((a, b) -> b.getFitScore() - a.getFitScore());

                // return top 5
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
}