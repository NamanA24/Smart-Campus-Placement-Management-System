package com.placement.portal.service;

import com.placement.portal.entity.AuditLog;
import com.placement.portal.entity.Student;
import com.placement.portal.repository.AuditLogRepository;
import com.placement.portal.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SecurityAuditScheduler {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private StudentSecurityService studentSecurityService;

    @Autowired
    private TPAService tpaService;

    @Autowired
    private AuditLogRepository auditLogRepository;

    // Daily security check at midnight (0 0 0 * * *)
    @Scheduled(cron = "0 0 0 * * *")
    public void performDailySecurityAudit() {
        try {
            String auditLog = "=== DAILY SECURITY AUDIT ===\n";
            auditLog += "Timestamp: " + LocalDateTime.now() + "\n\n";

            // Check all student profiles
            List<Student> allStudents = studentRepository.findAll();
            int tamperedCount = 0;
            int cleanCount = 0;
            int unsignedCount = 0;

            auditLog += "--- Student Profile Verification ---\n";
            for (Student student : allStudents) {
                String status = studentSecurityService.verifyProfileStatus(student);
                auditLog += "Student ID " + student.getId() + " (" + student.getEmail() + "): " + status + "\n";

                if ("TAMPERED".equals(status)) {
                    tamperedCount++;
                } else if ("CLEAN".equals(status)) {
                    cleanCount++;
                } else if ("UNSIGNED".equals(status)) {
                    unsignedCount++;
                }
            }

            // Check all applications
            List<String> appAuditResults = tpaService.auditAllApplications();
            auditLog += "\n--- Application Verification ---\n";
            for (String result : appAuditResults) {
                auditLog += result + "\n";
            }

            // Summary
            auditLog += "\n--- Summary ---\n";
            auditLog += "Profiles Checked: " + allStudents.size() + "\n";
            auditLog += "Clean: " + cleanCount + "\n";
            auditLog += "Tampered: " + tamperedCount + "\n";
            auditLog += "Unsigned: " + unsignedCount + "\n";

            // Log to database
            AuditLog audit = new AuditLog();
            audit.setAction("DAILY_SECURITY_AUDIT");
            audit.setDetails(auditLog);
            audit.setPerformedBy("SYSTEM");
            auditLogRepository.save(audit);

            System.out.println("[SECURITY AUDIT] " + auditLog);

        } catch (Exception e) {
            AuditLog errorAudit = new AuditLog();
            errorAudit.setAction("DAILY_SECURITY_AUDIT");
            errorAudit.setDetails("Audit failed: " + e.getMessage());
            errorAudit.setPerformedBy("SYSTEM");
            auditLogRepository.save(errorAudit);
            System.err.println("[SECURITY AUDIT ERROR] " + e.getMessage());
        }
    }
}
