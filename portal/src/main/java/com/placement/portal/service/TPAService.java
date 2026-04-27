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

    @Autowired
    private StudentSecurityService studentSecurityService;

    public List<String> auditAllApplications() {

        List<Application> applications = applicationRepository.findAll();

        List<String> results = new ArrayList<>();

        for (Application app : applications) {

            try {
                Student student = app.getStudent();
                String payload = app.getSignedPayload();
                String signature = app.getSignature();

                String profileStatus = studentSecurityService.verifyProfileStatus(student);
                if (!"CLEAN".equals(profileStatus)) {
                    results.add("Application ID " + app.getId() + " -> TAMPERED (PROFILE_" + profileStatus + ")");
                    continue;
                }

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

/*

mysql -u root -p
```

SHOW DATABASES;
```

USE placement_portal;
```
SELECT * from student;

SELECT id, email, cgpa FROM student WHERE id = 22;
```

8. Tamper profile (this simulates attacker editing DB directly):
```sql
UPDATE student
SET cgpa = 10.0
WHERE id = 22;
```

9. Commit change:
```sql
COMMIT;
```

10. Verify DB changed:
```sql
SELECT id, email, cgpa FROM student WHERE id = 22;
```

11. Exit MySQL:
```sql
exit;
```

Now return to test.http and run these 3 requests in order:

1. `GET /students/me` with `@studentToken`
   Expected: `integrityStatus = TAMPERED`

2. `POST /students/me/resign`
   Expected: 200

3. `GET /students/me` again
   Expected: `integrityStatus = CLEAN`

If you want, after you run these, paste the 2 `integrityStatus` values and I’ll confirm you’re demo-perfect.
 */