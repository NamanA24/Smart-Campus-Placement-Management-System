package com.placement.portal.dto;

public class ApplicationDTO {

    private String studentName;
    private String jobTitle;
    private String status;

    public ApplicationDTO(String studentName, String jobTitle) {
        this.studentName = studentName;
        this.jobTitle = jobTitle;
        this.status = "APPLIED";
    }

    public ApplicationDTO(String studentName, String jobTitle, String status) {
        this.studentName = studentName;
        this.jobTitle = jobTitle;
        this.status = status;
    }

    public String getStudentName() {
        return studentName;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public String getStatus() {
        return status;
    }
}