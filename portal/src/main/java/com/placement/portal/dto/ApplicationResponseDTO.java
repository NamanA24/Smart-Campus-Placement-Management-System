package com.placement.portal.dto;

public class ApplicationResponseDTO {
    private Long applicationId;
    private String studentName;
    private String jobTitle;
    private int fitScore;
    private String level;
    private String status;
    private String hash;
    private String verification;

    public ApplicationResponseDTO(Long applicationId, String studentName, String jobTitle, int fitScore, String level, String status, String hash, String verification) {
        this.applicationId = applicationId;
        this.studentName = studentName;
        this.jobTitle = jobTitle;
        this.fitScore = fitScore;
        this.level = level;
        this.status = status;
        this.hash = hash;
        this.verification = verification;
    }

    public Long getApplicationId() {
        return applicationId;
    }

    public String getStudentName() {
        return studentName;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public int getFitScore() {
        return fitScore;
    }

    public String getLevel() {
        return level;
    }

    public String getStatus() {
        return status;
    }

    public String getHash() {
        return hash;
    }

    public String getVerification() {
        return verification;
    }
}
