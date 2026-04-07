package com.placement.portal.service;

import com.placement.portal.entity.Application;
import com.placement.portal.entity.Student;
import com.placement.portal.repository.ApplicationRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class TPAService {

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private TPUService tpuService;

    public List<String> auditAllApplications() {

        List<Application> applications = applicationRepository.findAll();

        List<String> results = new ArrayList<>();

        for (Application app : applications) {

            try {
                Student student = app.getStudent();
                String payload = app.getSignedPayload();
                String signature = app.getSignature();

                if (signature == null || signature.isBlank() || "NO_SIGNATURE".equals(signature)) {
                    results.add("Application ID " + app.getId() + " -> UNSIGNED");
                    continue;
                }

                if (payload == null || payload.isBlank()) {
                    results.add("Application ID " + app.getId() + " -> UNSIGNED (LEGACY)");
                    continue;
                }

                // Verify signature
                boolean valid = tpuService.verifyData(
                        payload,
                        signature,
                        student.getPublicKey()
                );

                if (valid) {
                    results.add("Application ID " + app.getId() + " → VALID");
                } else {
                    results.add("Application ID " + app.getId() + " → TAMPERED");
                }

            } catch (Exception e) {
                results.add("Application ID " + app.getId() + " → ERROR");
            }
        }

        return results;
    }
}