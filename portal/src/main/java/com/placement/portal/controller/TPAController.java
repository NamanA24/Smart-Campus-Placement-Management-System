package com.placement.portal.controller;

import com.placement.portal.service.TPAService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tpa")
public class TPAController {

    @Autowired
    private TPAService tpaService;

    // Run audit manually
    @GetMapping("/audit")
    public List<String> auditAll() {
        return tpaService.auditAllApplications();
    }
}
