# Secure Smart Campus Placement Management System

## 1) One-line Project Summary
This project is a full-stack campus placement platform where students, companies, placement officers, and admin users can complete the recruitment process securely. The backend is built in Java Spring Boot with JWT-based authentication, role-based authorization, profile/application integrity checks, and audit logging.

## 2) What We Built (In Simple Words)
We built a system that does these main things:

1. Student profile management
- Students can register, login, view their own profile, update profile, and re-sign profile.
- Admin can create, list, update, and delete student records.

2. Company and job management
- Admin can create companies.
- Jobs can be created and listed.

3. Applications workflow
- Students apply to jobs.
- Company can see only its own applications.
- Company can shortlist or reject candidates.
- Placement role can view complete application overview for coordination.

4. Smart Fit Score
- Candidate-job suitability is calculated from CGPA, skills match, projects, and resume availability.

5. Integrity and audit security layer
- Student profiles are cryptographically signed and verified.
- Application payloads are signed and verified.
- TPA endpoint can audit all applications and classify as VALID, TAMPERED, or UNSIGNED.
- Daily scheduled security audit writes summary logs.

## 3) Tech Stack and What Each Tech Does

### Backend runtime and framework
1. Java 17
- Core programming language used for all backend logic.

2. Spring Boot 3.5.x
- Runs the backend app quickly with auto-configuration.
- Provides REST API support, dependency injection, scheduling, and easy production packaging.

3. Spring Web
- Used to expose REST endpoints for auth, students, companies, jobs, applications, audit, and TPA.

4. Spring Data JPA + Hibernate
- Maps Java entities to MySQL tables.
- Handles CRUD and query methods through repositories.

5. Spring Security
- Protects endpoints.
- Enforces role-based access (ADMIN, STUDENT, COMPANY, PLACEMENT).

6. JWT (JJWT library)
- Stateless authentication tokens for each user session.
- Tokens contain subject + role and are checked on every request.

7. RSA (Java crypto)
- Used in two places:
  - JWT signing/verifying (RS256).
  - Data signature/verification for profile/application integrity.

### Database and tools
1. MySQL
- Stores users, companies, jobs, applications, and audit logs.

2. Maven
- Dependency and build management.

3. Spring Boot DevTools
- Faster development iteration.

4. HTTP collection files
- Ready demo and test flows for professor presentation.

## 4) Architecture (High Level)

### Layered backend architecture
1. Controller layer
- Receives HTTP requests and returns responses.

2. Service layer
- Contains business logic: fit score, cryptographic signing/verification, integrity checks, and audit workflows.

3. Repository layer
- Database access via JPA interfaces.

4. Entity/DTO layer
- Entities map to DB tables.
- DTOs shape API response objects.

5. Security layer
- JWT creation, JWT validation filter, endpoint authorization rules.

6. Utility layer
- RSA helper methods for key generation/sign/verify/encode/decode.

## 5) Request Flow (End-to-End)

### A) Login flow
1. User calls auth login endpoint.
2. Backend validates credentials by role.
3. Backend issues RSA-signed JWT token containing role claim.
4. Client sends token in Authorization header for later requests.

### B) Protected request flow
1. JwtFilter reads token from header.
2. Token is verified using public key.
3. Role is extracted and converted to Spring authority.
4. SecurityConfig checks if role is allowed for endpoint.
5. Controller executes only when authorization passes.

### C) Student profile integrity flow
1. On create/register/update/resign, profile payload is generated from important profile fields.
2. Payload is signed using student private key.
3. Signature and signed payload are stored.
4. On read/check, payload is rebuilt and compared.
5. Signature is verified using student public key.
6. Final integrity status becomes CLEAN, TAMPERED, or UNSIGNED.

### D) Application integrity flow
1. Student applies to a job.
2. Fit score is calculated.
3. Signed payload is built from student email + job title + score.
4. Signature is generated and stored with the application.
5. Company/TPA later verifies signature against stored payload.
6. Invalid/tampered signatures are flagged.

## 6) How RSA, TPU, and TPA Are Integrated

