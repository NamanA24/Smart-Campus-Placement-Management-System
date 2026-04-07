package com.placement.portal.repository;

import com.placement.portal.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CompanyRepository extends JpaRepository<Company, Long> {
	List<Company> findAllByName(String name);
}