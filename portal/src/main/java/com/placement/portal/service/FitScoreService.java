package com.placement.portal.service;

import com.placement.portal.entity.Student;
import com.placement.portal.dto.FitScoreResponse;
import org.springframework.stereotype.Service;
import com.placement.portal.entity.Job;
import java.util.List;

@Service
public class FitScoreService {

    public FitScoreResponse calculateFitScore(Student student, Job job) {

        if (student == null || job == null) {
            return new FitScoreResponse(50, "Basic", List.of());
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

        // Level
        String level;
        if (score >= 80) level = "Excellent";
        else if (score >= 60) level = "Good";
        else level = "Needs Improvement";

        return new FitScoreResponse(score, level, List.of());
    }
}