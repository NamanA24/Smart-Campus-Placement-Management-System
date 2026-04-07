package com.placement.portal.entity;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.*;

@Entity
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Student student;

    @ManyToOne
    private Job job;

    // Getters & Setters
    public Long getId() { return id; }

    public Student getStudent() { return student; }
    public void setStudent(Student student) { this.student = student; }

    public Job getJob() { return job; }
    public void setJob(Job job) { this.job = job; }

    public ApplicationStatus getStatus() { return status; }
    public void setStatus(ApplicationStatus status) { this.status = status; }

    @Lob
    @Column(columnDefinition = "TEXT")
    private String signature;
    public String getSignature() { return signature; }
    public void setSignature(String signature) { this.signature = signature; }  

    @Lob
    @Column(columnDefinition = "TEXT")
    private String signedPayload;
    public String getSignedPayload() { return signedPayload; }
    public void setSignedPayload(String signedPayload) { this.signedPayload = signedPayload; }

    private Integer signedScore;
    public Integer getSignedScore() { return signedScore; }
    public void setSignedScore(Integer signedScore) { this.signedScore = signedScore; }

    @Enumerated(EnumType.STRING)
    private ApplicationStatus status = ApplicationStatus.APPLIED;
}