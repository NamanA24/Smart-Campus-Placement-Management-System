package com.placement.portal.util;

import com.placement.portal.entity.Company;
import com.placement.portal.entity.Student;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Set;
import java.util.regex.Pattern;

public final class InputValidationUtil {

    private static final Pattern NAME_PATTERN = Pattern.compile("^[A-Za-z][A-Za-z\\s]{1,79}$");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^\\d{10}$");
    private static final Pattern URL_PATTERN = Pattern.compile("^https?://\\S+$", Pattern.CASE_INSENSITIVE);
    private static final Set<String> ALLOWED_GENDERS = Set.of("Male", "Female", "Other");

    private InputValidationUtil() {
    }

    public static void validateAndNormalizeStudentForCreate(Student student, boolean requireProjects, boolean requireResumeLink) {
        String name = normalize(student.getName());
        if (name == null) {
            badRequest("Name is required");
        }
        if (!NAME_PATTERN.matcher(name).matches()) {
            badRequest("Name should contain only letters and spaces");
        }

        String email = normalize(student.getEmail());
        if (email == null) {
            badRequest("Email is required");
        }
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            badRequest("Email format is invalid");
        }

        String branch = normalize(student.getBranch());
        if (branch == null) {
            badRequest("Branch is required");
        }
        if (!containsLetter(branch)) {
            badRequest("Branch must contain alphabetic characters");
        }

        String gender = normalize(student.getGender());
        if (gender == null) {
            badRequest("Gender is required");
        }
        if (!ALLOWED_GENDERS.contains(gender)) {
            badRequest("Gender must be Male, Female or Other");
        }

        double cgpa = student.getCgpa();
        if (cgpa < 0 || cgpa > 10) {
            badRequest("CGPA must be between 0 and 10");
        }

        String skills = normalize(student.getSkills());
        if (skills == null) {
            badRequest("Skills are required");
        }
        if (!containsLetter(skills)) {
            badRequest("Skills must contain alphabetic characters");
        }

        String projects = normalize(student.getProjects());
        if (requireProjects && projects == null) {
            badRequest("Projects are required");
        }
        if (projects != null && !containsLetter(projects)) {
            badRequest("Projects must contain alphabetic characters");
        }

        String resumeLink = normalize(student.getResumeLink());
        if (requireResumeLink && resumeLink == null) {
            badRequest("Resume link is required");
        }
        if (resumeLink != null && !URL_PATTERN.matcher(resumeLink).matches()) {
            badRequest("Resume link must be a valid http/https URL");
        }

        String phone = normalize(student.getPhone());
        if (phone == null) {
            badRequest("Phone number is required");
        }
        if (!PHONE_PATTERN.matcher(phone).matches()) {
            badRequest("Phone number must be exactly 10 digits");
        }

        String university = normalize(student.getUniversity());
        if (university == null) {
            badRequest("University is required");
        }
        if (!containsLetter(university)) {
            badRequest("University must contain alphabetic characters");
        }

        int graduationYear = student.getGraduationYear();
        if (graduationYear < 2000 || graduationYear > 2100) {
            badRequest("Graduation year must be between 2000 and 2100");
        }

        String password = normalize(student.getPassword());
        if (password != null && password.length() < 3) {
            badRequest("Password must be at least 3 characters");
        }

        student.setName(name);
        student.setEmail(email);
        student.setBranch(branch);
        student.setGender(gender);
        student.setSkills(skills);
        student.setProjects(projects);
        student.setResumeLink(resumeLink);
        student.setPhone(phone);
        student.setUniversity(university);
        student.setPassword(password);
    }

    public static void validateAndNormalizeCompanyForCreate(Company company) {
        String name = normalize(company.getName());
        if (name == null) {
            badRequest("Company name is required");
        }
        if (!NAME_PATTERN.matcher(name).matches()) {
            badRequest("Company name should contain only letters and spaces");
        }

        String role = normalize(company.getRole());
        if (role == null) {
            badRequest("Role / department is required");
        }
        if (!containsLetter(role)) {
            badRequest("Role / department must contain alphabetic characters");
        }

        if (company.getPackageOffered() <= 0) {
            badRequest("Package offered must be greater than 0");
        }

        String password = normalize(company.getPassword());
        if (password != null && password.length() < 3) {
            badRequest("Password must be at least 3 characters");
        }

        company.setName(name);
        company.setRole(role);
        company.setPassword(password);
    }

    private static String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static boolean containsLetter(String value) {
        return value != null && value.chars().anyMatch(Character::isLetter);
    }

    private static void badRequest(String message) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
