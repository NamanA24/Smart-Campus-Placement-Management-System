package com.placement.portal.dto;

public class ApplicationResponseDTO {
    private Long applicationId;
    private String studentName;
    private String studentEmail;
    private String studentPhone;
    private Double studentCgpa;
    private String studentSkills;
    private String studentProjects;
    private String studentResumeLink;
    private String studentUniversity;
    private Integer studentGraduationYear;
    private String jobTitle;
    private String companyName;
    private String companyRole;
    private String jobDescription;
    private String requiredSkills;
    private int fitScore;
    private String level;
    private String status;
    private String signature;
    private String verification;
    private String studentIntegrityStatus;

    public ApplicationResponseDTO(Long applicationId, String studentName, String jobTitle, int fitScore, String level, String status, String signature, String verification) {
        this(
                applicationId,
                studentName,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                jobTitle,
                null,
                null,
                null,
                null,
                fitScore,
                level,
                status,
                signature,
                verification,
                null
        );
    }

    public ApplicationResponseDTO(Long applicationId,
                                  String studentName,
                                  String studentEmail,
                                  String studentPhone,
                                  Double studentCgpa,
                                  String studentSkills,
                                  String studentProjects,
                                  String studentResumeLink,
                                  String studentUniversity,
                                  Integer studentGraduationYear,
                                  String jobTitle,
                                  String companyName,
                                  String companyRole,
                                  String jobDescription,
                                  String requiredSkills,
                                  int fitScore,
                                  String level,
                                  String status,
                                  String signature,
                                  String verification,
                                  String studentIntegrityStatus) {
        this.applicationId = applicationId;
        this.studentName = studentName;
        this.studentEmail = studentEmail;
        this.studentPhone = studentPhone;
        this.studentCgpa = studentCgpa;
        this.studentSkills = studentSkills;
        this.studentProjects = studentProjects;
        this.studentResumeLink = studentResumeLink;
        this.studentUniversity = studentUniversity;
        this.studentGraduationYear = studentGraduationYear;
        this.jobTitle = jobTitle;
        this.companyName = companyName;
        this.companyRole = companyRole;
        this.jobDescription = jobDescription;
        this.requiredSkills = requiredSkills;
        this.fitScore = fitScore;
        this.level = level;
        this.status = status;
        this.signature = signature;
        this.verification = verification;
        this.studentIntegrityStatus = studentIntegrityStatus;
    }

    public Long getApplicationId() {
        return applicationId;
    }

    public String getStudentName() {
        return studentName;
    }

    public String getStudentEmail() {
        return studentEmail;
    }

    public String getStudentPhone() {
        return studentPhone;
    }

    public Double getStudentCgpa() {
        return studentCgpa;
    }

    public String getStudentSkills() {
        return studentSkills;
    }

    public String getStudentProjects() {
        return studentProjects;
    }

    public String getStudentResumeLink() {
        return studentResumeLink;
    }

    public String getStudentUniversity() {
        return studentUniversity;
    }

    public Integer getStudentGraduationYear() {
        return studentGraduationYear;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public String getCompanyName() {
        return companyName;
    }

    public String getCompanyRole() {
        return companyRole;
    }

    public String getJobDescription() {
        return jobDescription;
    }

    public String getRequiredSkills() {
        return requiredSkills;
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

    public String getSignature() {
        return signature;
    }

    public String getVerification() {
        return verification;
    }

    public String getStudentIntegrityStatus() {
        return studentIntegrityStatus;
    }

    public void setStudentIntegrityStatus(String studentIntegrityStatus) {
        this.studentIntegrityStatus = studentIntegrityStatus;
    }
}