### Important clarification for viva/presentation
In this implementation, TPU and TPA are implemented as application services (software modules), not external hardware appliances.

### TPU integration (Trusted Processing Unit concept)
Implemented through:
- [TPUService.java](portal/src/main/java/com/placement/portal/service/TPUService.java)
- [RSAUtil.java](portal/src/main/java/com/placement/portal/util/RSAUtil.java)

Responsibilities:
1. Generates RSA key pairs.
2. Encodes/decodes keys for DB storage.
3. Signs data with private key.
4. Verifies signatures with public key.
5. Provides SHA-256 hashing helper.

Usage:
1. Student profile signing and verification.
2. Application payload signing and verification.
3. Trust layer for fit-score integrity.

### TPA integration (Third Party Auditor concept)
Implemented through:
- [TPAService.java](portal/src/main/java/com/placement/portal/service/TPAService.java)
- [TPAController.java](portal/src/main/java/com/placement/portal/controller/TPAController.java)

Responsibilities:
1. Iterates through all applications.
2. Checks payload and signature availability.
3. Verifies signatures with student public keys.
4. Returns audit result per application as VALID, TAMPERED, or UNSIGNED.

### Student integrity bridge service
Implemented through:
- [StudentSecurityService.java](portal/src/main/java/com/placement/portal/service/StudentSecurityService.java)

Responsibilities:
1. Ensures key pair exists for student.
2. Builds canonical profile payload.
3. Signs and stores profile proof.
4. Verifies and reports profile integrity status.

## 7) Security Design in This Project

### Authentication and authorization
1. JWT-based stateless authentication.
2. Role-based endpoint controls in security config.
3. Unauthorized access blocked by filter/security chain.

### Password security
1. Passwords are encoded using BCrypt before storing.
2. Plain passwords are never returned in API responses.

### Data integrity and anti-tamper
1. Student profile signatures detect unauthorized profile edits.
2. Application signatures detect application payload manipulation.
3. TPA endpoint provides explicit tamper audit.
4. Scheduler runs daily security audit and stores findings.

### Auditability
1. Business/security actions are persisted as audit logs.
2. Logs include action name, actor, details, timestamp.

### Practical note for presentation honesty
There are a few implementation trade-offs to mention professionally:
1. Student private key is currently stored in database (hidden from JSON responses), which is fine for demo but should move to secure key management in production.
2. application.properties currently includes local DB credentials and default dev accounts; production should use environment secrets.
3. JWT token validity is currently 1 hour and can be tuned.

## 8) Java and Spring Features Used

1. Java features
- OOP with classes, encapsulation, enums.
- Exception handling.
- Streams and collection APIs.
- LocalDateTime and time APIs.
- Java Cryptography APIs (RSA, Signature, SHA-256, KeyFactory).

2. Spring features
- @SpringBootApplication bootstrapping.
- @RestController and request mapping annotations.
- @Service and @Component beans.
- Constructor and field injection.
- @Scheduled periodic jobs.
- Spring Security filter chain customization.
- JPA repositories with derived query methods.

3. Persistence features
- @Entity, @Id, @GeneratedValue, relationships (@ManyToOne).
- @Enumerated for ApplicationStatus.
- @Lob and column definitions for large text fields.
- @Transient fields for computed response values.

## 9) Backend File-by-File Explanation (Frontend Excluded)

## Root/Backend Setup Files
1. [portal/pom.xml](portal/pom.xml)
- Maven build config, dependencies, Java version, plugins.

2. [portal/src/main/resources/application.properties](portal/src/main/resources/application.properties)
- App name, DB config, JPA settings, JWT secret property, default admin/placement credentials.

3. [portal/HELP.md](portal/HELP.md)
- Spring starter reference notes.

4. [portal/test.http](portal/test.http)
- Complete end-to-end live demo and security test script.

5. [portal/test-old.http](portal/test-old.http)
- Older/manual API test script.

6. [portal/src/test/java/com/placement/portal/PortalApplicationTests.java](portal/src/test/java/com/placement/portal/PortalApplicationTests.java)
- Basic Spring context load test.

