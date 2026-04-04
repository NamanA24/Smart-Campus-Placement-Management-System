package com.placement.portal.controller;

import com.placement.portal.dto.ApplicationDTO;
import com.placement.portal.dto.ApplicationResponseDTO;
import com.placement.portal.dto.FitScoreResponse;
import com.placement.portal.entity.Application;
import com.placement.portal.entity.ApplicationStatus;
import com.placement.portal.entity.Student;
import com.placement.portal.repository.ApplicationRepository;
import com.placement.portal.service.FitScoreService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/applications")
public class ApplicationController {

    @Autowired
    private ApplicationRepository applicationRepository;

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

                        response.add(new ApplicationResponseDTO(
                                app.getId(),
                                student.getName(),
                                app.getJob().getTitle(),
                                fit.getScore(),
                                fit.getLevel(),
                                app.getStatus().toString()
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
                                app.getStatus().toString()
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

                        // 🔐 ensure company only sees its own job
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
                                app.getStatus().toString()
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

                return applicationRepository.save(app);
        }
}