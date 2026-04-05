package com.placement.portal.service;

import com.placement.portal.entity.AuditLog;
import com.placement.portal.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(String action, String user, String details) {
        AuditLog log = new AuditLog();
        log.setAction(action);
        log.setPerformedBy(user);
        log.setDetails(details);

        auditLogRepository.save(log);
    }
}