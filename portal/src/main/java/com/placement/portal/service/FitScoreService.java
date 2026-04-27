package com.placement.portal.service;

import com.placement.portal.entity.Student;
import com.placement.portal.entity.Job;
import com.placement.portal.entity.Application;
import com.placement.portal.dto.FitScoreResponse;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class FitScoreService {

    private final AuditService auditService;
    private final TPUService tpuService;

    public FitScoreService(AuditService auditService, TPUService tpuService) {
        this.auditService = auditService;
        this.tpuService = tpuService;
    }

    public FitScoreResponse calculateFitScore(Student student, Job job) {

        if (student == null) {
            return new FitScoreResponse(0, "Needs Improvement", List.of(), "NO_SIGNATURE");
        }

        // Student profile strength mode (used when there is no specific job context)
        if (job == null) {
            int profileScore = calculateProfileStrength(student);
            return new FitScoreResponse(profileScore, levelFor(profileScore), List.of(), "NO_SIGNATURE");
        }

        int score = 0;
        score += scoreCgpa(student.getCgpa());

        score += scoreJobAlignment(student, job);

        score += scoreProjectRelevance(student, job);

        if (hasText(student.getResumeLink())) score += 10;

        score = Math.max(0, Math.min(100, score));

        String level = levelFor(score);

        String data = buildSignedPayload(student, job, score);

        String signature = tpuService.signData(data, student.getPrivateKey());

        auditService.log(
                "FIT_SCORE_CALCULATED",
                student.getEmail(),
                "Score: " + score + " for job: " + job.getTitle()
        );

        return new FitScoreResponse(score, level, List.of(), signature);
    }

    private int calculateProfileStrength(Student student) {
        int score = 0;

        // CGPA (50 marks in profile-only mode)
        double cgpa = student.getCgpa();
        int cgpaScore = (int) Math.round(Math.max(0, Math.min(10, cgpa)) * 5);
        score += cgpaScore;

        // Skills richness (25 marks)
        int uniqueSkillCount = tokenize(student.getSkills()).size();
        score += Math.min(25, uniqueSkillCount * 5);

        // Projects (15 marks)
        if (hasText(student.getProjects())) score += 15;

        // Resume (10 marks)
        if (hasText(student.getResumeLink())) score += 10;

        return Math.max(0, Math.min(100, score));
    }

    private int scoreCgpa(double cgpa) {
        if (cgpa >= 9.0) return 25;
        if (cgpa >= 8.0) return 22;
        if (cgpa >= 7.0) return 18;
        if (cgpa >= 6.0) return 12;
        return 6;
    }

    private int scoreJobAlignment(Student student, Job job) {
        Set<String> studentTokens = tokenize(student.getSkills());
        Set<String> jobTokens = new LinkedHashSet<>();
        jobTokens.addAll(tokenize(job.getRequiredSkills()));
        jobTokens.addAll(tokenize(job.getTitle()));
        jobTokens.addAll(tokenize(job.getDescription()));

        if (jobTokens.isEmpty()) {
            // When JD text is weak/missing, give a neutral partial score instead of zero.
            return 22;
        }

        long matches = jobTokens.stream().filter(studentTokens::contains).count();
        double ratio = (double) matches / jobTokens.size();
        return (int) Math.round(ratio * 45.0);
    }

    private int scoreProjectRelevance(Student student, Job job) {
        if (!hasText(student.getProjects())) {
            return 0;
        }

        Set<String> projectTokens = tokenize(student.getProjects());
        Set<String> jobTokens = new LinkedHashSet<>();
        jobTokens.addAll(tokenize(job.getRequiredSkills()));
        jobTokens.addAll(tokenize(job.getTitle()));
        jobTokens.addAll(tokenize(job.getDescription()));

        if (jobTokens.isEmpty()) {
            return 10;
        }

        long projectMatches = projectTokens.stream().filter(jobTokens::contains).count();
        double ratio = (double) projectMatches / jobTokens.size();
        int relevance = (int) Math.round(Math.min(1.0, ratio) * 20.0);

        // Minimum credit for having projects, even if textual overlap is low.
        return Math.max(8, relevance);
    }

    private Set<String> tokenize(String input) {
        if (!hasText(input)) {
            return Set.of();
        }

        return Arrays.stream(input.toLowerCase().split("[^a-z0-9+#.]+"))
                .map(String::trim)
                .filter(token -> token.length() > 1)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String levelFor(int score) {
        if (score >= 80) return "Excellent";
        if (score >= 60) return "Good";
        return "Needs Improvement";
    }

    // VERIFY SIGNATURE (NEW)
    public boolean verifySignature(Student student, Job job, int score, String signature) {

        String data = buildSignedPayload(student, job, score);

        return tpuService.verifyData(
                data,
                signature,
                student.getPublicKey()
        );
    }

    public String buildSignedPayload(Student student, Job job, int score) {
        return student.getEmail() + job.getTitle() + score;
    }

    public boolean verifyStoredSignature(Application app) {
        if (app == null || app.getStudent() == null) {
            return false;
        }

        String payload = app.getSignedPayload();

        if (payload == null || payload.isBlank()) {
            return false;
        }

        return tpuService.verifyData(
                payload,
                app.getSignature(),
                app.getStudent().getPublicKey()
        );
    }
}