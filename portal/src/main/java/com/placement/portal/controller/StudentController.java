package com.placement.portal.controller;

import com.placement.portal.dto.FitScoreResponse;
import com.placement.portal.entity.Student;
import com.placement.portal.repository.StudentRepository;
import com.placement.portal.service.FitScoreService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/students")
public class StudentController {

    @Autowired
    private StudentRepository studentRepository;

    // POST API (Create student)
    @PostMapping
    public Student createStudent(@RequestBody Student student) {

        if (!studentRepository.findAllByEmail(student.getEmail()).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        return studentRepository.save(student);
    }

    // GET API (Fetch all students)
    @GetMapping
    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    @DeleteMapping("/{id}")
    public String deleteStudent(@PathVariable Long id) {

        Optional<Student> student = studentRepository.findById(id);

        if (student.isPresent()) {
            studentRepository.delete(student.get());
            return "Student deleted successfully";
        } else {
            return "Student not found";
        }
    }

    @PutMapping("/{id}")
    public Student updateStudent(@PathVariable Long id, @RequestBody Student updatedStudent) {

        Optional<Student> studentOptional = studentRepository.findById(id);

        if (studentOptional.isPresent()) {
            Student student = studentOptional.get();

            List<Student> existingWithEmail = studentRepository.findAllByEmail(updatedStudent.getEmail());
            boolean emailBelongsToAnother = existingWithEmail.stream()
                    .anyMatch(s -> !s.getId().equals(id));

            if (emailBelongsToAnother) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
            }

            student.setName(updatedStudent.getName());
            student.setEmail(updatedStudent.getEmail());
            student.setBranch(updatedStudent.getBranch());

            return studentRepository.save(student);
        } else {
            return null;
        }
    }
    
    @GetMapping("/me")
    public Student getMyProfile() {

        String username = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        return resolveSingleStudentByEmail(username);
    }

    @PutMapping("/me")
    public Student updateMyProfile(@RequestBody Student updatedStudent) {

        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        Student student = resolveSingleStudentByEmail(email);

        student.setCgpa(updatedStudent.getCgpa());
        student.setSkills(updatedStudent.getSkills());
        student.setProjects(updatedStudent.getProjects());
        student.setResumeLink(updatedStudent.getResumeLink());
        student.setPhone(updatedStudent.getPhone());
        student.setUniversity(updatedStudent.getUniversity());
        student.setGraduationYear(updatedStudent.getGraduationYear());

        return studentRepository.save(student);
    }

    private Student resolveSingleStudentByEmail(String email) {

        List<Student> students = studentRepository.findAllByEmail(email);

        if (students.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Student profile not found");
        }

        if (students.size() > 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Duplicate student profiles found for email: " + email);
        }

        return students.get(0);
    }

    @Autowired
    private FitScoreService fitScoreService;

    @GetMapping("/fit-score")
    public FitScoreResponse getFitScore() {

        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        Student student = studentRepository.findByEmail(email);

        return fitScoreService.calculateFitScore(student, null);
    }
}

