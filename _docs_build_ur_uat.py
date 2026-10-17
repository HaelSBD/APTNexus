"""Generate APTNexus User Requirement and UAT Documentation — mirrors 3RKU format."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _docs_kit import (
    new_doc, add_title_block, add_h1, add_h2, add_h3, add_p, add_bullet, add_number,
    add_kv_table, add_grid_table, add_figure, add_toc, add_doc_control, page_break, OUT
)


def build_user_requirements():
    """APTNexus User Requirement Documentation — mirrors 3RKU UR structure."""
    doc = new_doc()
    
    # Title Page
    add_title_block(
        doc,
        "APTNexus",
        "User Requirement Documentation"
    )
    add_p(doc, "")
    add_p(doc, "Prepared for:")
    add_p(doc, "APTNexus Operations Programme (Site Security)")
    add_p(doc, "")
    add_p(doc, "Version 1.0")
    add_p(doc, "14 October 2026")
    page_break(doc)
    
    # Document Control
    add_doc_control(
        doc,
        product="APTNexus — Site Security Management Platform",
        prepared_for="APTNexus Operations Programme (Site Security)",
        title="User Requirement Documentation",
        related="APTNexus-UAT-Documentation.docx, APTNexus-Technical-Specification.docx",
        version="1.0",
        date="14 October 2026"
    )
    page_break(doc)
    
    # Table of Contents
    add_toc(doc, [
        (1, "1  Purpose", "5"),
        (1, "2  Scope", "6"),
        (2, "2.1  In Scope", "6"),
        (2, "2.2  Out of Scope", "7"),
        (1, "3  Stakeholders", "8"),
        (1, "4  Definitions", "9"),
        (1, "5  Business objectives", "10"),
        (1, "6  User roles", "11"),
        (1, "7  Functional Requirements — Security Officer", "13"),
        (1, "8  Functional Requirements — Admin", "18"),
        (1, "9  Functional Requirements — Super Admin", "21"),
        (1, "10  Cross-cutting Functional Requirements", "24"),
        (1, "11  Non-Functional Requirements", "26"),
        (1, "12  Data Requirements", "28"),
        (1, "13  Interface Requirements", "29"),
        (1, "14  Language Requirements", "30"),
        (1, "15  Access and Roles", "31"),
        (1, "16  Assumptions and Constraints", "32"),
        (1, "17  Acceptance Criteria", "33"),
    ])
    page_break(doc)
    
    # 1. PURPOSE
    add_h1(doc, "1  Purpose")
    add_p(doc, "This document defines the user requirements for APTNexus, a comprehensive site security management platform designed to streamline security operations across multiple sites.")
    add_p(doc, "The system enables security officers to clock in/out with GPS verification, scan QR checkpoints, register gate visitors with OCR, and maintain patrol trails. Admin users can oversee duty rosters, export patrol and visitor logs as PDF, and review checkpoint history. Super Admin users manage site configurations, checkpoint definitions with area zones (A-D) and APT-referral codes, and user accounts.")
    add_figure(doc, "fig_req_context.png", "Figure 1.1: APTNexus Requirements Context")
    add_p(doc, "APTNexus replaces fragmented manual processes with a unified mobile + web console solution, delivering real-time visibility into security operations and ensuring compliance with site access protocols.")
    page_break(doc)
    
    # 2. SCOPE
    add_h1(doc, "2  Scope")
    
    add_h2(doc, "2.1  In Scope")
    add_bullet(doc, "Mobile application for Security Officers (React Native / Expo) — clock, GPS trail, QR checkpoint scan, gate visitor OCR, patrol history, settings, i18n (EN/BM/ZH)")
    add_bullet(doc, "Admin mobile interface — overview desk, visitors log PDF export, patrol log PDF export with Site/Checkpoint/Area/Scanned columns, view sites/checkpoints, team roster")
    add_bullet(doc, "Web console for Admin and Super Admin — comprehensive dashboard, duty rosters, patrols, visitors, inbox, checkpoints, sites, GPS trails, user management")
    add_bullet(doc, "Super Admin CRUD for sites, checkpoints with area zones (A-D) and APT-referral codes")
    add_bullet(doc, "Super Admin CRUD for users with role assignment (Security Officer, Admin, Super Admin)")
    add_bullet(doc, "RESTful API backend with JWT session authentication")
    add_bullet(doc, "Push notifications for duty reminders, checkpoint alerts, and visitor updates")
    add_bullet(doc, "PDF generation for patrol logs and visitor logs with detailed column headers")
    add_bullet(doc, "GPS trail recording and playback")
    add_bullet(doc, "OCR-based visitor registration at gate checkpoints")
    add_bullet(doc, "Multi-language support (English, Bahasa Malaysia, 中文)")
    add_figure(doc, "fig_user_journey.png", "Figure 2.1: APTNexus User Journey Overview")
    
    add_h2(doc, "2.2  Out of Scope")
    add_bullet(doc, "Integration with third-party payroll or HR systems (deferred to Phase 2)")
    add_bullet(doc, "Biometric authentication (fingerprint/face — may be considered in future releases)")
    add_bullet(doc, "Offline mode with full sync (partial offline caching only)")
    add_bullet(doc, "IoT sensor integration (RFID, NFC tags — future enhancement)")
    add_bullet(doc, "Automated shift rostering algorithm (manual roster creation remains with Admin)")
    page_break(doc)
    
    # 3. STAKEHOLDERS
    add_h1(doc, "3  Stakeholders")
    add_grid_table(doc, ["Stakeholder", "Role", "Interest"], [
        ["Security Officers", "End-users (mobile)", "Clock in/out, patrol checkpoints, register visitors, view history"],
        ["Admin Users", "Operations supervisors", "Monitor duty rosters, export logs, review site activity, manage team"],
        ["Super Admin Users", "System administrators", "Configure sites, checkpoints, areas, APT codes, manage users"],
        ["Operations Programme Lead", "Sponsor", "Ensure system meets security compliance and operational KPIs"],
        ["IT Support Team", "Technical support", "Deploy, maintain, troubleshoot APTNexus platform"],
        ["Site Managers", "Business stakeholders", "Access reports, ensure site security protocols are followed"],
    ])
    page_break(doc)
    
    # 4. DEFINITIONS
    add_h1(doc, "4  Definitions")
    add_kv_table(doc, [
        ("APTNexus", "Site Security Management Platform name"),
        ("Checkpoint", "Physical location with QR code for security patrol scanning"),
        ("Area Zone", "Checkpoint sub-division (A, B, C, D) for granular tracking"),
        ("APT-Referral Code", "Unique code assigned to each checkpoint for external reference"),
        ("Clock In/Out", "Security officer duty start/end action with GPS verification"),
        ("GPS Trail", "Recorded path of security officer movement during patrol"),
        ("Gate Visitor", "Person registered at gate checkpoint via OCR of ID or vehicle plate"),
        ("Patrol Log", "Historical record of checkpoint scans during a patrol session"),
        ("Duty Roster", "Admin-managed schedule of security officers' shifts"),
        ("Inbox", "Admin notification feed for alerts and updates"),
        ("PDF Export", "Generated PDF report of patrol or visitor logs"),
        ("i18n", "Internationalization — support for EN, BM, ZH languages"),
    ])
    page_break(doc)
    
    # 5. BUSINESS OBJECTIVES
    add_h1(doc, "5  Business objectives")
    add_number(doc, "BO-001: Automate clock in/out with GPS verification to eliminate manual timesheets and reduce fraud.")
    add_number(doc, "BO-002: Enable real-time checkpoint patrol tracking with QR scanning to ensure coverage of all areas.")
    add_number(doc, "BO-003: Digitize gate visitor registration with OCR to replace paper logbooks and improve traceability.")
    add_number(doc, "BO-004: Provide Admin users with PDF export capability for audit-ready patrol and visitor logs.")
    add_number(doc, "BO-005: Centralize site and checkpoint configuration to support multi-site operations with consistent data structure.")
    add_number(doc, "BO-006: Empower Super Admin users to manage user accounts and role-based access control.")
    add_number(doc, "BO-007: Deliver multi-language interface to accommodate diverse workforce (EN/BM/ZH).")
    add_number(doc, "BO-008: Establish audit trail with GPS trails and timestamped checkpoint scans for compliance reporting.")
    page_break(doc)
    
    # 6. USER ROLES
    add_h1(doc, "6  User roles")
    add_p(doc, "APTNexus defines three primary user roles with distinct permissions and responsibilities:")
    
    add_h3(doc, "6.1  Security Officer")
    add_bullet(doc, "Mobile-only access")
    add_bullet(doc, "Clock in/out with GPS verification")
    add_bullet(doc, "Scan QR checkpoints during patrol")
    add_bullet(doc, "Register gate visitors with OCR")
    add_bullet(doc, "View own patrol history and GPS trails")
    add_bullet(doc, "Adjust language settings (EN/BM/ZH)")
    
    add_h3(doc, "6.2  Admin")
    add_bullet(doc, "Mobile + web console access")
    add_bullet(doc, "Overview dashboard with KPI metrics (active duty, checkpoints scanned, visitors registered)")
    add_bullet(doc, "View and manage duty rosters")
    add_bullet(doc, "Browse patrol logs with filters (date, site, officer)")
    add_bullet(doc, "Export patrol logs to PDF with Site/Checkpoint/Area/Scanned columns")
    add_bullet(doc, "Browse visitor logs with filters (date, site, gate)")
    add_bullet(doc, "Export visitor logs to PDF")
    add_bullet(doc, "View sites and checkpoints (read-only)")
    add_bullet(doc, "Browse team roster and officer profiles")
    add_bullet(doc, "Access inbox for system notifications")
    
    add_h3(doc, "6.3  Super Admin")
    add_bullet(doc, "Mobile + web console access with full Admin permissions plus:")
    add_bullet(doc, "Create, read, update, delete (CRUD) sites")
    add_bullet(doc, "CRUD checkpoints with area zones (A-D) and APT-referral codes")
    add_bullet(doc, "CRUD users with role assignment (Security, Admin, Super Admin)")
    add_bullet(doc, "Configure system-wide settings (future: notification templates, PDF headers)")
    
    add_figure(doc, "fig_roles_matrix.png", "Figure 6.1: APTNexus Roles and Permissions Matrix")
    page_break(doc)
    
    # 7. FR - SECURITY OFFICER
    add_h1(doc, "7  Functional Requirements — Security Officer")
    
    add_h2(doc, "7.1  Clock In/Out with GPS")
    add_p(doc, "FR-SEC-001: The system SHALL allow security officers to clock in at shift start with GPS location capture.")
    add_p(doc, "FR-SEC-002: The system SHALL allow security officers to clock out at shift end with GPS location capture.")
    add_p(doc, "FR-SEC-003: The system SHALL validate GPS coordinates against assigned site geofence (within 200m radius).")
    add_p(doc, "FR-SEC-004: The system SHALL display current clock status (clocked in/out) and elapsed duty time on home screen.")
    add_p(doc, "FR-SEC-005: The system SHALL prevent clock in if officer is already clocked in at another site.")
    add_figure(doc, "fig_clock_flow.png", "Figure 7.1: Clock In/Out Flow")
    
    add_h2(doc, "7.2  GPS Trail Recording")
    add_p(doc, "FR-SEC-006: The system SHALL record GPS trail at 30-second intervals during clocked-in duty.")
    add_p(doc, "FR-SEC-007: The system SHALL store GPS trail with timestamp, latitude, longitude, and accuracy metadata.")
    add_p(doc, "FR-SEC-008: The system SHALL allow security officers to view their own GPS trail on map for current shift.")
    add_p(doc, "FR-SEC-009: The system SHALL upload GPS trail to server at 5-minute intervals when network is available.")
    
    add_h2(doc, "7.3  QR Checkpoint Scanning")
    add_p(doc, "FR-SEC-010: The system SHALL provide QR scanner for checkpoint scanning during patrol.")
    add_p(doc, "FR-SEC-011: The system SHALL decode checkpoint QR code and retrieve checkpoint name, area zone, and APT-referral code.")
    add_p(doc, "FR-SEC-012: The system SHALL record checkpoint scan with timestamp, GPS location, and officer ID.")
    add_p(doc, "FR-SEC-013: The system SHALL display scan confirmation with checkpoint name, area, and time.")
    add_p(doc, "FR-SEC-014: The system SHALL validate that officer is clocked in before allowing checkpoint scan.")
    add_p(doc, "FR-SEC-015: The system SHALL allow officers to add optional notes/remarks to checkpoint scan.")
    
    add_h2(doc, "7.4  Gate Visitor Registration with OCR")
    add_p(doc, "FR-SEC-016: The system SHALL provide camera interface for capturing visitor ID card or vehicle plate at gate.")
    add_p(doc, "FR-SEC-017: The system SHALL perform OCR on captured image to extract text (ID number, name, vehicle plate).")
    add_p(doc, "FR-SEC-018: The system SHALL allow officer to review and edit OCR results before saving.")
    add_p(doc, "FR-SEC-019: The system SHALL record visitor entry with timestamp, gate checkpoint, purpose, and host contact.")
    add_p(doc, "FR-SEC-020: The system SHALL support visitor exit scan to complete visit record.")
    add_p(doc, "FR-SEC-021: The system SHALL attach captured photo to visitor record for audit trail.")
    add_figure(doc, "fig_visitor_flow.png", "Figure 7.2: Gate Visitor Registration Flow")
    
    add_h2(doc, "7.5  Patrol History")
    add_p(doc, "FR-SEC-022: The system SHALL display officer's own patrol history grouped by shift date.")
    add_p(doc, "FR-SEC-023: The system SHALL show checkpoint scans with time, location, area zone for each patrol session.")
    add_p(doc, "FR-SEC-024: The system SHALL provide date range filter for patrol history (last 7 days, 30 days, custom).")
    add_p(doc, "FR-SEC-025: The system SHALL allow officer to view GPS trail replay for past patrol sessions.")
    
    add_h2(doc, "7.6  Settings and Localization")
    add_p(doc, "FR-SEC-026: The system SHALL provide settings screen for language selection (EN, BM, ZH).")
    add_p(doc, "FR-SEC-027: The system SHALL apply selected language to all UI labels, buttons, and messages immediately.")
    add_p(doc, "FR-SEC-028: The system SHALL persist language preference across app restarts.")
    add_p(doc, "FR-SEC-029: The system SHALL display officer profile with name, badge number, assigned site.")
    add_p(doc, "FR-SEC-030: The system SHALL allow officer to update profile photo and contact phone number.")
    page_break(doc)
    
    # 8. FR - ADMIN
    add_h1(doc, "8  Functional Requirements — Admin")
    
    add_h2(doc, "8.1  Overview Dashboard")
    add_p(doc, "FR-ADM-001: The system SHALL display admin dashboard with KPI cards: active duty officers, checkpoints scanned today, visitors registered today.")
    add_p(doc, "FR-ADM-002: The system SHALL show recent activity feed (latest clock ins, checkpoint scans, visitor entries).")
    add_p(doc, "FR-ADM-003: The system SHALL provide site selector dropdown to filter dashboard metrics by site.")
    add_p(doc, "FR-ADM-004: The system SHALL display chart of checkpoint scan distribution by area zone (A-D).")
    add_figure(doc, "fig_kpi_activity.png", "Figure 8.1: Admin Dashboard KPI Overview")
    
    add_h2(doc, "8.2  Visitors Log and PDF Export")
    add_p(doc, "FR-ADM-005: The system SHALL display visitors log table with columns: Date, Time, Gate, Visitor Name, ID Number, Vehicle Plate, Purpose, Host, Status (In/Out).")
    add_p(doc, "FR-ADM-006: The system SHALL provide date range filter for visitors log (today, last 7 days, 30 days, custom).")
    add_p(doc, "FR-ADM-007: The system SHALL provide site/gate filter for visitors log.")
    add_p(doc, "FR-ADM-008: The system SHALL allow admin to export filtered visitors log as PDF with header (site name, date range, report title).")
    add_p(doc, "FR-ADM-009: The system SHALL include visitor photo thumbnail in PDF export.")
    add_p(doc, "FR-ADM-010: The system SHALL generate PDF filename: VisitorLog_[SiteName]_[DateRange].pdf")
    
    add_h2(doc, "8.3  Patrol Log and PDF Export")
    add_p(doc, "FR-ADM-011: The system SHALL display patrol log table with columns: Date, Time, Officer Name, Site, Checkpoint, Area, Scanned On (timestamp).")
    add_p(doc, "FR-ADM-012: The system SHALL provide date range filter for patrol log (today, last 7 days, 30 days, custom).")
    add_p(doc, "FR-ADM-013: The system SHALL provide site filter and officer filter for patrol log.")
    add_p(doc, "FR-ADM-014: The system SHALL allow admin to export filtered patrol log as PDF with header (site name, date range, report title).")
    add_p(doc, "FR-ADM-015: The system SHALL include GPS coordinates and map snapshot for each checkpoint scan in PDF export.")
    add_p(doc, "FR-ADM-016: The system SHALL generate PDF filename: PatrolLog_[SiteName]_[DateRange].pdf")
    
    add_h2(doc, "8.4  View Sites and Checkpoints")
    add_p(doc, "FR-ADM-017: The system SHALL display list of all sites with name, address, geofence radius.")
    add_p(doc, "FR-ADM-018: The system SHALL display list of checkpoints per site with name, area zone, APT-referral code, QR code preview.")
    add_p(doc, "FR-ADM-019: Admin users SHALL have read-only access to sites and checkpoints (no edit/delete).")
    
    add_h2(doc, "8.5  Team Roster")
    add_p(doc, "FR-ADM-020: The system SHALL display team roster with officer name, badge number, role, assigned site, status (on duty/off duty).")
    add_p(doc, "FR-ADM-021: The system SHALL allow admin to view officer profile with patrol history and performance metrics.")
    add_p(doc, "FR-ADM-022: The system SHALL show duty roster calendar with shift assignments (future enhancement: edit shifts).")
    page_break(doc)
    
    # 9. FR - SUPER ADMIN
    add_h1(doc, "9  Functional Requirements — Super Admin")
    
    add_h2(doc, "9.1  CRUD Sites")
    add_p(doc, "FR-SAD-001: The system SHALL allow super admin to create new site with name, address, GPS coordinates, geofence radius.")
    add_p(doc, "FR-SAD-002: The system SHALL validate site GPS coordinates and geofence radius (minimum 50m, maximum 500m).")
    add_p(doc, "FR-SAD-003: The system SHALL allow super admin to edit site details.")
    add_p(doc, "FR-SAD-004: The system SHALL allow super admin to delete site (with confirmation prompt and cascade warning if checkpoints exist).")
    add_p(doc, "FR-SAD-005: The system SHALL prevent deletion of site if active duty officers are clocked in.")
    
    add_h2(doc, "9.2  CRUD Checkpoints with Areas and APT Codes")
    add_p(doc, "FR-SAD-006: The system SHALL allow super admin to create new checkpoint with name, site assignment, area zone (A/B/C/D), APT-referral code.")
    add_p(doc, "FR-SAD-007: The system SHALL generate unique QR code for each checkpoint encoding checkpoint ID, name, area, APT code.")
    add_p(doc, "FR-SAD-008: The system SHALL validate APT-referral code format (alphanumeric, 8-12 characters, unique per site).")
    add_p(doc, "FR-SAD-009: The system SHALL allow super admin to edit checkpoint details (name, area zone, APT code).")
    add_p(doc, "FR-SAD-010: The system SHALL regenerate QR code if checkpoint details are modified.")
    add_p(doc, "FR-SAD-011: The system SHALL allow super admin to delete checkpoint (with confirmation prompt).")
    add_p(doc, "FR-SAD-012: The system SHALL prevent deletion of checkpoint if recent scans exist (within 24 hours).")
    add_p(doc, "FR-SAD-013: The system SHALL provide bulk QR code download (PDF sheet with all checkpoints for a site).")
    
    add_h2(doc, "9.3  CRUD Users")
    add_p(doc, "FR-SAD-014: The system SHALL allow super admin to create new user with email, name, badge number, role (Security/Admin/Super Admin).")
    add_p(doc, "FR-SAD-015: The system SHALL send account activation email with temporary password to new user.")
    add_p(doc, "FR-SAD-016: The system SHALL enforce strong password policy (min 8 chars, uppercase, lowercase, digit, special char).")
    add_p(doc, "FR-SAD-017: The system SHALL allow super admin to edit user details (name, badge, role, assigned site).")
    add_p(doc, "FR-SAD-018: The system SHALL allow super admin to deactivate/reactivate user account.")
    add_p(doc, "FR-SAD-019: The system SHALL allow super admin to reset user password (generates temporary password).")
    add_p(doc, "FR-SAD-020: The system SHALL prevent super admin from deleting their own account.")
    add_p(doc, "FR-SAD-021: The system SHALL log all user management actions (create, edit, delete, role change) for audit trail.")
    page_break(doc)
    
    # 10. CROSS-CUTTING FR
    add_h1(doc, "10  Cross-cutting Functional Requirements")
    
    add_h2(doc, "10.1  Authentication and Session Management")
    add_p(doc, "FR-XC-001: The system SHALL authenticate users via email and password with JWT token.")
    add_p(doc, "FR-XC-002: The system SHALL enforce session timeout after 12 hours of inactivity.")
    add_p(doc, "FR-XC-003: The system SHALL support password reset via email verification link.")
    add_p(doc, "FR-XC-004: The system SHALL require user to change temporary password on first login.")
    add_figure(doc, "fig_auth_flow.png", "Figure 10.1: Authentication Flow")
    
    add_h2(doc, "10.2  API and Integration")
    add_p(doc, "FR-XC-005: The system SHALL expose RESTful API for mobile app and web console with JSON payloads.")
    add_p(doc, "FR-XC-006: The system SHALL implement API rate limiting (100 requests per minute per user).")
    add_p(doc, "FR-XC-007: The system SHALL provide API documentation (Swagger/OpenAPI) for integration partners.")
    add_p(doc, "FR-XC-008: The system SHALL log all API requests with timestamp, user, endpoint, response status for audit.")
    add_figure(doc, "fig_req_context.png", "Figure 10.2: API Integration Context")
    
    add_h2(doc, "10.3  Notifications")
    add_p(doc, "FR-XC-009: The system SHALL send push notification to security officer 15 minutes before shift start.")
    add_p(doc, "FR-XC-010: The system SHALL send push notification to admin when checkpoint scan is missed (checkpoint not scanned within expected patrol interval).")
    add_p(doc, "FR-XC-011: The system SHALL send push notification to admin when visitor registers at gate.")
    add_p(doc, "FR-XC-012: The system SHALL allow users to configure notification preferences in settings (enable/disable per notification type).")
    
    add_h2(doc, "10.4  PDF Generation")
    add_p(doc, "FR-XC-013: The system SHALL generate PDF reports with header (logo, report title, date range, site name).")
    add_p(doc, "FR-XC-014: The system SHALL generate PDF reports with footer (page number, generated timestamp, APTNexus watermark).")
    add_p(doc, "FR-XC-015: The system SHALL format PDF tables with consistent column widths and row heights for readability.")
    page_break(doc)
    
    # 11. NFR
    add_h1(doc, "11  Non-Functional Requirements")
    
    add_h2(doc, "11.1  Performance")
    add_p(doc, "NFR-PERF-001: The system SHALL load home screen within 2 seconds on 4G network.")
    add_p(doc, "NFR-PERF-002: The system SHALL complete checkpoint QR scan within 1 second of successful decode.")
    add_p(doc, "NFR-PERF-003: The system SHALL generate PDF report within 10 seconds for up to 1000 records.")
    add_p(doc, "NFR-PERF-004: The system SHALL support 500 concurrent users without performance degradation.")
    
    add_h2(doc, "11.2  Security")
    add_p(doc, "NFR-SEC-001: The system SHALL encrypt all API traffic using HTTPS/TLS 1.3.")
    add_p(doc, "NFR-SEC-002: The system SHALL hash passwords using bcrypt with salt (minimum work factor 12).")
    add_p(doc, "NFR-SEC-003: The system SHALL enforce role-based access control (RBAC) at API endpoint level.")
    add_p(doc, "NFR-SEC-004: The system SHALL log security events (failed login attempts, unauthorized access) for monitoring.")
    
    add_h2(doc, "11.3  Availability")
    add_p(doc, "NFR-AVAIL-001: The system SHALL maintain 99.5% uptime during operational hours (06:00 - 23:00 daily).")
    add_p(doc, "NFR-AVAIL-002: The system SHALL perform automated database backup daily at 02:00 with 30-day retention.")
    add_p(doc, "NFR-AVAIL-003: The system SHALL support graceful degradation (offline caching) when network is unavailable.")
    
    add_h2(doc, "11.4  Usability and Localization")
    add_p(doc, "NFR-USE-001: The system SHALL support EN, BM, ZH languages with complete translation coverage.")
    add_p(doc, "NFR-USE-002: The system SHALL provide consistent UI/UX across mobile and web console.")
    add_p(doc, "NFR-USE-003: The system SHALL support accessibility guidelines (WCAG 2.1 Level AA) for web console.")
    page_break(doc)
    
    # 12. DATA REQUIREMENTS
    add_h1(doc, "12  Data Requirements")
    add_p(doc, "The system SHALL maintain the following data entities with specified retention and backup policies:")
    add_grid_table(doc, ["Entity", "Key Attributes", "Retention", "Backup"], [
        ["User", "ID, email, name, badge, role, site, status", "Active + 2 years after deactivation", "Daily"],
        ["Site", "ID, name, address, GPS, geofence radius", "Indefinite (historical reference)", "Daily"],
        ["Checkpoint", "ID, site, name, area (A-D), APT code, QR", "Indefinite (historical reference)", "Daily"],
        ["Clock Event", "ID, user, site, type (in/out), timestamp, GPS", "3 years", "Daily"],
        ["GPS Trail", "ID, user, timestamp, lat, lon, accuracy", "1 year (aggregated monthly)", "Weekly"],
        ["Checkpoint Scan", "ID, user, checkpoint, timestamp, GPS, notes", "3 years", "Daily"],
        ["Visitor", "ID, gate, name, ID number, vehicle, photo, entry/exit time", "3 years", "Daily"],
        ["Patrol Session", "ID, user, site, start, end, checkpoints scanned", "3 years", "Daily"],
        ["Notification", "ID, user, type, message, timestamp, read status", "90 days", "None"],
        ["Audit Log", "ID, user, action, entity, timestamp, IP", "5 years", "Daily"],
    ])
    add_figure(doc, "fig_data_model.png", "Figure 12.1: APTNexus Data Model Overview")
    page_break(doc)
    
    # 13. INTERFACE REQUIREMENTS
    add_h1(doc, "13  Interface Requirements")
    add_p(doc, "The system SHALL provide the following user interfaces:")
    add_h3(doc, "13.1  Mobile Application")
    add_bullet(doc, "Platform: React Native / Expo (iOS 14+, Android 10+)")
    add_bullet(doc, "URL: aptnexus://app (deep link scheme)")
    add_bullet(doc, "Distribution: Internal enterprise deployment (TestFlight, APK sideload)")
    
    add_h3(doc, "13.2  Web Console")
    add_bullet(doc, "URL: https://console.aptnexus.com (production)")
    add_bullet(doc, "URL: https://console-staging.aptnexus.com (staging)")
    add_bullet(doc, "Browser support: Chrome 100+, Firefox 100+, Safari 15+, Edge 100+")
    add_bullet(doc, "Responsive design: Desktop 1920x1080, Tablet 1024x768, Mobile 375x667")
    
    add_h3(doc, "13.3  API Endpoint")
    add_bullet(doc, "Base URL: https://api.aptnexus.com/v1 (production)")
    add_bullet(doc, "Base URL: https://api-staging.aptnexus.com/v1 (staging)")
    add_bullet(doc, "Documentation: https://api.aptnexus.com/docs (Swagger UI)")
    page_break(doc)
    
    # 14. LANGUAGE REQUIREMENTS
    add_h1(doc, "14  Language Requirements")
    add_p(doc, "APTNexus SHALL support three languages with complete UI translation:")
    add_kv_table(doc, [
        ("English (EN)", "Default language, primary documentation, fallback for missing translations"),
        ("Bahasa Malaysia (BM)", "Full translation for mobile and web console, PDF reports in BM"),
        ("中文 (ZH)", "Full translation for mobile and web console, PDF reports in 中文 (Simplified Chinese)"),
    ])
    add_p(doc, "Translation coverage includes: UI labels, buttons, menu items, error messages, notification text, PDF report headers/footers, email templates.")
    add_p(doc, "Users SHALL be able to switch language in settings screen (mobile) or console profile menu (web) with immediate effect.")
    page_break(doc)
    
    # 15. ACCESS AND ROLES
    add_h1(doc, "15  Access and Roles")
    add_p(doc, "The system SHALL enforce role-based access control with three primary roles:")
    add_grid_table(doc, ["Role", "Mobile Access", "Web Console Access", "Key Permissions"], [
        ["Security Officer", "✓ Full", "✗ No access", "Clock, scan checkpoints, register visitors, view own history"],
        ["Admin", "✓ Full", "✓ Read + Export", "All Security permissions + view rosters, export logs, browse team"],
        ["Super Admin", "✓ Full", "✓ Full CRUD", "All Admin permissions + manage sites, checkpoints, users, system config"],
    ])
    add_p(doc, "Role assignment SHALL be performed by Super Admin users only. Security Officers and Admin users SHALL NOT be able to change their own role or other users' roles.")
    page_break(doc)
    
    # 16. ASSUMPTIONS AND CONSTRAINTS
    add_h1(doc, "16  Assumptions and Constraints")
    
    add_h3(doc, "16.1  Assumptions")
    add_bullet(doc, "Security officers have access to Android or iOS smartphones with GPS, camera, and 4G/WiFi connectivity.")
    add_bullet(doc, "Sites have reliable network coverage (4G or WiFi) for real-time data sync.")
    add_bullet(doc, "Checkpoints are equipped with printed QR codes in weatherproof enclosures.")
    add_bullet(doc, "Admin and Super Admin users have access to desktop or tablet browsers for web console.")
    add_bullet(doc, "Users are trained on APTNexus workflows before go-live.")
    
    add_h3(doc, "16.2  Constraints")
    add_bullet(doc, "Budget: Development and deployment within approved programme budget.")
    add_bullet(doc, "Timeline: Phase 1 delivery by Q1 2027 (User Requirements and UAT completion by October 2026).")
    add_bullet(doc, "Technology stack: React Native (mobile), React (web), Node.js (backend), PostgreSQL (database).")
    add_bullet(doc, "Compliance: Data retention and privacy in accordance with PDPA (Malaysia).")
    add_bullet(doc, "Infrastructure: Cloud hosting on AWS Singapore region (ap-southeast-1).")
    page_break(doc)
    
    # 17. ACCEPTANCE CRITERIA
    add_h1(doc, "17  Acceptance Criteria")
    add_p(doc, "The following criteria SHALL be met for User Acceptance Testing (UAT) sign-off:")
    
    add_number(doc, "AC-001: All Functional Requirements (FR-SEC-*, FR-ADM-*, FR-SAD-*, FR-XC-*) are implemented and tested with passing results.")
    add_number(doc, "AC-002: All Non-Functional Requirements (NFR-PERF-*, NFR-SEC-*, NFR-AVAIL-*, NFR-USE-*) are validated with documented performance metrics and security audit.")
    add_number(doc, "AC-003: Mobile application is deployed to staging environment and accessible to UAT testers via TestFlight (iOS) and APK (Android).")
    add_number(doc, "AC-004: Web console is deployed to staging environment (https://console-staging.aptnexus.com) with full functionality.")
    add_number(doc, "AC-005: Test accounts are provisioned for all three roles (Security Officer, Admin, Super Admin) with sample data (sites, checkpoints, users).")
    add_number(doc, "AC-006: UAT test cases (defined in APTNexus-UAT-Documentation.docx) are executed with minimum 95% pass rate.")
    add_number(doc, "AC-007: All Priority 1 and Priority 2 defects identified during UAT are resolved before sign-off.")
    add_number(doc, "AC-008: Multi-language support (EN/BM/ZH) is tested and validated for UI completeness.")
    add_number(doc, "AC-009: PDF export functionality (patrol logs, visitor logs) is tested with sample data and reviewed for formatting compliance.")
    add_number(doc, "AC-010: GPS trail recording and playback is tested with field patrol simulation.")
    add_number(doc, "AC-011: OCR visitor registration is tested with sample ID cards and vehicle plates with acceptable accuracy (>85%).")
    add_number(doc, "AC-012: System is stress-tested with 100 concurrent users and 1000 checkpoint scans without performance degradation.")
    add_number(doc, "AC-013: Backup and restore procedures are documented and validated with staging database.")
    add_number(doc, "AC-014: User training materials (videos, quick guides) are prepared and reviewed by stakeholders.")
    add_number(doc, "AC-015: Stakeholder sign-off is obtained from Operations Programme Lead, IT Support Team, and Site Managers.")
    
    add_p(doc, "")
    add_p(doc, "Upon completion of UAT and satisfaction of all acceptance criteria, the system SHALL be approved for production deployment and go-live.")
    
    # Save document
    output_path = OUT / "APTNexus-User_Requirement_Documentation.docx"
    doc.save(str(output_path))
    print(f"[OK] Generated: {output_path}")


def build_uat_documentation():
    """APTNexus UAT Documentation — mirrors 3RKU UAT structure."""
    doc = new_doc()
    
    # Title Page
    add_title_block(
        doc,
        "APTNexus",
        "User Acceptance Testing (UAT) Documentation"
    )
    add_p(doc, "")
    add_p(doc, "Prepared for:")
    add_p(doc, "APTNexus Operations Programme (Site Security)")
    add_p(doc, "")
    add_p(doc, "Version 1.0")
    add_p(doc, "14 October 2026")
    page_break(doc)
    
    # 1. DOCUMENT CONTROL
    add_h1(doc, "1  Document Control")
    
    add_h2(doc, "1.1  Document Information")
    add_kv_table(doc, [
        ("Document Title", "APTNexus User Acceptance Testing (UAT) Documentation"),
        ("Product", "APTNexus — Site Security Management Platform"),
        ("Version", "1.0"),
        ("Date", "14 October 2026"),
        ("Prepared for", "APTNexus Operations Programme (Site Security)"),
        ("Prepared by", "Satok Bridge Digital Sdn. Bhd."),
    ])
    
    add_h2(doc, "1.2  Distribution")
    add_grid_table(doc, ["Name", "Role", "Organization"], [
        ["Operations Programme Lead", "Sponsor", "APTNexus Operations Programme"],
        ["IT Support Manager", "Technical Lead", "IT Support Team"],
        ["Security Operations Manager", "UAT Lead", "Site Security Team"],
        ["Admin Supervisor", "UAT Tester", "Site Security Team"],
        ["Senior Security Officer", "UAT Tester", "Site Security Team"],
    ])
    
    add_h2(doc, "1.3  Revision History")
    add_grid_table(doc, ["Version", "Date", "Author", "Changes"], [
        ["0.1", "01 October 2026", "SBD Technical Team", "Initial draft"],
        ["0.5", "08 October 2026", "SBD Technical Team", "Test cases complete, review by stakeholders"],
        ["1.0", "14 October 2026", "SBD Technical Team", "Final version approved for UAT execution"],
    ])
    
    add_h2(doc, "1.4  Related Documents")
    add_bullet(doc, "APTNexus-User_Requirement_Documentation.docx")
    add_bullet(doc, "APTNexus-Technical-Specification.docx")
    add_bullet(doc, "APTNexus-API-Documentation.pdf")
    add_bullet(doc, "APTNexus-Deployment-Guide.docx")
    page_break(doc)
    
    # 2. TABLE OF CONTENTS
    add_h1(doc, "2  Table of Contents")
    add_toc(doc, [
        (1, "1  Document Control", "2"),
        (1, "2  Table of Contents", "3"),
        (1, "3  Introduction and Purpose", "4"),
        (2, "3.1  Purpose", "4"),
        (2, "3.2  Scope", "4"),
        (2, "3.3  Objectives", "5"),
        (2, "3.4  UAT Team", "5"),
        (2, "3.5  UAT Schedule", "6"),
        (1, "4  System Overview", "7"),
        (1, "5  Test Organisation Environment Criteria", "10"),
        (2, "5.1  UAT Roles and Accounts", "10"),
        (2, "5.2  Test Environment", "11"),
        (2, "5.3  Entry and Exit Criteria", "12"),
        (2, "5.4  Pass/Fail Criteria", "13"),
        (2, "5.5  Defect Severity", "13"),
        (1, "6  Four-Week Fine-Tuning Plan", "14"),
        (1, "7  Test Cases — Mobile Security Officer", "16"),
        (1, "8  Test Cases — Mobile Admin/Super Admin", "21"),
        (1, "9  Test Cases — Admin Dashboard (Web Console)", "25"),
        (1, "10  End-to-End Cross-System Journeys", "30"),
        (1, "11  Fine-Tuning Backlog", "33"),
        (1, "12  Defect Management", "34"),
        (1, "13  Weekly Status Reporting", "35"),
        (1, "14  Sign-Off", "36"),
        (1, "15  Appendices", "37"),
    ])
    page_break(doc)
    
    # 3. INTRODUCTION AND PURPOSE
    add_h1(doc, "3  Introduction and Purpose")
    
    add_h2(doc, "3.1  Purpose")
    add_p(doc, "This document defines the User Acceptance Testing (UAT) plan, test cases, and acceptance criteria for APTNexus, a comprehensive site security management platform.")
    add_p(doc, "UAT will validate that the system meets business requirements, functional specifications, and user expectations across three primary user roles: Security Officer, Admin, and Super Admin.")
    
    add_h2(doc, "3.2  Scope")
    add_p(doc, "UAT covers the following areas:")
    add_bullet(doc, "Mobile application (React Native / Expo) for Security Officers and Admin users")
    add_bullet(doc, "Web console (React) for Admin and Super Admin users")
    add_bullet(doc, "Backend API (Node.js) with authentication, authorization, and data management")
    add_bullet(doc, "GPS trail recording and playback")
    add_bullet(doc, "QR checkpoint scanning and patrol tracking")
    add_bullet(doc, "OCR-based gate visitor registration")
    add_bullet(doc, "PDF export for patrol logs and visitor logs")
    add_bullet(doc, "Multi-language support (EN/BM/ZH)")
    add_bullet(doc, "CRUD operations for sites, checkpoints, and users")
    add_bullet(doc, "Push notifications and inbox alerts")
    
    add_h2(doc, "3.3  Objectives")
    add_number(doc, "Verify that all functional requirements (FR-SEC-*, FR-ADM-*, FR-SAD-*, FR-XC-*) are implemented correctly.")
    add_number(doc, "Validate that non-functional requirements (performance, security, availability, usability) are met.")
    add_number(doc, "Ensure system reliability under realistic operational scenarios (multi-site, concurrent users).")
    add_number(doc, "Confirm multi-language support (EN/BM/ZH) with complete translation coverage.")
    add_number(doc, "Test end-to-end workflows: clock in → patrol → checkpoint scan → visitor registration → PDF export.")
    add_number(doc, "Identify and document defects, prioritize fixes, and re-test until acceptance criteria are satisfied.")
    add_number(doc, "Obtain stakeholder sign-off for production go-live.")
    
    add_h2(doc, "3.4  UAT Team")
    add_grid_table(doc, ["Name", "Role", "Responsibilities"], [
        ["Operations Programme Lead", "UAT Sponsor", "Approve UAT plan, sign-off, escalation decisions"],
        ["Security Operations Manager", "UAT Lead", "Coordinate testing, track progress, manage defect backlog"],
        ["Admin Supervisor", "Admin Tester", "Execute Admin test cases, validate PDF exports, review dashboards"],
        ["Senior Security Officer", "Security Tester", "Execute Security Officer test cases, field patrol simulation"],
        ["IT Support Manager", "Technical Support", "Provision test environment, troubleshoot issues, monitor logs"],
        ["SBD Technical Team", "Development Team", "Fix defects, deploy patches, support UAT environment"],
    ])
    
    add_h2(doc, "3.5  UAT Schedule")
    add_p(doc, "UAT is planned as a four-week programme with weekly milestones:")
    add_grid_table(doc, ["Week", "Focus Area", "Key Activities", "Deliverable"], [
        ["Week 1", "Access, Clock, Scan", "Test login, clock in/out, QR scan, GPS trail", "Week 1 Status Report"],
        ["Week 2", "Gate, Sites, Checkpoints", "Test visitor registration OCR, site/checkpoint CRUD", "Week 2 Status Report"],
        ["Week 3", "Team, Trails, PDF", "Test team roster, GPS trails, patrol/visitor PDF export", "Week 3 Status Report"],
        ["Week 4", "Regression, Sign-off", "Re-test all Priority 1 fixes, stakeholder demo, sign-off", "UAT Sign-off Certificate"],
    ])
    page_break(doc)
    
    # 4. SYSTEM OVERVIEW
    add_h1(doc, "4  System Overview")
    add_p(doc, "APTNexus is a hybrid mobile + web platform designed to streamline site security operations across multiple sites.")
    
    add_h2(doc, "4.1  Mobile Security Officer Journey")
    add_bullet(doc, "Launch app → Login → Clock In with GPS → View Home (duty timer, GPS status)")
    add_bullet(doc, "Scan QR checkpoint → Confirm scan (checkpoint name, area, time) → Add optional notes")
    add_bullet(doc, "Register gate visitor → Capture ID/plate with camera → OCR extraction → Review/Edit → Save visitor entry")
    add_bullet(doc, "View patrol history → Select past shift → View checkpoint scans + GPS trail replay")
    add_bullet(doc, "Clock Out → Confirm end of duty → View duty summary")
    add_bullet(doc, "Settings → Change language (EN/BM/ZH) → Update profile photo")
    add_figure(doc, "fig_user_journey.png", "Figure 4.1: Mobile Security Officer Journey")
    
    add_h2(doc, "4.2  Mobile Admin Journey")
    add_bullet(doc, "Launch app → Login → View Overview Desk (KPI cards: active duty, checkpoints scanned, visitors registered)")
    add_bullet(doc, "Browse Visitors Log → Apply date/site filters → View visitor details with photo")
    add_bullet(doc, "Export Visitors Log to PDF → Confirm PDF generated → Share/Download PDF")
    add_bullet(doc, "Browse Patrol Log → Apply date/site/officer filters → View checkpoint scans with Site/Checkpoint/Area/Scanned columns")
    add_bullet(doc, "Export Patrol Log to PDF → Confirm PDF generated with GPS map snapshots")
    add_bullet(doc, "View Sites → Browse site list → View checkpoints per site")
    add_bullet(doc, "View Team Roster → Browse officers → View officer profile with patrol history")
    
    add_h2(doc, "4.3  Web Console Super Admin Journey")
    add_bullet(doc, "Login to console → Dashboard Overview (KPIs, recent activity feed)")
    add_bullet(doc, "Navigate to Sites → Create new site (name, address, GPS, geofence) → Save")
    add_bullet(doc, "Navigate to Checkpoints → Create new checkpoint (name, site, area A-D, APT code) → Generate QR → Save")
    add_bullet(doc, "Download QR code sheet for site (PDF with all checkpoints)")
    add_bullet(doc, "Navigate to Users → Create new user (email, name, badge, role) → Send activation email")
    add_bullet(doc, "Edit user → Change role (Security/Admin/Super Admin) → Save")
    add_bullet(doc, "Deactivate user → Confirm → User status changed to Inactive")
    
    add_h2(doc, "4.4  Sites and Checkpoints with Areas (A-D)")
    add_p(doc, "Each site can have multiple checkpoints. Each checkpoint is assigned an area zone (A, B, C, or D) for granular tracking.")
    add_p(doc, "Example: Site 'Industrial Park Alpha' has checkpoints:")
    add_bullet(doc, "Checkpoint 'Main Gate' — Area A — APT-IPA-001")
    add_bullet(doc, "Checkpoint 'Warehouse 1' — Area B — APT-IPA-002")
    add_bullet(doc, "Checkpoint 'Warehouse 2' — Area B — APT-IPA-003")
    add_bullet(doc, "Checkpoint 'Perimeter East' — Area C — APT-IPA-004")
    add_bullet(doc, "Checkpoint 'Perimeter West' — Area D — APT-IPA-005")
    add_p(doc, "Patrol logs and PDF exports include Area column to show checkpoint distribution across zones.")
    
    add_h2(doc, "4.5  PDF Exports")
    add_p(doc, "Admin users can export two types of PDF reports:")
    add_h3(doc, "4.5.1  Patrol Log PDF")
    add_bullet(doc, "Columns: Date | Time | Officer Name | Site | Checkpoint | Area | Scanned On (timestamp)")
    add_bullet(doc, "Header: Site name, date range, report title, APTNexus logo")
    add_bullet(doc, "Footer: Page number, generated timestamp, APTNexus watermark")
    add_bullet(doc, "Includes GPS map snapshot for each checkpoint scan")
    
    add_h3(doc, "4.5.2  Visitor Log PDF")
    add_bullet(doc, "Columns: Date | Time | Gate | Visitor Name | ID Number | Vehicle Plate | Purpose | Host | Status (In/Out)")
    add_bullet(doc, "Header: Site name, date range, report title, APTNexus logo")
    add_bullet(doc, "Footer: Page number, generated timestamp, APTNexus watermark")
    add_bullet(doc, "Includes visitor photo thumbnail")
    page_break(doc)
    
    # 5. TEST ORGANISATION ENVIRONMENT CRITERIA
    add_h1(doc, "5  Test Organisation Environment Criteria")
    
    add_h2(doc, "5.1  UAT Roles and Accounts")
    add_p(doc, "The following test accounts have been provisioned in the UAT environment:")
    add_grid_table(doc, ["Username", "Role", "Assigned Site", "Password"], [
        ["security@aptnexus.test", "Security Officer", "Industrial Park Alpha", "(leave blank for execution)"],
        ["admin@aptnexus.test", "Admin", "Industrial Park Alpha", "(leave blank for execution)"],
        ["appadmin@aptnexus.test", "Admin", "Commercial Plaza Beta", "(leave blank for execution)"],
        ["sbd@aptnexus.test", "Super Admin", "All Sites", "(leave blank for execution)"],
        ["marcen@aptnexus.test", "Super Admin", "All Sites", "(leave blank for execution)"],
    ])
    add_p(doc, "Passwords will be provided separately via secure channel. Testers are required to change password on first login.")
    
    add_h2(doc, "5.2  Test Environment")
    add_h3(doc, "5.2.1  Mobile Application")
    add_bullet(doc, "iOS TestFlight link: (provided via email invitation)")
    add_bullet(doc, "Android APK download: https://staging.aptnexus.com/downloads/APTNexus-UAT.apk")
    add_bullet(doc, "Minimum device requirements: iOS 14+ / Android 10+, GPS, Camera, 4G/WiFi")
    
    add_h3(doc, "5.2.2  Web Console")
    add_bullet(doc, "URL: https://console-staging.aptnexus.com")
    add_bullet(doc, "Supported browsers: Chrome 100+, Firefox 100+, Safari 15+, Edge 100+")
    add_bullet(doc, "Recommended screen resolution: 1920x1080 (desktop), 1024x768 (tablet)")
    
    add_h3(doc, "5.2.3  Backend API")
    add_bullet(doc, "Base URL: https://api-staging.aptnexus.com/v1")
    add_bullet(doc, "API documentation: https://api-staging.aptnexus.com/docs")
    
    add_h3(doc, "5.2.4  Test Data")
    add_bullet(doc, "2 sites pre-configured: Industrial Park Alpha, Commercial Plaza Beta")
    add_bullet(doc, "10 checkpoints per site with area zones (A-D) and APT-referral codes")
    add_bullet(doc, "5 test users per role (Security Officer, Admin, Super Admin)")
    add_bullet(doc, "Sample patrol logs (last 30 days) and visitor logs (last 30 days)")
    
    add_h2(doc, "5.3  Entry and Exit Criteria")
    add_h3(doc, "5.3.1  Entry Criteria")
    add_bullet(doc, "All functional requirements (FR-SEC-*, FR-ADM-*, FR-SAD-*, FR-XC-*) are implemented and unit tested.")
    add_bullet(doc, "UAT environment is deployed and accessible to testers.")
    add_bullet(doc, "Test accounts and sample data are provisioned.")
    add_bullet(doc, "UAT team is trained and briefed on test plan.")
    add_bullet(doc, "No Priority 1 or Priority 2 defects remain open from system integration testing (SIT).")
    
    add_h3(doc, "5.3.2  Exit Criteria")
    add_bullet(doc, "All UAT test cases are executed with minimum 95% pass rate.")
    add_bullet(doc, "All Priority 1 defects are resolved and re-tested with passing results.")
    add_bullet(doc, "All Priority 2 defects are either resolved or documented with approved workarounds.")
    add_bullet(doc, "End-to-end cross-system journeys are tested and validated.")
    add_bullet(doc, "Performance, security, and usability NFRs are validated with documented evidence.")
    add_bullet(doc, "Stakeholder sign-off is obtained (Operations Programme Lead, IT Support Manager, Security Operations Manager).")
    
    add_h2(doc, "5.4  Pass/Fail Criteria")
    add_p(doc, "Each test case is evaluated with one of the following results:")
    add_kv_table(doc, [
        ("Pass", "Actual result matches expected result, no defects observed."),
        ("Fail", "Actual result does not match expected result, defect logged."),
        ("Blocked", "Test cannot be executed due to environment issue or dependency defect."),
        ("Not Tested", "Test case not yet executed."),
    ])
    
    add_h2(doc, "5.5  Defect Severity")
    add_p(doc, "Defects identified during UAT are classified by severity:")
    add_grid_table(doc, ["Severity", "Definition", "Resolution Target"], [
        ["Priority 1 (Critical)", "System crash, data loss, security breach, blocking functionality. No workaround.", "Fix within 24 hours"],
        ["Priority 2 (High)", "Major feature not working, significant impact on workflow. Workaround available.", "Fix within 3 days"],
        ["Priority 3 (Medium)", "Minor feature issue, cosmetic defect, low impact. Workaround exists.", "Fix before go-live or defer to next release"],
        ["Priority 4 (Low)", "Cosmetic issue, spelling error, minor UX improvement. No functional impact.", "Defer to backlog"],
    ])
    page_break(doc)
    
    # 6. FOUR-WEEK FINE-TUNING PLAN
    add_h1(doc, "6  Four-Week Fine-Tuning Plan")
    add_p(doc, "The UAT programme is structured as a four-week fine-tuning plan with weekly focus areas and milestones. This plan is adapted from the 3RKU UAT model and tailored to APTNexus workflows.")
    
    add_h2(doc, "6.1  Week 1: Access, Clock, Scan")
    add_p(doc, "Focus: Authentication, clock in/out, QR checkpoint scanning, GPS trail recording.")
    add_h3(doc, "6.1.1  Test Activities")
    add_bullet(doc, "Execute TC-MOB-SEC-001 to TC-MOB-SEC-015 (login, clock, scan)")
    add_bullet(doc, "Verify GPS accuracy and geofence validation")
    add_bullet(doc, "Test QR code decode speed and checkpoint confirmation")
    add_bullet(doc, "Validate GPS trail recording at 30-second intervals")
    add_h3(doc, "6.1.2  Success Criteria")
    add_bullet(doc, "All authentication test cases pass (login, password reset, session timeout)")
    add_bullet(doc, "Clock in/out with GPS validation works across 2 sites")
    add_bullet(doc, "QR checkpoint scan completes within 1 second of decode")
    add_bullet(doc, "GPS trail recorded and uploaded to server without data loss")
    add_h3(doc, "6.1.3  Deliverable")
    add_bullet(doc, "Week 1 Status Report with test results, defect summary, risk register")
    
    add_h2(doc, "6.2  Week 2: Gate Visitors, Sites, Checkpoints")
    add_p(doc, "Focus: OCR visitor registration, site/checkpoint CRUD, area zones (A-D), APT-referral codes.")
    add_h3(doc, "6.2.1  Test Activities")
    add_bullet(doc, "Execute TC-MOB-SEC-016 to TC-MOB-SEC-025 (gate visitor OCR)")
    add_bullet(doc, "Execute TC-WEB-SAD-001 to TC-WEB-SAD-020 (site and checkpoint CRUD)")
    add_bullet(doc, "Test OCR accuracy with sample ID cards and vehicle plates")
    add_bullet(doc, "Validate area zone assignment (A-D) and APT-referral code format")
    add_bullet(doc, "Test QR code generation and download (PDF sheet for site)")
    add_h3(doc, "6.2.2  Success Criteria")
    add_bullet(doc, "OCR extraction accuracy >85% for ID cards and vehicle plates")
    add_bullet(doc, "Super Admin can create, edit, delete sites and checkpoints without errors")
    add_bullet(doc, "Area zones (A-D) display correctly in patrol logs and PDF exports")
    add_bullet(doc, "APT-referral codes are unique per site and validate correctly")
    add_h3(doc, "6.2.3  Deliverable")
    add_bullet(doc, "Week 2 Status Report with OCR test results, CRUD validation, defect summary")
    
    add_h2(doc, "6.3  Week 3: Team, Trails, Inbox, PDF")
    add_p(doc, "Focus: Team roster, GPS trail playback, patrol/visitor PDF export, inbox notifications.")
    add_h3(doc, "6.3.1  Test Activities")
    add_bullet(doc, "Execute TC-MOB-ADM-001 to TC-MOB-ADM-015 (Admin dashboard, team roster)")
    add_bullet(doc, "Execute TC-WEB-ADM-001 to TC-WEB-ADM-020 (web console Admin features)")
    add_bullet(doc, "Test patrol log PDF export with Site/Checkpoint/Area/Scanned columns")
    add_bullet(doc, "Test visitor log PDF export with photo thumbnails")
    add_bullet(doc, "Validate GPS trail playback for past patrol sessions")
    add_bullet(doc, "Test push notifications and inbox alerts")
    add_h3(doc, "6.3.2  Success Criteria")
    add_bullet(doc, "Patrol log PDF includes all required columns and GPS map snapshots")
    add_bullet(doc, "Visitor log PDF includes visitor photos and correct status (In/Out)")
    add_bullet(doc, "GPS trail playback renders correctly on map with timestamps")
    add_bullet(doc, "Push notifications delivered within 1 minute of trigger event")
    add_h3(doc, "6.3.3  Deliverable")
    add_bullet(doc, "Week 3 Status Report with PDF samples, notification logs, defect summary")
    
    add_h2(doc, "6.4  Week 4: Regression Testing and Sign-Off")
    add_p(doc, "Focus: Re-test all Priority 1 fixes, regression testing, stakeholder demo, sign-off.")
    add_h3(doc, "6.4.1  Test Activities")
    add_bullet(doc, "Re-execute all failed test cases from Weeks 1-3")
    add_bullet(doc, "Execute TC-E2E-001 to TC-E2E-010 (end-to-end cross-system journeys)")
    add_bullet(doc, "Perform smoke testing across all roles (Security, Admin, Super Admin)")
    add_bullet(doc, "Validate multi-language support (EN/BM/ZH) with full translation check")
    add_bullet(doc, "Conduct stakeholder demo with live system walkthrough")
    add_bullet(doc, "Review fine-tuning backlog and defer non-critical items to post-go-live")
    add_h3(doc, "6.4.2  Success Criteria")
    add_bullet(doc, "All Priority 1 and Priority 2 defects resolved and re-tested with passing results")
    add_bullet(doc, "Regression test pass rate >95%")
    add_bullet(doc, "End-to-end journeys complete successfully without errors")
    add_bullet(doc, "Multi-language support validated for EN/BM/ZH")
    add_bullet(doc, "Stakeholder demo successful with positive feedback")
    add_h3(doc, "6.4.3  Deliverable")
    add_bullet(doc, "Week 4 Final Status Report with regression results, sign-off recommendation")
    add_bullet(doc, "UAT Sign-off Certificate signed by Operations Programme Lead")
    page_break(doc)
    
    # 7. TEST CASES - MOBILE SECURITY OFFICER
    add_h1(doc, "7  Test Cases — Mobile Security Officer")
    
    add_h2(doc, "7.1  Authentication and Launch")
    add_grid_table(doc, ["ID", "Title", "Steps", "Expected Result", "Result", "Tester", "Date"], [
        ["TC-MOB-SEC-001", "Launch app", "1. Tap APTNexus icon on home screen\n2. Observe splash screen", "App launches, splash screen displays logo, transitions to login within 3 seconds", "", "", ""],
        ["TC-MOB-SEC-002", "Login with valid credentials", "1. Enter username: security@aptnexus.test\n2. Enter password\n3. Tap Login", "Login successful, home screen displays with clock status", "", "", ""],
        ["TC-MOB-SEC-003", "Login with invalid password", "1. Enter username: security@aptnexus.test\n2. Enter wrong password\n3. Tap Login", "Error message: 'Invalid username or password'", "", "", ""],
        ["TC-MOB-SEC-004", "Password reset", "1. Tap 'Forgot Password?'\n2. Enter email\n3. Tap Submit", "Success message: 'Password reset link sent to email'", "", "", ""],
        ["TC-MOB-SEC-005", "Session timeout", "1. Login\n2. Wait 12+ hours\n3. Attempt action", "Session expires, redirect to login with message: 'Session expired, please login again'", "", "", ""],
    ])
    
    add_h2(doc, "7.2  Clock In/Out with GPS")
    add_grid_table(doc, ["ID", "Title", "Steps", "Expected Result", "Result", "Tester", "Date"], [
        ["TC-MOB-SEC-006", "Clock In at assigned site", "1. Navigate to Home\n2. Tap 'Clock In'\n3. Allow GPS permission\n4. Confirm location", "Clock In successful, duty timer starts, GPS location validated within geofence", "", "", ""],
        ["TC-MOB-SEC-007", "Clock In outside geofence", "1. Move >200m from site\n2. Tap 'Clock In'\n3. Confirm location", "Error message: 'You are outside the site geofence. Please move closer to the site to clock in.'", "", "", ""],
        ["TC-MOB-SEC-008", "Clock Out", "1. After clocked in\n2. Tap 'Clock Out'\n3. Confirm", "Clock Out successful, duty summary displays (duration, checkpoints scanned)", "", "", ""],
        ["TC-MOB-SEC-009", "View duty status", "1. After Clock In\n2. Observe Home screen", "Duty timer displays elapsed time (HH:MM:SS), GPS status shows 'Active'", "", "", ""],
        ["TC-MOB-SEC-010", "Prevent double Clock In", "1. Clock In at Site A\n2. Attempt Clock In at Site B", "Error message: 'You are already clocked in at [Site A]. Please clock out first.'", "", "", ""],
    ])
    
    add_h2(doc, "7.3  QR Checkpoint Scanning")
    add_grid_table(doc, ["ID", "Title", "Steps", "Expected Result", "Result", "Tester", "Date"], [
        ["TC-MOB-SEC-011", "Scan checkpoint QR", "1. Clock In\n2. Tap 'Scan Checkpoint'\n3. Point camera at QR code\n4. Wait for decode", "QR decoded within 1 second, checkpoint details display (name, area, APT code)", "", "", ""],
        ["TC-MOB-SEC-012", "Confirm checkpoint scan", "1. After QR decode\n2. Review details\n3. Tap 'Confirm Scan'", "Scan recorded with timestamp, GPS location, success message: 'Checkpoint [Name] scanned successfully'", "", "", ""],
        ["TC-MOB-SEC-013", "Add notes to scan", "1. After QR decode\n2. Tap 'Add Notes'\n3. Enter text: 'Inspection complete'\n4. Confirm", "Notes saved with scan record, displayed in patrol history", "", "", ""],
        ["TC-MOB-SEC-014", "Scan when not clocked in", "1. Ensure clocked out\n2. Tap 'Scan Checkpoint'", "Error message: 'You must clock in before scanning checkpoints.'", "", "", ""],
        ["TC-MOB-SEC-015", "Scan invalid QR code", "1. Clock In\n2. Scan non-APTNexus QR code", "Error message: 'Invalid checkpoint QR code.'", "", "", ""],
    ])
    
    add_h2(doc, "7.4  Gate Visitor Registration")
    add_grid_table(doc, ["ID", "Title", "Steps", "Expected Result", "Result", "Tester", "Date"], [
        ["TC-MOB-SEC-016", "Register visitor with ID OCR", "1. Clock In\n2. Tap 'Gate Visitor'\n3. Tap 'Capture ID'\n4. Take photo of ID card\n5. Wait for OCR", "OCR extracts name, ID number, success rate >85%", "", "", ""],
        ["TC-MOB-SEC-017", "Edit OCR results", "1. After OCR extraction\n2. Review fields\n3. Edit 'Name' field\n4. Tap Save", "Edited fields saved, visitor entry created", "", "", ""],
        ["TC-MOB-SEC-018", "Register visitor with vehicle plate", "1. Tap 'Gate Visitor'\n2. Tap 'Capture Vehicle'\n3. Take photo of plate\n4. Wait for OCR", "OCR extracts plate number, success rate >85%", "", "", ""],
        ["TC-MOB-SEC-019", "Add visitor purpose", "1. After OCR\n2. Enter 'Purpose': Delivery\n3. Enter 'Host': John Doe\n4. Save", "Visitor entry saved with purpose and host contact", "", "", ""],
        ["TC-MOB-SEC-020", "Visitor exit scan", "1. Browse active visitors\n2. Select visitor\n3. Tap 'Exit'\n4. Confirm", "Visitor status updated to 'Out', exit timestamp recorded", "", "", ""],
    ])
    
    add_h2(doc, "7.5  Patrol History and GPS Trail")
    add_grid_table(doc, ["ID", "Title", "Steps", "Expected Result", "Result", "Tester", "Date"], [
        ["TC-MOB-SEC-021", "View patrol history", "1. Navigate to 'History'\n2. Select date range: Last 7 days", "Patrol sessions grouped by date, checkpoint scans listed with time/location", "", "", ""],
        ["TC-MOB-SEC-022", "View GPS trail replay", "1. In History\n2. Select patrol session\n3. Tap 'View GPS Trail'", "Map displays GPS trail path with timestamps, playback controls available", "", "", ""],
        ["TC-MOB-SEC-023", "Filter history by date", "1. In History\n2. Select custom date range: 1-7 Oct 2026\n3. Apply filter", "Only patrol sessions within selected date range displayed", "", "", ""],
        ["TC-MOB-SEC-024", "View checkpoint scan details", "1. In History\n2. Select patrol session\n3. Tap checkpoint scan", "Checkpoint name, area, timestamp, GPS coordinates, notes displayed", "", "", ""],
        ["TC-MOB-SEC-025", "GPS trail upload", "1. Clock In\n2. Move around site for 10 minutes\n3. Check trail upload status", "GPS trail uploaded at 5-minute intervals, no data loss", "", "", ""],
    ])
    
    add_h2(doc, "7.6  Settings and Localization")
    add_grid_table(doc, ["ID", "Title", "Steps", "Expected Result", "Result", "Tester", "Date"], [
        ["TC-MOB-SEC-026", "Change language to BM", "1. Navigate to Settings\n2. Tap Language\n3. Select 'Bahasa Malaysia'\n4. Confirm", "All UI labels update to BM immediately, language preference persisted", "", "", ""],
        ["TC-MOB-SEC-027", "Change language to ZH", "1. In Settings\n2. Select '中文'\n3. Confirm", "All UI labels update to 中文 immediately", "", "", ""],
        ["TC-MOB-SEC-028", "Update profile photo", "1. In Settings\n2. Tap Profile Photo\n3. Select image from gallery\n4. Save", "Profile photo updated, displayed on Home and profile screens", "", "", ""],
        ["TC-MOB-SEC-029", "View profile details", "1. Navigate to Profile", "Name, badge number, assigned site, email displayed correctly", "", "", ""],
        ["TC-MOB-SEC-030", "Logout", "1. In Settings\n2. Tap 'Logout'\n3. Confirm", "User logged out, redirect to login screen", "", "", ""],
    ])
    page_break(doc)
    
    # 8. TEST CASES - MOBILE ADMIN/SUPER ADMIN
    add_h1(doc, "8  Test Cases — Mobile Admin/Super Admin")
    
    add_h2(doc, "8.1  Admin Overview Dashboard")
    add_grid_table(doc, ["ID", "Title", "Steps", "Expected Result", "Result", "Tester", "Date"], [
        ["TC-MOB-ADM-001", "View overview desk", "1. Login as admin@aptnexus.test\n2. Navigate to Home", "Dashboard displays KPI cards: Active Duty (count), Checkpoints Scanned Today (count), Visitors Registered Today (count)", "", "", ""],
        ["TC-MOB-ADM-002", "Recent activity feed", "1. On Dashboard\n2. Scroll to Recent Activity", "Latest clock ins, checkpoint scans, visitor entries listed with timestamps", "", "", ""],
        ["TC-MOB-ADM-003", "Site selector filter", "1. On Dashboard\n2. Tap Site dropdown\n3. Select 'Industrial Park Alpha'", "Dashboard metrics filtered to show only selected site data", "", "", ""],
        ["TC-MOB-ADM-004", "Checkpoint scan distribution", "1. On Dashboard\n2. View area chart", "Chart shows scan count by area zone (A, B, C, D)", "", "", ""],
    ])
    
    add_h2(doc, "8.2  Visitors Log and PDF Export (Mobile)")
    add_grid_table(doc, ["ID", "Title", "Steps", "Expected Result", "Result", "Tester", "Date"], [
        ["TC-MOB-ADM-005", "Browse visitors log", "1. Navigate to 'Visitors'\n2. View table", "Columns: Date | Time | Gate | Visitor Name | ID Number | Vehicle | Purpose | Host | Status", "", "", ""],
        ["TC-MOB-ADM-006", "Filter by date range", "1. In Visitors\n2. Tap Filter\n3. Select Last 7 days\n4. Apply", "Only visitors within last 7 days displayed", "", "", ""],
        ["TC-MOB-ADM-007", "Filter by site", "1. In Visitors\n2. Tap Filter\n3. Select Site: Commercial Plaza Beta\n4. Apply", "Only visitors at selected site displayed", "", "", ""],
        ["TC-MOB-ADM-008", "Export visitors to PDF", "1. Apply filters\n2. Tap 'Export PDF'\n3. Wait for generation", "PDF generated with filename: VisitorLog_[SiteName]_[DateRange].pdf, includes visitor photos", "", "", ""],
        ["TC-MOB-ADM-009", "View visitor details", "1. In Visitors\n2. Tap visitor row", "Visitor detail screen shows photo, ID scan image, entry/exit timestamps, purpose, host", "", "", ""],
    ])
    
    add_h2(doc, "8.3  Patrol Log and PDF Export (Mobile)")
    add_grid_table(doc, ["ID", "Title", "Steps", "Expected Result", "Result", "Tester", "Date"], [
        ["TC-MOB-ADM-010", "Browse patrol log", "1. Navigate to 'Patrols'\n2. View table", "Columns: Date | Time | Officer Name | Site | Checkpoint | Area | Scanned On", "", "", ""],
        ["TC-MOB-ADM-011", "Filter by officer", "1. In Patrols\n2. Tap Filter\n3. Select Officer: [Name]\n4. Apply", "Only selected officer's scans displayed", "", "", ""],
        ["TC-MOB-ADM-012", "Export patrol to PDF", "1. Apply filters\n2. Tap 'Export PDF'\n3. Wait for generation", "PDF generated with filename: PatrolLog_[SiteName]_[DateRange].pdf, includes Site/Checkpoint/Area/Scanned columns and GPS map snapshots", "", "", ""],
        ["TC-MOB-ADM-013", "View checkpoint scan details", "1. In Patrols\n2. Tap scan row", "Checkpoint name, area, timestamp, GPS coordinates, notes, map location displayed", "", "", ""],
    ])
    
    add_h2(doc, "8.4  View Sites and Checkpoints (Mobile)")
    add_grid_table(doc, ["ID", "Title", "Steps", "Expected Result", "Result", "Tester", "Date"], [
        ["TC-MOB-ADM-014", "Browse sites", "1. Navigate to 'Sites'\n2. View list", "All sites listed with name, address, geofence radius", "", "", ""],
        ["TC-MOB-ADM-015", "View checkpoints per site", "1. In Sites\n2. Tap site\n3. View checkpoints", "Checkpoints listed with name, area zone (A-D), APT-referral code, QR code preview", "", "", ""],
    ])
    
    add_h2(doc, "8.5  Team Roster (Mobile)")
    add_grid_table(doc, ["ID", "Title", "Steps", "Expected Result", "Result", "Tester", "Date"], [
        ["TC-MOB-ADM-016", "Browse team roster", "1. Navigate to 'Team'\n2. View list", "Officers listed with name, badge number, role, assigned site, status (on duty/off duty)", "", "", ""],
        ["TC-MOB-ADM-017", "View officer profile", "1. In Team\n2. Tap officer", "Officer profile displays photo, badge, patrol history summary, performance metrics", "", "", ""],
    ])
    page_break(doc)
    
    # 9. TEST CASES - ADMIN DASHBOARD (WEB)
    add_h1(doc, "9  Test Cases — Admin Dashboard (Web Console)")
    
    add_h2(doc, "9.1  Login and Navigation")
    add_grid_table(doc, ["ID", "Title", "Steps", "Expected Result", "Result", "Tester", "Date"], [
        ["TC-WEB-ADM-001", "Login to console", "1. Open https://console-staging.aptnexus.com\n2. Enter admin@aptnexus.test\n3. Enter password\n4. Click Login", "Login successful, redirect to dashboard", "", "", ""],
        ["TC-WEB-ADM-002", "Navigate sidebar menu", "1. After login\n2. Click each menu item: Dashboard, Duty, Patrols, Visitors, Inbox, Sites, Checkpoints, Trails, Users", "Each page loads correctly, breadcrumb updates", "", "", ""],
        ["TC-WEB-ADM-003", "Responsive layout", "1. Resize browser to tablet (1024x768)\n2. Observe layout", "Sidebar collapses to hamburger menu, content adapts responsively", "", "", ""],
    ])
    
    add_h2(doc, "9.2  Dashboard Overview")
    add_grid_table(doc, ["ID", "Title", "Steps", "Expected Result", "Result", "Tester", "Date"], [
        ["TC-WEB-ADM-004", "View KPI cards", "1. On Dashboard\n2. Observe KPI section", "Cards display: Active Duty Officers (count), Checkpoints Scanned Today (count), Visitors Registered Today (count)", "", "", ""],
        ["TC-WEB-ADM-005", "Recent activity feed", "1. On Dashboard\n2. Scroll to Activity Feed", "Latest 20 events listed (clock ins, scans, visitors) with timestamps, officer names, sites", "", "", ""],
        ["TC-WEB-ADM-006", "Area scan distribution chart", "1. On Dashboard\n2. View chart section", "Bar or pie chart shows checkpoint scan count by area zone (A, B, C, D)", "", "", ""],
    ])
    
    add_h2(doc, "9.3  Duty Roster")
    add_grid_table(doc, ["ID", "Title", "Steps", "Expected Result", "Result", "Tester", "Date"], [
        ["TC-WEB-ADM-007", "View duty roster", "1. Navigate to Duty\n2. View roster table", "Current duty roster displays with officer name, site, shift start/end, status (on duty/off duty)", "", "", ""],
        ["TC-WEB-ADM-008", "Filter by site", "1. In Duty\n2. Select site filter: Industrial Park Alpha\n3. Apply", "Roster filtered to show only officers assigned to selected site", "", "", ""],
        ["TC-WEB-ADM-009", "View duty calendar", "1. In Duty\n2. Click 'Calendar View'", "Calendar displays shift assignments by date (future enhancement: inline edit)", "", "", ""],
    ])
    
    add_h2(doc, "9.4  Patrols")
    add_grid_table(doc, ["ID", "Title", "Steps", "Expected Result", "Result", "Tester", "Date"], [
        ["TC-WEB-ADM-010", "Browse patrol log", "1. Navigate to Patrols\n2. View table", "Columns: Date | Time | Officer Name | Site | Checkpoint | Area | Scanned On", "", "", ""],
        ["TC-WEB-ADM-011", "Export patrol PDF", "1. Apply date filter: Last 30 days\n2. Click 'Export PDF'\n3. Wait for download", "PDF downloaded with filename: PatrolLog_[SiteName]_[DateRange].pdf, includes all filtered scans", "", "", ""],
        ["TC-WEB-ADM-012", "View scan on map", "1. In Patrols\n2. Click scan row\n3. Click 'View on Map'", "Map modal opens, displays GPS location with marker and timestamp", "", "", ""],
    ])
    
    add_h2(doc, "9.5  Visitors")
    add_grid_table(doc, ["ID", "Title", "Steps", "Expected Result", "Result", "Tester", "Date"], [
        ["TC-WEB-ADM-013", "Browse visitors log", "1. Navigate to Visitors\n2. View table", "Columns: Date | Time | Gate | Visitor Name | ID Number | Vehicle | Purpose | Host | Status (In/Out)", "", "", ""],
        ["TC-WEB-ADM-014", "Export visitors PDF", "1. Apply date filter: Today\n2. Click 'Export PDF'\n3. Wait for download", "PDF downloaded with visitor photos, correct status, header/footer formatting", "", "", ""],
        ["TC-WEB-ADM-015", "View visitor photo", "1. In Visitors\n2. Click visitor row", "Visitor detail modal opens, displays full photo, ID scan image, entry/exit timestamps", "", "", ""],
    ])
    
    add_h2(doc, "9.6  Inbox")
    add_grid_table(doc, ["ID", "Title", "Steps", "Expected Result", "Result", "Tester", "Date"], [
        ["TC-WEB-ADM-016", "View inbox", "1. Navigate to Inbox\n2. View notifications", "Notifications listed with timestamp, type, message, read/unread status", "", "", ""],
        ["TC-WEB-ADM-017", "Mark notification as read", "1. In Inbox\n2. Click notification\n3. Observe status", "Notification marked as read, bold styling removed", "", "", ""],
    ])
    
    add_h2(doc, "9.7  Sites and Checkpoints (Read-Only for Admin)")
    add_grid_table(doc, ["ID", "Title", "Steps", "Expected Result", "Result", "Tester", "Date"], [
        ["TC-WEB-ADM-018", "View sites", "1. Navigate to Sites\n2. View list", "Sites listed with name, address, geofence, no edit/delete buttons visible (read-only)", "", "", ""],
        ["TC-WEB-ADM-019", "View checkpoints", "1. Navigate to Checkpoints\n2. View list", "Checkpoints listed with name, site, area (A-D), APT code, no edit/delete buttons visible (read-only)", "", "", ""],
    ])
    
    add_h2(doc, "9.8  GPS Trails")
    add_grid_table(doc, ["ID", "Title", "Steps", "Expected Result", "Result", "Tester", "Date"], [
        ["TC-WEB-ADM-020", "View GPS trails", "1. Navigate to Trails\n2. Select officer and date\n3. Click 'View Trail'", "Map displays GPS trail path with timestamps, playback controls (play/pause/speed)", "", "", ""],
    ])
    
    add_h2(doc, "9.9  Super Admin CRUD Sites")
    add_grid_table(doc, ["ID", "Title", "Steps", "Expected Result", "Result", "Tester", "Date"], [
        ["TC-WEB-SAD-001", "Create new site", "1. Login as sbd@aptnexus.test\n2. Navigate to Sites\n3. Click 'New Site'\n4. Enter name, address, GPS, geofence\n5. Save", "Site created, appears in list, success message displayed", "", "", ""],
        ["TC-WEB-SAD-002", "Edit site", "1. In Sites\n2. Click Edit on site row\n3. Modify address\n4. Save", "Site updated, changes reflected in list", "", "", ""],
        ["TC-WEB-SAD-003", "Delete site (no checkpoints)", "1. In Sites\n2. Click Delete on site with no checkpoints\n3. Confirm", "Site deleted, confirmation message displayed", "", "", ""],
        ["TC-WEB-SAD-004", "Delete site (with checkpoints)", "1. In Sites\n2. Click Delete on site with checkpoints\n3. Observe warning", "Warning displayed: 'Site has [N] checkpoints. Delete all checkpoints first or cascade delete?'", "", "", ""],
        ["TC-WEB-SAD-005", "Validate geofence radius", "1. Create site\n2. Enter geofence: 10m (below minimum)\n3. Attempt Save", "Validation error: 'Geofence radius must be between 50m and 500m'", "", "", ""],
    ])
    
    add_h2(doc, "9.10  Super Admin CRUD Checkpoints")
    add_grid_table(doc, ["ID", "Title", "Steps", "Expected Result", "Result", "Tester", "Date"], [
        ["TC-WEB-SAD-006", "Create checkpoint", "1. Navigate to Checkpoints\n2. Click 'New Checkpoint'\n3. Enter name, site, area (B), APT code: APT-IPA-010\n4. Save", "Checkpoint created, QR code generated, appears in list", "", "", ""],
        ["TC-WEB-SAD-007", "Edit checkpoint area", "1. In Checkpoints\n2. Click Edit\n3. Change area from B to C\n4. Save", "Checkpoint updated, QR code regenerated, area displays as C in list", "", "", ""],
        ["TC-WEB-SAD-008", "Validate APT code format", "1. Create checkpoint\n2. Enter APT code: ABC (too short)\n3. Attempt Save", "Validation error: 'APT-referral code must be 8-12 alphanumeric characters'", "", "", ""],
        ["TC-WEB-SAD-009", "Validate APT code uniqueness", "1. Create checkpoint\n2. Enter APT code already used in same site\n3. Attempt Save", "Validation error: 'APT-referral code must be unique per site'", "", "", ""],
        ["TC-WEB-SAD-010", "Download QR code", "1. In Checkpoints\n2. Click checkpoint row\n3. Click 'Download QR Code'", "QR code image downloaded as PNG", "", "", ""],
        ["TC-WEB-SAD-011", "Bulk QR download (PDF)", "1. In Checkpoints\n2. Select site: Industrial Park Alpha\n3. Click 'Download All QR Codes (PDF)'", "PDF generated with all checkpoints for selected site, each checkpoint on separate page with name, area, APT code", "", "", ""],
        ["TC-WEB-SAD-012", "Delete checkpoint (recent scans)", "1. In Checkpoints\n2. Attempt delete on checkpoint with scans <24h ago\n3. Observe warning", "Warning: 'Checkpoint has recent scans. Delete anyway?'", "", "", ""],
        ["TC-WEB-SAD-013", "Delete checkpoint (no scans)", "1. In Checkpoints\n2. Delete checkpoint with no scans\n3. Confirm", "Checkpoint deleted, success message displayed", "", "", ""],
    ])
    
    add_h2(doc, "9.11  Super Admin CRUD Users")
    add_grid_table(doc, ["ID", "Title", "Steps", "Expected Result", "Result", "Tester", "Date"], [
        ["TC-WEB-SAD-014", "Create user", "1. Navigate to Users\n2. Click 'New User'\n3. Enter email, name, badge, role (Security Officer)\n4. Save", "User created, activation email sent, appears in list with status 'Pending Activation'", "", "", ""],
        ["TC-WEB-SAD-015", "Edit user role", "1. In Users\n2. Click Edit on user\n3. Change role from Security Officer to Admin\n4. Save", "User role updated, changes reflected in list", "", "", ""],
        ["TC-WEB-SAD-016", "Deactivate user", "1. In Users\n2. Click Deactivate on user\n3. Confirm", "User status changed to 'Inactive', user cannot login", "", "", ""],
        ["TC-WEB-SAD-017", "Reactivate user", "1. In Users\n2. Filter by status: Inactive\n3. Click Reactivate on user\n4. Confirm", "User status changed to 'Active', user can login", "", "", ""],
        ["TC-WEB-SAD-018", "Reset user password", "1. In Users\n2. Click Reset Password on user\n3. Confirm", "Temporary password generated, email sent to user", "", "", ""],
        ["TC-WEB-SAD-019", "Prevent self-delete", "1. Login as sbd@aptnexus.test\n2. In Users\n3. Attempt delete own account", "Error message: 'You cannot delete your own account'", "", "", ""],
        ["TC-WEB-SAD-020", "Audit log user actions", "1. After creating/editing/deleting users\n2. Navigate to Audit Log\n3. Filter by entity: Users", "All user management actions logged with timestamp, admin name, action type", "", "", ""],
    ])
    page_break(doc)
    
    # 10. END-TO-END JOURNEYS
    add_h1(doc, "10  End-to-End Cross-System Journeys")
    add_p(doc, "These test cases validate complete workflows across mobile app, web console, and backend API.")
    
    add_grid_table(doc, ["ID", "Title", "Steps", "Expected Result", "Result", "Tester", "Date"], [
        ["TC-E2E-001", "Complete patrol cycle", "1. Security Officer: Login mobile → Clock In → Scan 5 checkpoints → Clock Out\n2. Admin: Login console → View patrol log → Export PDF\n3. Verify: PDF contains all 5 scans with Site/Checkpoint/Area/Scanned columns", "All steps complete successfully, PDF accurate", "", "", ""],
        ["TC-E2E-002", "Visitor entry to exit", "1. Security Officer: Clock In → Register visitor (OCR ID) → Save entry\n2. Wait 2 hours (simulated)\n3. Security Officer: Scan visitor exit\n4. Admin: View visitor log → Export PDF\n5. Verify: PDF shows visitor with In/Out timestamps", "Visitor entry and exit recorded, PDF accurate", "", "", ""],
        ["TC-E2E-003", "Site and checkpoint setup", "1. Super Admin: Login console → Create new site 'Test Site Gamma'\n2. Create 4 checkpoints: Area A (APT-TSG-001), Area B (APT-TSG-002), Area C (APT-TSG-003), Area D (APT-TSG-004)\n3. Download QR PDF\n4. Security Officer: Print QR codes → Scan checkpoints in field\n5. Admin: View patrol log → Verify area distribution", "Site and checkpoints created, QR codes work, scans recorded with correct areas", "", "", ""],
        ["TC-E2E-004", "User onboarding", "1. Super Admin: Create user with role Security Officer\n2. Check email for activation link\n3. New user: Click link → Set password (enforce strong policy)\n4. Login mobile → Clock In → Scan checkpoint\n5. Admin: View team roster → Verify new user appears", "User created, activated, can login and perform duties", "", "", ""],
        ["TC-E2E-005", "GPS trail recording and review", "1. Security Officer: Clock In → Move around site for 15 minutes → Scan 3 checkpoints\n2. Clock Out\n3. Admin: Login console → Navigate to Trails → Select officer and date → View GPS trail\n4. Verify: Trail path displays checkpoint markers, playback works", "GPS trail recorded at 30s intervals, playback accurate", "", "", ""],
        ["TC-E2E-006", "Multi-language workflow", "1. Security Officer: Login mobile (EN) → Change language to BM → Clock In (UI in BM)\n2. Scan checkpoint (UI in BM) → Clock Out\n3. Admin: Login console (EN) → View patrol log → Export PDF\n4. Verify: PDF header/footer in EN, data accurate", "Language changes apply correctly, data integrity maintained", "", "", ""],
        ["TC-E2E-007", "Notification workflow", "1. Admin: Login console → Schedule shift for Security Officer (15 min from now)\n2. Wait for notification\n3. Security Officer: Receive push notification → Tap to open app → Clock In\n4. Admin: Receive inbox alert 'Officer [Name] clocked in at [Site]'\n5. Verify: Notifications delivered within 1 minute", "Push notification sent and received, inbox alert delivered", "", "", ""],
        ["TC-E2E-008", "Defect scenario: Missed checkpoint", "1. Security Officer: Clock In → Patrol for 30 min → Skip checkpoint X (expected in route)\n2. Admin: Receive inbox alert 'Checkpoint X missed during patrol'\n3. Admin: View patrol log → Identify gap\n4. Contact officer for follow-up\n5. Officer: Return to checkpoint X → Scan → Add notes 'Revisited after alert'", "Alert triggered, gap identified, resolved with notes", "", "", ""],
        ["TC-E2E-009", "Bulk checkpoint scan", "1. Security Officer: Clock In → Scan 20 checkpoints across all areas (A-D) in 1 hour\n2. Admin: View patrol log → Apply filter: Last 1 hour\n3. Export PDF → Verify: All 20 scans listed with Site/Checkpoint/Area/Scanned columns\n4. Review area distribution chart → Verify: Balanced distribution across A-D", "All 20 scans recorded, PDF accurate, chart displays correct distribution", "", "", ""],
        ["TC-E2E-010", "Concurrent users stress test", "1. 10 Security Officers: Login mobile → Clock In simultaneously\n2. Each officer: Scan 5 checkpoints over 10 minutes\n3. 5 Admin users: Login console → View patrol log (live data)\n4. Export PDF simultaneously\n5. Verify: No performance degradation, all scans recorded, PDFs generated <10 seconds", "System handles 100+ concurrent actions without errors", "", "", ""],
    ])
    page_break(doc)
    
    # 11. FINE-TUNING BACKLOG
    add_h1(doc, "11  Fine-Tuning Backlog")
    add_p(doc, "Items identified during UAT that are deferred to post-go-live or future releases:")
    
    add_grid_table(doc, ["ID", "Description", "Priority", "Target Release"], [
        ["FT-001", "Duty roster inline editing in web console (currently manual entry only)", "Medium", "Phase 1.1"],
        ["FT-002", "Biometric authentication option (fingerprint/face) for mobile login", "Low", "Phase 2"],
        ["FT-003", "Offline mode with full sync for mobile app (currently partial caching)", "High", "Phase 1.2"],
        ["FT-004", "Integration with payroll system for duty hours export", "Medium", "Phase 2"],
        ["FT-005", "Advanced analytics dashboard (patrol heatmaps, compliance metrics, trend charts)", "Medium", "Phase 1.2"],
        ["FT-006", "NFC checkpoint scanning (alternative to QR codes)", "Low", "Phase 2"],
        ["FT-007", "Automated shift rostering algorithm with AI optimization", "Low", "Phase 3"],
        ["FT-008", "Mobile app widget for quick clock in/out from home screen", "Low", "Phase 1.1"],
        ["FT-009", "Two-factor authentication (2FA) for Super Admin accounts", "High", "Phase 1.1"],
        ["FT-010", "Bulk user import from CSV for Super Admin", "Medium", "Phase 1.1"],
        ["FT-011", "Custom PDF report templates (configurable headers, logos, footers)", "Low", "Phase 2"],
        ["FT-012", "Visitor pre-registration portal (web form for hosts to register visitors in advance)", "Medium", "Phase 2"],
    ])
    page_break(doc)
    
    # 12. DEFECT MANAGEMENT
    add_h1(doc, "12  Defect Management")
    add_p(doc, "All defects identified during UAT are logged in the defect tracking system (Jira) with the following workflow:")
    
    add_h3(doc, "12.1  Defect Logging")
    add_bullet(doc, "Tester identifies defect during test execution")
    add_bullet(doc, "Tester creates Jira ticket with: Test Case ID, Title, Steps to Reproduce, Expected vs Actual Result, Severity, Screenshot/Logs")
    add_bullet(doc, "UAT Lead reviews and assigns priority (P1/P2/P3/P4)")
    add_bullet(doc, "Development team triages and estimates fix effort")
    
    add_h3(doc, "12.2  Defect Resolution")
    add_bullet(doc, "Developer fixes defect and deploys to UAT environment")
    add_bullet(doc, "Tester re-tests defect with original test case steps")
    add_bullet(doc, "If pass: Defect closed. If fail: Defect reopened with additional notes")
    add_bullet(doc, "All P1 and P2 defects must be resolved before UAT sign-off")
    
    add_h3(doc, "12.3  Defect Metrics")
    add_p(doc, "UAT Lead tracks defect metrics weekly:")
    add_bullet(doc, "Total defects logged (by severity: P1/P2/P3/P4)")
    add_bullet(doc, "Defects resolved vs open")
    add_bullet(doc, "Average resolution time (by severity)")
    add_bullet(doc, "Defect density (defects per test case)")
    add_bullet(doc, "Re-open rate (defects reopened after initial fix)")
    
    add_h3(doc, "12.4  Sample Defect Log Table")
    add_grid_table(doc, ["Defect ID", "Test Case", "Title", "Severity", "Status", "Assigned To", "Resolution"], [
        ["DEF-001", "TC-MOB-SEC-007", "Clock In outside geofence allows entry", "P1", "Resolved", "Backend Team", "Fixed GPS validation logic"],
        ["DEF-002", "TC-MOB-SEC-017", "OCR accuracy <50% for vehicle plates", "P2", "Resolved", "Mobile Team", "Improved OCR model"],
        ["DEF-003", "TC-WEB-ADM-012", "PDF export timeout for >500 records", "P2", "Open", "Backend Team", "In progress"],
        ["DEF-004", "TC-MOB-SEC-026", "BM translation missing for 'Settings'", "P3", "Resolved", "Mobile Team", "Added translation"],
        ["DEF-005", "TC-WEB-SAD-009", "APT code validation allows spaces", "P3", "Open", "Backend Team", "Pending fix"],
    ])
    page_break(doc)
    
    # 13. WEEKLY STATUS REPORTING
    add_h1(doc, "13  Weekly Status Reporting")
    add_p(doc, "UAT Lead provides weekly status reports to stakeholders with the following format:")
    
    add_h3(doc, "13.1  Report Template")
    add_kv_table(doc, [
        ("Report Period", "Week [N] (DD MMM - DD MMM 2026)"),
        ("UAT Lead", "[Name]"),
        ("Status", "Green / Amber / Red"),
    ])
    
    add_h3(doc, "13.2  Test Execution Summary")
    add_grid_table(doc, ["Metric", "Week 1", "Week 2", "Week 3", "Week 4"], [
        ["Test Cases Executed", "30", "35", "40", "50"],
        ["Pass", "27", "32", "38", "48"],
        ["Fail", "3", "3", "2", "2"],
        ["Blocked", "0", "0", "0", "0"],
        ["Pass Rate", "90%", "91%", "95%", "96%"],
    ])
    
    add_h3(doc, "13.3  Defect Summary")
    add_grid_table(doc, ["Severity", "Logged This Week", "Resolved This Week", "Open"], [
        ["P1 (Critical)", "1", "1", "0"],
        ["P2 (High)", "3", "2", "1"],
        ["P3 (Medium)", "5", "4", "1"],
        ["P4 (Low)", "2", "1", "1"],
    ])
    
    add_h3(doc, "13.4  Key Achievements")
    add_bullet(doc, "Completed Week [N] focus area: [Description]")
    add_bullet(doc, "All P1 defects resolved within 24 hours")
    add_bullet(doc, "[Other notable achievements]")
    
    add_h3(doc, "13.5  Issues and Risks")
    add_bullet(doc, "Issue: [Description] — Impact: [Impact] — Mitigation: [Plan]")
    add_bullet(doc, "Risk: [Description] — Probability: [Low/Med/High] — Mitigation: [Plan]")
    
    add_h3(doc, "13.6  Next Week Focus")
    add_bullet(doc, "Execute test cases for [Focus Area]")
    add_bullet(doc, "Re-test resolved P2 defects")
    add_bullet(doc, "[Other planned activities]")
    page_break(doc)
    
    # 14. SIGN-OFF
    add_h1(doc, "14  Sign-Off")
    add_p(doc, "Upon successful completion of UAT, the following stakeholders provide sign-off to approve the system for production go-live:")
    
    add_grid_table(doc, ["Name", "Role", "Signature", "Date"], [
        ["Operations Programme Lead", "Sponsor", "", ""],
        ["IT Support Manager", "Technical Lead", "", ""],
        ["Security Operations Manager", "UAT Lead", "", ""],
        ["Admin Supervisor", "Business User Representative", "", ""],
        ["Senior Security Officer", "End-user Representative", "", ""],
    ])
    
    add_p(doc, "")
    add_h3(doc, "14.1  Sign-Off Criteria Checklist")
    add_bullet(doc, "☐ All UAT test cases executed with minimum 95% pass rate")
    add_bullet(doc, "☐ All Priority 1 and Priority 2 defects resolved and re-tested")
    add_bullet(doc, "☐ All Priority 3 defects either resolved or documented with workarounds")
    add_bullet(doc, "☐ End-to-end cross-system journeys validated successfully")
    add_bullet(doc, "☐ Performance, security, availability NFRs validated with evidence")
    add_bullet(doc, "☐ Multi-language support (EN/BM/ZH) tested and verified")
    add_bullet(doc, "☐ PDF export functionality tested with sample data and approved formatting")
    add_bullet(doc, "☐ GPS trail recording and playback validated in field")
    add_bullet(doc, "☐ OCR visitor registration accuracy >85% validated")
    add_bullet(doc, "☐ Backup and restore procedures tested")
    add_bullet(doc, "☐ User training materials prepared and reviewed")
    add_bullet(doc, "☐ Production deployment plan approved")
    add_bullet(doc, "☐ Go-live readiness checklist complete")
    
    add_p(doc, "")
    add_p(doc, "By signing above, stakeholders confirm that APTNexus meets business requirements, functional specifications, and acceptance criteria, and is approved for production deployment and go-live.")
    page_break(doc)
    
    # 15. APPENDICES
    add_h1(doc, "15  Appendices")
    
    add_h2(doc, "15.1  UAT Accounts and Access")
    add_p(doc, "Test accounts have been provisioned with the following access levels:")
    add_grid_table(doc, ["Username", "Role", "Mobile Access", "Console Access", "Assigned Site"], [
        ["security@aptnexus.test", "Security Officer", "✓", "✗", "Industrial Park Alpha"],
        ["admin@aptnexus.test", "Admin", "✓", "✓ (Read + Export)", "Industrial Park Alpha"],
        ["appadmin@aptnexus.test", "Admin", "✓", "✓ (Read + Export)", "Commercial Plaza Beta"],
        ["sbd@aptnexus.test", "Super Admin", "✓", "✓ (Full CRUD)", "All Sites"],
        ["marcen@aptnexus.test", "Super Admin", "✓", "✓ (Full CRUD)", "All Sites"],
    ])
    
    add_h2(doc, "15.2  API Surface Overview")
    add_p(doc, "Key API endpoints used by mobile and web console:")
    add_grid_table(doc, ["Endpoint", "Method", "Description", "Auth Required"], [
        ["/v1/auth/login", "POST", "User login with email/password", "No"],
        ["/v1/auth/reset-password", "POST", "Request password reset", "No"],
        ["/v1/clock/in", "POST", "Clock in with GPS", "Yes"],
        ["/v1/clock/out", "POST", "Clock out", "Yes"],
        ["/v1/checkpoints/scan", "POST", "Record checkpoint scan", "Yes"],
        ["/v1/visitors", "POST", "Register gate visitor", "Yes"],
        ["/v1/patrols", "GET", "Fetch patrol logs", "Yes"],
        ["/v1/patrols/export-pdf", "GET", "Export patrol log PDF", "Yes (Admin+)"],
        ["/v1/sites", "GET/POST/PUT/DELETE", "CRUD sites", "Yes (Super Admin)"],
        ["/v1/checkpoints", "GET/POST/PUT/DELETE", "CRUD checkpoints", "Yes (Super Admin)"],
        ["/v1/users", "GET/POST/PUT/DELETE", "CRUD users", "Yes (Super Admin)"],
    ])
    
    add_h2(doc, "15.3  Smoke Test Pack")
    add_p(doc, "Quick smoke test for production deployment validation (15 minutes):")
    add_number(doc, "Mobile: Login → Clock In → Scan 1 checkpoint → Clock Out")
    add_number(doc, "Mobile: Register 1 gate visitor with OCR")
    add_number(doc, "Console: Login Admin → View dashboard KPIs")
    add_number(doc, "Console: Export patrol PDF (last 24 hours)")
    add_number(doc, "Console: Login Super Admin → Create 1 test checkpoint → Download QR code")
    
    add_h2(doc, "15.4  Go-Live Readiness Checklist")
    add_bullet(doc, "☐ Production environment deployed and smoke tested")
    add_bullet(doc, "☐ Production database backed up before go-live")
    add_bullet(doc, "☐ UAT test data purged from production")
    add_bullet(doc, "☐ Production user accounts provisioned (real officers, admins, super admins)")
    add_bullet(doc, "☐ Production sites and checkpoints configured")
    add_bullet(doc, "☐ Production QR codes printed and deployed to checkpoints")
    add_bullet(doc, "☐ Mobile app published to production channels (TestFlight, APK distribution)")
    add_bullet(doc, "☐ Web console DNS updated to production URL")
    add_bullet(doc, "☐ User training completed (videos, quick guides distributed)")
    add_bullet(doc, "☐ Support team briefed on incident response procedures")
    add_bullet(doc, "☐ Monitoring and alerting configured (API logs, error tracking, uptime)")
    add_bullet(doc, "☐ Rollback plan documented and tested")
    
    add_h2(doc, "15.5  Screen Inventory")
    add_p(doc, "Mobile app screens:")
    add_bullet(doc, "Login, Password Reset, Home (Clock Status), Scan Checkpoint, Gate Visitor, Patrol History, GPS Trail Replay, Settings, Profile, Logout")
    add_p(doc, "Web console screens:")
    add_bullet(doc, "Login, Dashboard, Duty Roster, Patrols, Visitors, Inbox, Sites, Checkpoints, GPS Trails, Users (Super Admin), Settings, Logout")
    
    # Save document
    output_path = OUT / "APTNexus-UAT-Documentation.docx"
    doc.save(str(output_path))
    print(f"[OK] Generated: {output_path}")


if __name__ == "__main__":
    print("=== APTNexus Documentation Generator ===")
    print(f"Output folder: {OUT}")
    print()
    
    print("[1/2] Building User Requirement Documentation...")
    build_user_requirements()
    print()
    
    print("[2/2] Building UAT Documentation...")
    build_uat_documentation()
    print()
    
    print("=== COMPLETE ===")
    print("Both documents generated successfully.")
    print(f"Location: {OUT}")