## Application Entry
1. [portal/src/main/java/com/placement/portal/PortalApplication.java](portal/src/main/java/com/placement/portal/PortalApplication.java)
- Main entry point, enables scheduling.

## Security Package
1. [portal/src/main/java/com/placement/portal/config/SecurityConfig.java](portal/src/main/java/com/placement/portal/config/SecurityConfig.java)
- CORS config, CSRF off for API mode, endpoint role matrix, JWT filter registration, BCrypt bean.

2. [portal/src/main/java/com/placement/portal/security/JwtUtil.java](portal/src/main/java/com/placement/portal/security/JwtUtil.java)
- Loads/generates RSA key pair for JWT, issues tokens, extracts claims, validates token.

3. [portal/src/main/java/com/placement/portal/security/JwtFilter.java](portal/src/main/java/com/placement/portal/security/JwtFilter.java)
- Intercepts requests, validates bearer token, injects authenticated principal and role.

## Controllers
1. [portal/src/main/java/com/placement/portal/controller/AuthController.java](portal/src/main/java/com/placement/portal/controller/AuthController.java)
- Login for all roles, student self-registration, duplicate profile checks, password setup, audit logging.

2. [portal/src/main/java/com/placement/portal/controller/StudentController.java](portal/src/main/java/com/placement/portal/controller/StudentController.java)
- Student CRUD/admin operations, self profile view/update/resign, fit score endpoint, integrity status projection.

3. [portal/src/main/java/com/placement/portal/controller/CompanyController.java](portal/src/main/java/com/placement/portal/controller/CompanyController.java)
- Create/list companies with password encoding.

4. [portal/src/main/java/com/placement/portal/controller/JobController.java](portal/src/main/java/com/placement/portal/controller/JobController.java)
- Create/list jobs.

5. [portal/src/main/java/com/placement/portal/controller/ApplicationController.java](portal/src/main/java/com/placement/portal/controller/ApplicationController.java)
- Apply flow, student/company/placement views, shortlist/update status, signature verification, analytics endpoints.

6. [portal/src/main/java/com/placement/portal/controller/AuditController.java](portal/src/main/java/com/placement/portal/controller/AuditController.java)
- Returns persisted audit logs.

7. [portal/src/main/java/com/placement/portal/controller/TPAController.java](portal/src/main/java/com/placement/portal/controller/TPAController.java)
- Runs full TPA audit on demand.

## Services
1. [portal/src/main/java/com/placement/portal/service/FitScoreService.java](portal/src/main/java/com/placement/portal/service/FitScoreService.java)
- Score calculation rules + score level + application payload signing/verification.

2. [portal/src/main/java/com/placement/portal/service/TPUService.java](portal/src/main/java/com/placement/portal/service/TPUService.java)
- Crypto wrapper for keys, hash, sign, verify.

3. [portal/src/main/java/com/placement/portal/service/TPAService.java](portal/src/main/java/com/placement/portal/service/TPAService.java)
- Independent auditor over all applications.

4. [portal/src/main/java/com/placement/portal/service/StudentSecurityService.java](portal/src/main/java/com/placement/portal/service/StudentSecurityService.java)
- Student profile payload creation, sign/verify logic, integrity result.

5. [portal/src/main/java/com/placement/portal/service/AuditService.java](portal/src/main/java/com/placement/portal/service/AuditService.java)
- Central helper for writing audit events.

6. [portal/src/main/java/com/placement/portal/service/SecurityAuditScheduler.java](portal/src/main/java/com/placement/portal/service/SecurityAuditScheduler.java)
- Daily automatic integrity + application audit summary runner.

## Utility
1. [portal/src/main/java/com/placement/portal/util/RSAUtil.java](portal/src/main/java/com/placement/portal/util/RSAUtil.java)
- Low-level RSA functions and Base64 key conversion helpers.

## Repositories
1. [portal/src/main/java/com/placement/portal/repository/StudentRepository.java](portal/src/main/java/com/placement/portal/repository/StudentRepository.java)
- Student DB access and email-based lookups.

2. [portal/src/main/java/com/placement/portal/repository/CompanyRepository.java](portal/src/main/java/com/placement/portal/repository/CompanyRepository.java)
- Company DB access and name-based lookup.

