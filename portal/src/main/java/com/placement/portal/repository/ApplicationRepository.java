package com.placement.portal.repository;

import com.placement.portal.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ApplicationRepository extends JpaRepository<Application, Long> {

    List<Application> findByJobCompanyName(String name);
    List<Application> findByStudentEmail(String email);
    List<Application> findByJobId(Long jobId);
}