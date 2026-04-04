package com.placement.portal.dto;

public class ApplicationDTO {

    private String studentName;
    private String jobTitle;

    public ApplicationDTO(String studentName, String jobTitle) {
        this.studentName = studentName;
        this.jobTitle = jobTitle;
    }

    public String getStudentName() {
        return studentName;
    }

    public String getJobTitle() {
        return jobTitle;
    }
}