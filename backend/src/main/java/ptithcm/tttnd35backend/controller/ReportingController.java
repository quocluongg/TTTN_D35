package ptithcm.tttnd35backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import ptithcm.tttnd35backend.service.ReportingService;
import java.time.*;
import java.util.Map;

@RestController @RequestMapping("/admin/reports") @RequiredArgsConstructor
public class ReportingController {
    private final ReportingService reporting;
    private ResponseEntity<ApiResponse<Map<String,Object>>> ok(Map<String,Object> data) { return ResponseEntity.ok(ApiResponse.<Map<String,Object>>builder().success(true).data(data).timestamp(LocalDateTime.now()).build()); }
    @GetMapping("/dashboard") @PreAuthorize("hasAuthority('REPORT_VIEW')")
    public ResponseEntity<ApiResponse<Map<String,Object>>> dashboard(@RequestParam(required=false) LocalDate from, @RequestParam(required=false) LocalDate to) { return ok(reporting.dashboard(from,to)); }

    @GetMapping("/users") @PreAuthorize("hasAuthority('REPORT_VIEW')")
    public ResponseEntity<ApiResponse<Map<String,Object>>> users(@RequestParam(required=false) LocalDate from, @RequestParam(required=false) LocalDate to) { return ok(reporting.users(from,to)); }

    @GetMapping(value = "/users/export", produces = "text/csv") @PreAuthorize("hasAuthority('REPORT_VIEW')")
    public ResponseEntity<String> exportUsers(@RequestParam(required=false) LocalDate from, @RequestParam(required=false) LocalDate to) {
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=user-report.csv")
                .body(reporting.exportUsersCsv(from, to));
    }

    @GetMapping("/business") @PreAuthorize("hasAuthority('REPORT_VIEW')")
    public ResponseEntity<ApiResponse<Map<String,Object>>> business(@RequestParam(required=false) LocalDate from, @RequestParam(required=false) LocalDate to) { return ok(reporting.business(from,to)); }

    @GetMapping(value = "/business/export", produces = "text/csv") @PreAuthorize("hasAuthority('REPORT_VIEW')")
    public ResponseEntity<String> exportBusiness(@RequestParam(required=false) LocalDate from, @RequestParam(required=false) LocalDate to) {
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=business-report.csv")
                .body(reporting.exportBusinessCsv(from, to));
    }
}
