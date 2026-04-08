package com.placement.portal.dto;

public class StudentPlacementDTO {
    private Long id;
    private String name;
    private double cgpa;
    private String skills;
    private String projects;
    private String resumeLink;
    private int graduationYear;
    private String university;
    private String gender;
    private String phone;
    private String email;

    public StudentPlacementDTO(Long id,
                               String name,
                               double cgpa,
                               String skills,
                               String projects,
                               String resumeLink,
                               int graduationYear,
                               String university,
                               String gender,
                               String phone,
                               String email) {
        this.id = id;
        this.name = name;
        this.cgpa = cgpa;
        this.skills = skills;
        this.projects = projects;
        this.resumeLink = resumeLink;
        this.graduationYear = graduationYear;
        this.university = university;
        this.gender = gender;
        this.phone = phone;
        this.email = email;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public double getCgpa() { return cgpa; }
    public String getSkills() { return skills; }
    public String getProjects() { return projects; }
    public String getResumeLink() { return resumeLink; }
    public int getGraduationYear() { return graduationYear; }
    public String getUniversity() { return university; }
    public String getGender() { return gender; }
    public String getPhone() { return phone; }
    public String getEmail() { return email; }
}
