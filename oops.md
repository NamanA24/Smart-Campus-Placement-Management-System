# OOP Concepts Used in This Project

This document explains the Object-Oriented Programming concepts used in this Placement Portal project, with direct file references.

## 1. Encapsulation

Encapsulation means keeping data and logic inside classes, and controlling access through methods.

### Where used
- Student entity with private fields and getters/setters: [Student](portal/src/main/java/com/placement/portal/entity/Student.java)
- Company entity with private fields and getters/setters: [Company](portal/src/main/java/com/placement/portal/entity/Company.java)
- Application entity with private fields and getters/setters: [Application](portal/src/main/java/com/placement/portal/entity/Application.java)
- Service dependencies stored as private members (constructor/field injection): [AuthController](portal/src/main/java/com/placement/portal/controller/AuthController.java), [FitScoreService](portal/src/main/java/com/placement/portal/service/FitScoreService.java), [StudentSecurityService](portal/src/main/java/com/placement/portal/service/StudentSecurityService.java)

### Why it matters here
- Prevents direct uncontrolled modification of model state.
- Keeps security-sensitive fields (like signatures/keys) managed through class methods.

## 2. Inheritance

Inheritance means one class reuses and extends behavior from another class.

### Where used
- JWT filter extends Spring Security base filter class: [JwtFilter](portal/src/main/java/com/placement/portal/security/JwtFilter.java)
  - `JwtFilter extends OncePerRequestFilter`
- Repository interfaces extend Spring Data JPA base repository:
  - [StudentRepository](portal/src/main/java/com/placement/portal/repository/StudentRepository.java)
  - [ApplicationRepository](portal/src/main/java/com/placement/portal/repository/ApplicationRepository.java)
  - Similar pattern exists for other repositories in the project.

### Why it matters here
- Reduces boilerplate for authentication filters.
- Gives CRUD and query infrastructure automatically to repositories.

## 3. Abstraction

Abstraction means hiding implementation details behind clean interfaces/layers.

### Where used
- Controller layer delegates business logic to services:
  - [StudentController](portal/src/main/java/com/placement/portal/controller/StudentController.java)
  - [AuthController](portal/src/main/java/com/placement/portal/controller/AuthController.java)
- Service layer encapsulates domain logic:
  - [FitScoreService](portal/src/main/java/com/placement/portal/service/FitScoreService.java)
  - [StudentSecurityService](portal/src/main/java/com/placement/portal/service/StudentSecurityService.java)
  - [TPAService](portal/src/main/java/com/placement/portal/service/TPAService.java)
- Repository interfaces abstract data access:
  - [StudentRepository](portal/src/main/java/com/placement/portal/repository/StudentRepository.java)
  - [ApplicationRepository](portal/src/main/java/com/placement/portal/repository/ApplicationRepository.java)
- DTOs abstract API response shapes:
  - [FitScoreResponse](portal/src/main/java/com/placement/portal/dto/FitScoreResponse.java)
  - [ApplicationResponseDTO](portal/src/main/java/com/placement/portal/dto/ApplicationResponseDTO.java)

### Why it matters here
- Keeps controllers simple and focused on HTTP flow.
- Makes business logic reusable and easier to test.

## 4. Polymorphism

Polymorphism means the same interface/base type can behave differently depending on the actual implementation.

### Where used
- Method overriding in security filter:
  - [JwtFilter](portal/src/main/java/com/placement/portal/security/JwtFilter.java)
  - Overrides `doFilterInternal(...)` from `OncePerRequestFilter`.
- Interface-based polymorphism for password encoding:
  - `PasswordEncoder` type used in controllers and config.
  - Concrete implementation returned as `BCryptPasswordEncoder` in [SecurityConfig](portal/src/main/java/com/placement/portal/config/SecurityConfig.java).
- Spring Data repositories are interface types with runtime-generated implementations:
  - [StudentRepository](portal/src/main/java/com/placement/portal/repository/StudentRepository.java)
  - [ApplicationRepository](portal/src/main/java/com/placement/portal/repository/ApplicationRepository.java)

### Why it matters here
- Promotes flexible architecture and easy replacement of implementations.
- Integrates cleanly with Spring dependency injection.

## 5. Composition and Association

Composition/association means classes are connected and work together by holding references to other objects.

### Where used
- Entity relationships (JPA association):
  - `Application` has `Student` and `Job` (`@ManyToOne`): [Application](portal/src/main/java/com/placement/portal/entity/Application.java)
  - `Job` has `Company` (`@ManyToOne`): [Job](portal/src/main/java/com/placement/portal/entity/Job.java)
- Service composition through DI (has-a relationships):
  - [AuthController](portal/src/main/java/com/placement/portal/controller/AuthController.java)
  - [StudentController](portal/src/main/java/com/placement/portal/controller/StudentController.java)
  - [FitScoreService](portal/src/main/java/com/placement/portal/service/FitScoreService.java)
  - [TPAService](portal/src/main/java/com/placement/portal/service/TPAService.java)

### Why it matters here
- Models real domain relationships (student applies to job, job belongs to company).
- Keeps features modular by composing services instead of large monolithic classes.

## 6. Enum-Based Domain Modeling

Enums represent fixed sets of values and improve readability and safety.

### Where used
- Application status enum: [ApplicationStatus](portal/src/main/java/com/placement/portal/entity/ApplicationStatus.java)
- Enum is used in Application entity field with `@Enumerated`: [Application](portal/src/main/java/com/placement/portal/entity/Application.java)

### Why it matters here
- Prevents invalid status strings.
- Makes status transitions clearer in business logic and API responses.

## 7. Interface-Based Modeling in Frontend (TypeScript)

TypeScript interfaces provide object-oriented style contracts for data models.

### Where used
- Domain model interfaces: [models.ts](frontend/src/types/models.ts)

### Why it matters here
- Enforces consistent data shapes between API layer and UI.
- Improves maintainability and type safety in frontend code.

## Quick Summary

- Encapsulation: Entities and services keep state private and expose controlled access.
- Inheritance: Security filter and repository base contracts reuse framework behavior.
- Abstraction: Clean Controller -> Service -> Repository architecture.
- Polymorphism: Overridden framework methods and interface-driven implementations.
- Composition/Association: Real-world entity links and injected service collaboration.
- Enums and interfaces strengthen object modeling in backend and frontend.
