package com.placement.portal.service;

import com.placement.portal.entity.Student;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class StudentSecurityService {

    private final TPUService tpuService;

    public StudentSecurityService(TPUService tpuService) {
        this.tpuService = tpuService;
    }

    public void ensureKeys(Student student) {
        if (student.getPublicKey() != null && student.getPrivateKey() != null) {
            return;
        }

        var keyPair = tpuService.generateKeys();
        student.setPublicKey(tpuService.encodePublicKey(keyPair.getPublic()));
        student.setPrivateKey(tpuService.encodePrivateKey(keyPair.getPrivate()));
    }

    public String buildProfilePayload(Student student) {
        return "name=" + safe(student.getName()) + "\n"
                + "email=" + safe(student.getEmail()) + "\n"
                + "branch=" + safe(student.getBranch()) + "\n"
                + "cgpa=" + student.getCgpa() + "\n"
                + "skills=" + safe(student.getSkills()) + "\n"
                + "projects=" + safe(student.getProjects()) + "\n"
                + "resumeLink=" + safe(student.getResumeLink()) + "\n"
                + "phone=" + safe(student.getPhone()) + "\n"
                + "university=" + safe(student.getUniversity()) + "\n"
                + "graduationYear=" + student.getGraduationYear();
    }

    public void signProfile(Student student) {
        ensureKeys(student);

        String payload = buildProfilePayload(student);
        String signature = tpuService.signData(payload, student.getPrivateKey());

        student.setSignedPayload(payload);
        student.setSignature(signature);
        student.setSignedAt(LocalDateTime.now());
        student.setIntegrityStatus("CLEAN");
    }

    public String verifyProfileStatus(Student student) {
        if (student == null) {
            return "TAMPERED";
        }

        if (student.getSignature() == null || student.getSignature().isBlank()) {
            return "UNSIGNED";
        }

        if (student.getSignedPayload() == null || student.getSignedPayload().isBlank()) {
            return "UNSIGNED";
        }

        String currentPayload = buildProfilePayload(student);
        if (!currentPayload.equals(student.getSignedPayload())) {
            return "TAMPERED";
        }

        boolean valid = tpuService.verifyData(
                currentPayload,
                student.getSignature(),
                student.getPublicKey()
        );

        return valid ? "CLEAN" : "TAMPERED";
    }

    public boolean isProfileClean(Student student) {
        return "CLEAN".equals(verifyProfileStatus(student));
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }
}