3. [portal/src/main/java/com/placement/portal/repository/JobRepository.java](portal/src/main/java/com/placement/portal/repository/JobRepository.java)
- Job DB access.

4. [portal/src/main/java/com/placement/portal/repository/ApplicationRepository.java](portal/src/main/java/com/placement/portal/repository/ApplicationRepository.java)
- Application queries by company, student email, and job.

5. [portal/src/main/java/com/placement/portal/repository/AuditLogRepository.java](portal/src/main/java/com/placement/portal/repository/AuditLogRepository.java)
- Audit log persistence.

## Entities
1. [portal/src/main/java/com/placement/portal/entity/Student.java](portal/src/main/java/com/placement/portal/entity/Student.java)
- Student data + cryptographic fields (keys/signature/payload) + transient integrity status.

2. [portal/src/main/java/com/placement/portal/entity/Company.java](portal/src/main/java/com/placement/portal/entity/Company.java)
- Company identity and recruitment metadata.

3. [portal/src/main/java/com/placement/portal/entity/Job.java](portal/src/main/java/com/placement/portal/entity/Job.java)
- Job posting and required skills, linked to company.

4. [portal/src/main/java/com/placement/portal/entity/Application.java](portal/src/main/java/com/placement/portal/entity/Application.java)
- Student-job mapping, status, signed payload/signature/signed score.

5. [portal/src/main/java/com/placement/portal/entity/AuditLog.java](portal/src/main/java/com/placement/portal/entity/AuditLog.java)
- Action trail entity with timestamp.

6. [portal/src/main/java/com/placement/portal/entity/ApplicationStatus.java](portal/src/main/java/com/placement/portal/entity/ApplicationStatus.java)
- Enum values: APPLIED, SHORTLISTED, REJECTED.

## DTOs
1. [portal/src/main/java/com/placement/portal/dto/ApplicationDTO.java](portal/src/main/java/com/placement/portal/dto/ApplicationDTO.java)
- Lightweight application view for listing endpoints.

2. [portal/src/main/java/com/placement/portal/dto/ApplicationResponseDTO.java](portal/src/main/java/com/placement/portal/dto/ApplicationResponseDTO.java)
- Rich company-facing response with score and verification label.

3. [portal/src/main/java/com/placement/portal/dto/FitScoreResponse.java](portal/src/main/java/com/placement/portal/dto/FitScoreResponse.java)
- Fit score API contract.

## 10) Professor Demo Script (Suggested Narrative)
Use this exact storyline while presenting:

1. Problem statement
- Manual placements are slow and insecure; our system centralizes and secures it.

2. Architecture
- Explain controller-service-repository layering and role-based security.

3. Authentication
- Show login endpoint returning JWT.
- Show protected endpoint failing without token.

4. Student lifecycle
- Create/register student.
- Show profile with integrityStatus = CLEAN.
- Update student profile and show re-sign behavior.

5. Application lifecycle
- Student applies to a job.
- Show signed payload/signature stored.
- Company views applications and sees verification state.

6. Tamper-proofing demo
- Tamper profile data directly in DB.
- Show integrityStatus = TAMPERED.
- Show apply blocked.
- Re-sign profile and recover to CLEAN.

7. Auditor demo
- Run /tpa/audit and explain VALID/TAMPERED/UNSIGNED.

8. Closing
- Summarize security, auditability, and clear role separation.

## 11) Current Known Behavior Notes (Good to Mention if Asked)
1. Applications created in older/legacy ways may show UNSIGNED in TPA audit.
2. If profile data changes after signing and before re-signing, status becomes TAMPERED by design.
3. Duplicate student/company identity conflicts are guarded and return conflict errors.

## 12) 30-second Conclusion for Viva
We built a secure, role-based placement management backend in Java Spring Boot with JWT authentication, BCrypt passwords, cryptographic integrity checks on profiles and applications using RSA signatures, and TPA-style auditing with scheduled security reports. The system is modular, testable, and production-extendable, with clear separation between API, business logic, and persistence layers.
