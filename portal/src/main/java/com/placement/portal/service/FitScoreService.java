package com.placement.portal.service;

import com.placement.portal.entity.Student;
import com.placement.portal.entity.Job;
import com.placement.portal.dto.FitScoreResponse;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FitScoreService {

    private final AuditService auditService;

    public FitScoreService(AuditService auditService) {
        this.auditService = auditService;
    }

    public FitScoreResponse calculateFitScore(Student student, Job job) {

        // ✅ Fallback case
        if (student == null || job == null) {
            String fallbackHash = generateHash("default");
            return new FitScoreResponse(50, "Basic", List.of(), fallbackHash);
        }

        int score = 0;

        // 1. CGPA (30 marks)
        if (student.getCgpa() >= 8.5) score += 30;
        else if (student.getCgpa() >= 7) score += 20;
        else score += 10;

        // 2. Skills match (40 marks)
        String studentSkills = student.getSkills() == null
                ? ""
                : student.getSkills().toLowerCase();

        String requiredSkills = job.getRequiredSkills();

        if (requiredSkills != null && !requiredSkills.isBlank()) {
            String[] jobSkillList = requiredSkills.toLowerCase().split(",");
            int matchCount = 0;

            for (String skill : jobSkillList) {
                String normalized = skill.trim();
                if (!normalized.isEmpty() && studentSkills.contains(normalized)) {
                    matchCount++;
                }
            }

            int skillScore = (int) (((double) matchCount / jobSkillList.length) * 40);
            score += skillScore;
        }

        // 3. Projects (20 marks)
        if (student.getProjects() != null && !student.getProjects().isEmpty()) {
            score += 20;
        }

        // 4. Resume (10 marks)
        if (student.getResumeLink() != null && !student.getResumeLink().isEmpty()) {
            score += 10;
        }

        // Level determination
        String level;
        if (score >= 80) level = "Excellent";
        else if (score >= 60) level = "Good";
        else level = "Needs Improvement";

        // 🔐 TPU: Generate hash
        String data = student.getEmail() + "|" + job.getTitle() + "|" + score;
        String hash = generateHash(data);

        // 🧾 TPA: Audit log
        auditService.log(
                "FIT_SCORE_CALCULATED",
                student.getEmail(),
                "Score: " + score + " for job: " + job.getTitle()
        );

        return new FitScoreResponse(score, level, List.of(), hash);
    }

    // Hash generator (SHA-256)
    private String generateHash(String data) {
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = md.digest(data.getBytes());
            StringBuilder hex = new StringBuilder();

            for (byte b : hashBytes) {
                hex.append(String.format("%02x", b));
            }

            return hex.toString();
        } catch (Exception e) {
            throw new RuntimeException("Hash generation failed");
        }
    }

    public boolean verifyHash(Student student, Job job, int score, String hash) {

        String recalculated = generateHash(
                student.getEmail() + "|" + job.getTitle() + "|" + score
        );

        return recalculated.equals(hash);
    }
}