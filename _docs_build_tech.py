"""Build APTNexus Mobile and Dashboard technical documentation."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from _docs_kit import (
    new_doc, add_title_block, add_doc_control, add_toc, add_h1, add_h2, add_h3,
    add_p, add_bullet, add_grid_table, add_figure, page_break, OUT, add_kv_table
)


def build_mobile_doc():
    """Generate APTNexus-Mobile-Documentation.docx"""
    doc = new_doc()
    
    # Title block
    add_title_block(doc, "APTNexus Mobile Application", "Technical Documentation")
    page_break(doc)
    
    # Document control
    add_doc_control(
        doc,
        product="APTNexus Mobile v1.0.2 (com.aptnexus.app)",
        prepared_for="APTNexus Operations Programme (Site Security)",
        title="APTNexus Mobile Application — Technical Documentation",
        related="APTNexus Dashboard Documentation, API Integration Guide",
        version="1.0",
        date="14 October 2026"
    )
    page_break(doc)
    
    # Contents
    toc_entries = [
        (1, "1. Purpose and scope", "4"),
        (2, "1.1 Document purpose", "4"),
        (2, "1.2 Target audience and scope", "4"),
        (1, "2. Architecture at a glance", "5"),
        (2, "2.1 System context", "5"),
        (2, "2.2 Layered mobile architecture", "6"),
        (2, "2.3 Boot and initialization flow", "7"),
        (2, "2.4 Deployment overview", "8"),
        (1, "3. Roles and navigation", "9"),
        (2, "3.1 Security officer interface", "9"),
        (2, "3.2 Admin and Super Admin interface", "10"),
        (2, "3.3 Navigation map and screen flow", "11"),
        (1, "4. Technology stack", "12"),
        (2, "4.1 Core frameworks and startup", "12"),
        (2, "4.2 API layer and connectivity", "13"),
        (1, "5. Backend and database", "14"),
        (2, "5.1 Integration with Admin API", "14"),
        (2, "5.2 Data synchronization", "15"),
        (1, "6. Data model", "16"),
        (2, "6.1 Entity relationships", "16"),
        (2, "6.2 Core collections", "17"),
        (1, "7. Languages and localization", "18"),
        (1, "8. Security officer functions", "19"),
        (2, "8.1 Home — Clock in/out with GPS trail", "19"),
        (2, "8.2 Patrol — QR scanning and history", "20"),
        (2, "8.3 Gate — Visitor OCR and logging", "21"),
        (2, "8.4 Settings — Profile and preferences", "22"),
        (1, "9. Admin and Super Admin mobile functions", "23"),
        (2, "9.1 Desk overview and activity dashboard", "23"),
        (2, "9.2 Sites and Areas management (Super Admin)", "24"),
        (2, "9.3 Checkpoints management (Super Admin)", "25"),
        (2, "9.4 Team roster and assignment", "26"),
        (2, "9.5 Visitors management and PDF export", "27"),
        (2, "9.6 Patrol reports with Site column PDF", "28"),
        (1, "10. Maps, QR codes, and checkpoint identity", "29"),
        (2, "10.1 Checkpoint JSON structure", "29"),
        (2, "10.2 APT- code format", "30"),
        (2, "10.3 Fixed Areas A-D", "31"),
        (1, "11. Authentication and session", "32"),
        (2, "11.1 Login flow", "32"),
        (2, "11.2 Token management", "33"),
        (1, "12. Integration with Admin Console", "34"),
        (1, "13. Security and deployment", "35"),
        (2, "13.1 Expo Application Services (EAS)", "35"),
        (2, "13.2 Android APK build with Gradle", "36"),
        (2, "13.3 iOS build via same Expo project", "37"),
        (1, "14. Technology alternatives and rationale", "38"),
        (1, "15. Glossary", "39"),
    ]
    add_toc(doc, toc_entries)
    page_break(doc)
    
    # 1. Purpose and scope
    add_h1(doc, "1. Purpose and scope")
    
    add_h2(doc, "1.1 Document purpose")
    add_p(doc, "This document provides a comprehensive technical overview of the APTNexus Mobile Application version 1.0.2, built for site security operations. The application enables security officers to perform duty clock-ins with GPS tracking, patrol checkpoint scanning via QR codes, visitor gate management with OCR, and real-time synchronization with the APTNexus Admin Console. It is designed for both Android and iOS platforms using a single cross-platform codebase.")
    add_p(doc, "The mobile application is a critical component of the APTNexus Operations Programme, serving as the primary interface for field security personnel and on-site administrators. This documentation covers architecture, technology choices, data flows, user roles, functional modules, security measures, and deployment procedures. It is intended to serve as the authoritative reference for technical teams, operations staff, and stakeholders involved in the implementation and maintenance of the APTNexus mobile ecosystem.")
    
    add_h2(doc, "1.2 Target audience and scope")
    add_p(doc, "The primary audience for this document includes software developers, system architects, DevOps engineers, quality assurance teams, and technical project managers responsible for the APTNexus platform. Security operations managers and IT support staff will also find value in understanding the mobile application's capabilities and integration points.")
    add_p(doc, "The scope encompasses the complete mobile application built with React Native 0.86 and Expo SDK 57, including the frontend user interface, API integration layer, authentication mechanisms, offline capabilities, and build/deployment processes. This document does not cover the backend API implementation in depth (refer to the APTNexus Dashboard Documentation for server-side details), but it does describe the API contracts and integration patterns used by the mobile client.")
    page_break(doc)
    
    # 2. Architecture at a glance
    add_h1(doc, "2. Architecture at a glance")
    
    add_h2(doc, "2.1 System context")
    add_p(doc, "APTNexus Mobile operates within a broader ecosystem that includes the Admin Console web application, the backend API server, and the MongoDB database. The mobile application communicates exclusively with the backend via RESTful HTTPS endpoints hosted at https://aptnexus-admin.sbd-one.com. All data persistence, business logic enforcement, and inter-user coordination occur on the server side; the mobile app functions as a rich client that presents data, captures user input, and synchronizes state with the cloud.")
    add_p(doc, "The system context diagram below illustrates the mobile application's position within the APTNexus architecture. Security officers and administrators interact with the mobile app on their devices, which in turn communicate with the Admin API. The API accesses the MongoDB database named 'aptnexus', which stores all operational data including user accounts, sites, checkpoints, duty records, patrol logs, visitor entries, and real-time GPS trails.")
    add_figure(doc, "fig_system_context.png", "Figure 1 — System context showing mobile app, API, and database relationships", width=6.2)
    
    add_h2(doc, "2.2 Layered mobile architecture")
    add_p(doc, "The mobile application is structured in a layered architecture to promote separation of concerns, testability, and maintainability. The presentation layer is implemented with React 19 functional components and hooks, utilizing React Navigation for stack-based and tab-based routing. The state management layer employs React Context API and local component state, avoiding heavy state management libraries to keep the bundle size small and the architecture straightforward.")
    add_p(doc, "The API integration layer consists of a centralized service module that wraps fetch calls, manages authentication tokens, handles error responses, and provides type-safe interfaces for all backend endpoints. This layer abstracts network concerns from the UI components, allowing the presentation layer to work with simple async functions and data models. The platform layer includes Expo modules for device capabilities such as GPS location (expo-location), camera access (expo-camera), barcode scanning (expo-barcode-scanner), image capture, and secure storage for authentication tokens.")
    add_figure(doc, "fig_layered_mobile.png", "Figure 2 — Layered mobile architecture with presentation, state, API, and platform layers", width=6.0)
    
    add_h2(doc, "2.3 Boot and initialization flow")
    add_p(doc, "When the application launches, the boot sequence begins with the Expo managed app entry point. The root component checks for a stored authentication token in secure storage (AsyncStorage or SecureStore depending on platform). If a valid token is found, the app attempts to verify it with the backend by calling the /api/auth/verify endpoint. Upon successful verification, the user's profile and role are loaded, and the appropriate navigation stack (Security, Admin, or Super Admin) is initialized.")
    add_p(doc, "If no token is present or verification fails, the user is redirected to the login screen. After successful login, the token is stored securely, and the main application interface is rendered. The boot flow also includes initial data fetches for sites, checkpoints, and team rosters (for admins), which are cached locally to enable fast navigation and limited offline functionality. The initialization flow diagram illustrates these steps, including error recovery paths and token refresh logic.")
    add_figure(doc, "fig_boot_flow.png", "Figure 3 — Application boot and initialization sequence", width=6.0)
    
    add_h2(doc, "2.4 Deployment overview")
    add_p(doc, "Deployment of the APTNexus mobile application is managed through Expo Application Services (EAS), which provides cloud-based build infrastructure and over-the-air update capabilities. For Android, EAS Build compiles the project into an APK or AAB (Android App Bundle) using Gradle and the Android SDK, with signing handled via configured credentials. The resulting package is suitable for distribution via internal channels or enterprise app stores.")
    add_p(doc, "For iOS, the same Expo project is built for the Apple ecosystem using EAS Build with Xcode and iOS SDK tooling. The iOS build process requires valid provisioning profiles and certificates, which are managed within the EAS project configuration. Both platforms share a single JavaScript codebase, ensuring feature parity and reducing maintenance overhead. Over-the-air updates allow non-native code changes to be pushed to devices without requiring a full app store release, enabling rapid iteration and hotfixes.")
    add_figure(doc, "fig_deployment.png", "Figure 4 — Deployment pipeline showing EAS build for Android and iOS", width=6.2)
    page_break(doc)
    
    # 3. Roles and navigation
    add_h1(doc, "3. Roles and navigation")
    
    add_h2(doc, "3.1 Security officer interface")
    add_p(doc, "Security officers are the primary users of the mobile application in the field. Upon login, they are presented with a bottom tab navigator containing four main tabs: Home, Patrol, Gate, and Settings. The Home tab provides the clock-in and clock-out functionality, which records GPS coordinates at the time of duty start and end, and optionally logs a continuous GPS trail during the shift. The clock status is displayed prominently, along with shift duration and the officer's current site assignment.")
    add_p(doc, "The Patrol tab allows officers to scan QR codes at checkpoints using the device camera. Each scan records the checkpoint ID, site, area, timestamp, and the officer's GPS location, creating a verifiable audit trail of patrol rounds. The Patrol tab also displays a history of recent scans and allows officers to view their patrol statistics. The Gate tab is dedicated to visitor management: officers can scan vehicle registration plates or visitor ID documents using OCR, log entry and exit times, and associate visitors with specific sites and purposes.")
    add_p(doc, "The Settings tab provides access to the officer's profile, language preferences (English, Malay, Chinese), notification settings, and a logout option. Security officers have no access to administrative functions such as user management, site configuration, or report generation; their interface is streamlined for rapid field operations with minimal distraction.")
    
    add_h2(doc, "3.2 Admin and Super Admin interface")
    add_p(doc, "Administrators and Super Administrators access an extended set of features through a different tab layout. The Admin interface includes tabs for Home (dashboard overview), Teams (user roster and assignments), Visitors (visitor log and PDF export), and Patrol (patrol report generation with site-level detail). Admins can view aggregated activity, monitor live duty status, and generate compliance reports, but they cannot modify site structures or create checkpoints.")
    add_p(doc, "Super Admins have an additional layer of privileges, denoted by the 'manageOnly' flag in the backend. They can create, edit, and delete sites and checkpoints, manage user accounts, and configure system-wide settings. When a Super Admin creates a new site, the system automatically generates a default checkpoint in Area A, ensuring that every site has at least one scannable location. Super Admins can also assign checkpoints to specific areas (A, B, C, or D), which are fixed and cannot be customized—this constraint ensures consistency across the platform and simplifies reporting.")
    add_p(doc, "Both Admin and Super Admin roles can access the mobile app for on-the-go monitoring and management, but they typically use the web-based Admin Console for more intensive tasks such as bulk data imports, detailed analytics, and multi-site oversight. The mobile interface for admins is optimized for quick checks and urgent approvals rather than comprehensive data entry.")
    
    add_h2(doc, "3.3 Navigation map and screen flow")
    add_p(doc, "The navigation architecture is implemented using React Navigation 7, with a combination of stack navigators and tab navigators. For security officers, the root navigator is a bottom tab bar with four tabs, each backed by a stack navigator to allow drill-down screens (e.g., Patrol History Detail, Visitor Detail). For admins, a similar pattern is used with additional tabs and nested stacks.")
    add_p(doc, "The navigation map diagram provides a visual overview of all screens, their hierarchical relationships, and the transitions between them. Deep linking is supported for certain routes (e.g., opening a specific visitor record from a push notification), and the back button behavior is configured to respect the stack history while preventing accidental logouts. Modal screens are used for critical actions like clock-out confirmation and QR scan result display, ensuring that users complete or cancel these actions explicitly.")
    add_figure(doc, "fig_nav_map.png", "Figure 5 — Navigation map showing Security, Admin, and Super Admin screen flows", width=6.5)
    page_break(doc)
    
    # 4. Technology stack
    add_h1(doc, "4. Technology stack")
    
    add_h2(doc, "4.1 Core frameworks and startup")
    add_p(doc, "APTNexus Mobile is built on Expo SDK 57, which bundles React Native 0.86 and React 19. Expo provides a managed workflow that simplifies native module integration, build processes, and over-the-air updates, while still allowing custom native code via development builds when necessary. The choice of Expo SDK 57 ensures compatibility with the latest React Native performance improvements, including the new Fabric renderer and TurboModules architecture.")
    add_p(doc, "React 19 introduces concurrent rendering capabilities, automatic batching, and improved hooks, all of which contribute to smoother UI interactions and better responsiveness under load. The application is written entirely in JavaScript (ES2022 syntax with JSX), transpiled via Babel, and bundled with Metro. TypeScript is not currently used, but type annotations could be added in future versions for enhanced developer experience and compile-time safety.")
    add_p(doc, "The startup sequence leverages Expo's AppLoading component to defer rendering until critical assets (fonts, icons, authentication state) are ready. Splash screens are configured via app.json and automatically generated by EAS Build for both platforms. The root component initializes React Navigation's NavigationContainer and sets up the authentication state listener, which determines whether to render the login screen or the main app interface.")
    
    add_grid_table(doc, 
        ["Component", "Version", "Purpose"],
        [
            ["Expo SDK", "57", "Managed React Native framework with native modules"],
            ["React Native", "0.86", "Cross-platform mobile UI framework"],
            ["React", "19", "UI library with concurrent rendering and hooks"],
            ["React Navigation", "7.x", "Stack, tab, and modal navigation library"],
            ["expo-location", "17.x", "GPS and location services"],
            ["expo-camera", "15.x", "Camera access for QR and OCR"],
            ["expo-barcode-scanner", "13.x", "QR code scanning"],
            ["axios", "1.7.x", "HTTP client for API calls"],
            ["AsyncStorage", "@react-native-async-storage", "Persistent key-value storage"],
        ]
    )
    
    add_h2(doc, "4.2 API layer and connectivity")
    add_p(doc, "All server communication is handled through a centralized API service module (api.js) that wraps axios for HTTP requests. The base URL is configured as https://aptnexus-admin.sbd-one.com, and all endpoints are accessed via relative paths (e.g., /api/auth/login, /api/patrols, /api/visitors). The API module injects the JWT authentication token into the Authorization header for every request, and it handles token refresh when a 401 response is received.")
    add_p(doc, "Error handling is centralized within the API module: network failures, timeouts, and 5xx server errors trigger user-facing notifications and optional retry logic, while 4xx errors are parsed and displayed as contextual messages (e.g., 'Invalid credentials', 'Checkpoint not found'). The API module also implements request deduplication and caching for read-only endpoints like site lists and checkpoint configurations, reducing network overhead and improving perceived performance.")
    add_p(doc, "For real-time updates (e.g., live duty status changes, new visitor entries), the mobile app uses polling with exponential backoff rather than WebSockets, as the update frequency is low and the infrastructure complexity of maintaining WebSocket connections across mobile network transitions is not warranted at this stage. Future versions may introduce push notifications via Expo's notification service to enable instant alerts without polling.")
    page_break(doc)
    
    # 5. Backend and database
    add_h1(doc, "5. Backend and database")
    
    add_h2(doc, "5.1 Integration with Admin API")
    add_p(doc, "The mobile application depends entirely on the Admin API for data persistence and business logic. The API is a Node.js Express 5 application running on port 5190, backed by a MongoDB database named 'aptnexus'. The API exposes RESTful endpoints organized by domain: authentication (/api/auth), duty tracking (/api/track), patrols (/api/patrols), checkpoints (/api/checkpoints), sites (/api/sites), visitors (/api/visitors), users (/api/users), notifications (/api/notifications), schedules (/api/schedules), chat (/api/chat), and overview (/api/overview).")
    add_p(doc, "Each endpoint enforces role-based access control (RBAC) via middleware that inspects the JWT token's embedded role claim. For example, the POST /api/sites endpoint is restricted to Super Admins (manageOnly=true), while the GET /api/patrols/history endpoint is accessible to all authenticated users but returns only the records associated with the requester's sites and roles. The API validates all input data against predefined schemas, rejecting malformed or incomplete requests with descriptive error messages.")
    add_p(doc, "The mobile app never communicates directly with the MongoDB database; all reads and writes flow through the API layer. This architecture ensures that business rules, audit logging, and data integrity constraints are consistently enforced, regardless of whether the request originates from the mobile app, the web console, or a future third-party integration.")
    
    add_h2(doc, "5.2 Data synchronization")
    add_p(doc, "The mobile application caches frequently accessed data locally to enable fast UI rendering and limited offline functionality. For example, the list of sites, checkpoints, and team members is fetched once at app startup and stored in AsyncStorage. Subsequent screen loads read from the cache first, then refresh in the background if the data is stale (staleness is determined by a timestamp comparison with a configurable TTL, typically 5 minutes).")
    add_p(doc, "Offline support is partial: users can view cached data and navigate through the app, but actions that require server-side state changes (clock-in, patrol scan, visitor log) will fail gracefully with a 'No connection' message and an option to retry. The app does not implement a local queue for offline actions, as security operations require real-time verification and audit trails that cannot be reconstructed reliably from cached writes. Future enhancements may introduce a sync queue with conflict resolution for low-priority actions.")
    add_p(doc, "When connectivity is restored, the app automatically resumes polling and refreshes cached datasets. The user is notified via a toast message when new data is available or when a previously failed action has been successfully retried. This approach balances the need for responsiveness with the critical requirement for data accuracy and auditability in security contexts.")
    page_break(doc)
    
    # 6. Data model
    add_h1(doc, "6. Data model")
    
    add_h2(doc, "6.1 Entity relationships")
    add_p(doc, "The APTNexus data model is centered around the following core entities: User, Site, Checkpoint, Duty (clock records), Patrol (scan records), Visitor, Trail (GPS coordinates), Notification, Schedule, and Chat. A User belongs to one or more Sites and has a role (Security, Admin, Super Admin). Each Site contains multiple Checkpoints, and each Checkpoint is assigned to a fixed Area (A, B, C, or D). When a Super Admin creates a new Site, the system automatically generates a default Checkpoint in Area A to ensure every site is scannable from day one.")
    add_p(doc, "Duty records track clock-in and clock-out events, linking a User, Site, and GPS coordinates. Each clock-in initiates a Duty session, and subsequent GPS Trail records are appended to that session at regular intervals (configurable, typically every 60 seconds during active duty). Patrol records are created when a user scans a Checkpoint QR code; each Patrol includes the scanned Checkpoint's siteId, siteName, checkpoint name, area, timestamp, and GPS coordinates. This structure enables reporting at both the checkpoint and site level, with the Site column prominently displayed in exported PDF reports.")
    add_p(doc, "Visitors are logged with entry and exit timestamps, vehicle registration plate (extracted via OCR), site association, and the officer who performed the scan. Notifications are pushed to Admin and Super Admin users for events like missed patrols, unclocked duties, or visitor anomalies. Chat messages support team coordination, though this feature is lightly used and is not exposed in the mobile app's primary navigation for Security officers.")
    
    add_h2(doc, "6.2 Core collections")
    add_p(doc, "The MongoDB database 'aptnexus' contains the following primary collections, each corresponding to a data model entity. Field names and relationships are designed to support efficient querying and aggregation for reporting purposes.")
    
    add_grid_table(doc,
        ["Collection", "Key Fields", "Relationships"],
        [
            ["users", "_id, name, email, role, sites[], manageOnly", "Belongs to Site (via sites array)"],
            ["sites", "_id, name, address, areas[A,B,C,D]", "Has many Checkpoints, Users"],
            ["checkpoints", "_id, siteId, siteName, name, area, qrCode", "Belongs to Site, referenced by Patrol"],
            ["duties", "_id, userId, siteId, clockIn, clockOut, coords", "Belongs to User and Site, has many Trail"],
            ["trails", "_id, dutyId, timestamp, lat, lng", "Belongs to Duty session"],
            ["patrols", "_id, userId, checkpointId, siteId, siteName, area, scannedAt, coords", "Belongs to User, Checkpoint, Site"],
            ["visitors", "_id, siteId, plateNumber, entryTime, exitTime, officerId", "Belongs to Site, logged by User"],
            ["notifications", "_id, userId, type, message, read, createdAt", "Belongs to User"],
            ["schedules", "_id, siteId, userId, shiftStart, shiftEnd", "Belongs to User and Site"],
            ["chats", "_id, fromUserId, toUserId, message, timestamp", "User-to-user messaging"],
        ]
    )
    
    add_figure(doc, "fig_data_model.png", "Figure 6 — Entity-relationship diagram for APTNexus data model", width=6.5)
    page_break(doc)
    
    # 7. Languages and localization
    add_h1(doc, "7. Languages and localization")
    add_p(doc, "APTNexus Mobile supports three languages: English (en), Malay (ms), and Chinese (zh). The localization system is implemented using a lightweight i18n utility that loads JSON files containing key-value pairs for each language. The user's language preference is stored in AsyncStorage and applied at app startup. All UI strings, button labels, error messages, and notifications are externalized into the language files, ensuring that no hardcoded English text appears in the components.")
    add_p(doc, "The language selection is accessible from the Settings tab, where users can switch between English, Malay, and Chinese. The change takes effect immediately without requiring an app restart. Date and time formatting respects the device's locale settings, ensuring that timestamps are displayed in familiar formats (e.g., DD/MM/YYYY for Malay users, YYYY-MM-DD for Chinese users, MM/DD/YYYY for international English).")
    add_p(doc, "Translation coverage is complete for all user-facing screens and critical workflows (login, clock-in, patrol scan, visitor log). Administrative interfaces and error messages that are visible only to technical staff remain in English, as these users are assumed to be proficient in English. Future versions may extend multilingual support to include Tamil and other regional languages based on operational requirements.")
    page_break(doc)
    
    # 8. Security officer functions
    add_h1(doc, "8. Security officer functions")
    
    add_h2(doc, "8.1 Home — Clock in/out with GPS trail")
    add_p(doc, "The Home tab is the entry point for security officers starting and ending their shifts. The screen displays a large, prominent clock-in button when the officer is off-duty, and a clock-out button when on-duty. Upon tapping clock-in, the app requests GPS location permission (if not already granted) and captures the device's current latitude and longitude. These coordinates, along with the officer's user ID and assigned site ID, are sent to the POST /api/track/clockin endpoint. The server records the clock-in time (UTC timestamp) and creates a new Duty session.")
    add_p(doc, "While on-duty, the app periodically (every 60 seconds by default) captures GPS coordinates and sends them to the POST /api/track/trail endpoint, appending Trail records to the active Duty session. This creates a continuous GPS trail that can be visualized on a map in the Admin Console, allowing supervisors to verify patrol coverage and investigate incidents. The officer's device displays the elapsed duty time and provides a visual indicator (green pulsing icon) to confirm that GPS tracking is active.")
    add_p(doc, "When the officer taps clock-out, the app sends a POST /api/track/clockout request with the final GPS coordinates. The server updates the Duty record with the clockOut timestamp and closes the session. The total duty duration is calculated and displayed to the officer, along with a confirmation message. If the officer's GPS location at clock-out is significantly distant from the site's registered location (threshold configurable in Admin Console), a warning is logged for supervisor review, but the clock-out is still processed to avoid blocking legitimate off-site scenarios.")
    add_figure(doc, "fig_clock_flow.png", "Figure 7 — Clock-in/out flow with GPS trail recording", width=6.0)
    
    add_h2(doc, "8.2 Patrol — QR scanning and history")
    add_p(doc, "The Patrol tab enables security officers to scan QR codes placed at checkpoints throughout the site. When the officer taps the 'Scan Checkpoint' button, the app launches the device camera with the expo-barcode-scanner overlay. The scanner is configured to recognize QR code formats, and it highlights valid APTNexus checkpoint codes (beginning with 'APT-') in real-time. Upon successful scan, the app decodes the QR payload, which is a JSON object containing checkpointId, siteId, siteName, checkpoint name, and area.")
    add_p(doc, "The app then captures the officer's current GPS coordinates and sends a POST /api/patrols request with the scan data. The server validates that the checkpoint exists, that the officer is assigned to the checkpoint's site, and that the officer is currently on-duty (an active clock-in session must exist). If all checks pass, a Patrol record is created with the scanned timestamp, checkpoint details, site information (including siteId and siteName), area, and GPS coordinates. The officer receives immediate visual feedback (green checkmark and 'Scan successful' message) and an audio beep.")
    add_p(doc, "The Patrol tab also displays a scrollable history of the officer's recent scans, grouped by date. Each entry shows the checkpoint name, site name, area, scan timestamp, and a small map thumbnail indicating the GPS location. Tapping an entry opens a detail view with a full-size map, allowing the officer to review their patrol route. This history is cached locally for fast access and refreshed from the server whenever connectivity is available. Supervisors can view aggregated patrol reports in the Admin Console, which include the Site column prominently to support multi-site oversight.")
    add_figure(doc, "fig_patrol_flow.png", "Figure 8 — Patrol QR scan flow and server validation", width=6.0)
    
    add_h2(doc, "8.3 Gate — Visitor OCR and logging")
    add_p(doc, "The Gate tab provides visitor management functionality, allowing officers to log vehicle and pedestrian entries and exits. The primary workflow involves scanning a vehicle registration plate using the device camera and OCR. When the officer taps 'Log Entry', the app captures an image of the plate, sends it to a third-party OCR service (or an in-house OCR module if integrated), and extracts the plate number. The officer can review and correct the extracted text before confirming the entry.")
    add_p(doc, "Upon confirmation, a POST /api/visitors request is sent with the plate number, entry timestamp, site ID, and the officer's user ID. The server creates a Visitor record and returns a visitor ID. For pedestrian visitors or visitors without vehicles, the officer can manually enter a name or ID number. The Gate tab also displays a list of currently active visitors (those with entry times but no exit times), allowing the officer to quickly select and log an exit by tapping the visitor row and confirming the exit time.")
    add_p(doc, "Visitor logs are immediately synchronized with the Admin Console, where administrators can view real-time gate activity, generate visitor reports, and export PDF summaries. The PDF export includes columns for plate number, site name, entry time, exit time, duration, and the officer who logged the visit. This audit trail is essential for security compliance and incident investigation. The Gate tab also supports photo capture for visitor identification, storing the image as a base64-encoded string linked to the Visitor record.")
    add_figure(doc, "fig_visitor_flow.png", "Figure 9 — Visitor entry and exit flow with OCR", width=6.0)
    
    add_h2(doc, "8.4 Settings — Profile and preferences")
    add_p(doc, "The Settings tab provides access to the officer's profile information, including name, email, assigned sites, and role. Officers can update their display name and upload a profile photo (stored on the server and cached locally for offline display). Language preferences (English, Malay, Chinese) are selectable from a dropdown, and the change takes effect immediately across all screens.")
    add_p(doc, "Notification settings allow officers to enable or disable push notifications for shift reminders, patrol alerts, and visitor logs. The app uses Expo's notification module to register the device token with the backend, which stores it in the User collection. The Settings tab also includes a 'Logout' button, which clears the stored JWT token, deregisters the device for push notifications, and redirects the user to the login screen. A confirmation dialog prevents accidental logouts.")
    page_break(doc)
    
    # 9. Admin and Super Admin mobile functions
    add_h1(doc, "9. Admin and Super Admin mobile functions")
    
    add_h2(doc, "9.1 Desk overview and activity dashboard")
    add_p(doc, "Administrators access a 'Desk' (Home) tab that presents a real-time overview of operational activity across their assigned sites. The dashboard displays key performance indicators (KPIs) including the number of officers currently on-duty, total patrol scans today, visitor entries today, and any outstanding alerts or missed patrols. Each KPI is presented as a large, tappable card that navigates to a detailed view (e.g., tapping 'Officers on duty' opens a list of active officers with their clock-in times and current locations).")
    add_p(doc, "The Desk tab also includes a live activity feed showing recent events: clock-ins, patrol scans, visitor entries, and system notifications. This feed is refreshed via polling every 30 seconds and provides a quick pulse-check on site operations. Admins can filter the feed by site, event type, and time range. For Super Admins, the Desk tab includes additional controls for managing system-wide settings, viewing aggregated statistics across all sites, and accessing user management functions.")
    add_p(doc, "Unlike security officers, admins do not have access to the clock-in or patrol scan functions within the mobile app (these are reserved for field personnel). However, admins can view the same data in read-only mode and generate reports on demand. The mobile interface is optimized for monitoring and quick approvals rather than data entry, with the expectation that intensive administrative tasks are performed via the web-based Admin Console.")
    
    add_h2(doc, "9.2 Sites and Areas management (Super Admin)")
    add_p(doc, "Super Admins with manageOnly=true can create, edit, and delete sites from the mobile app. The Sites screen displays a list of all sites in the system, each showing the site name, address, and the number of associated checkpoints and users. Tapping a site opens a detail view with editable fields for name, address, and GPS coordinates (used for clock-in/out validation). Super Admins can also view a list of officers assigned to the site and reassign them to other sites.")
    add_p(doc, "When creating a new site, the Super Admin fills a form with site name, address, and optional GPS coordinates. Upon submission, the backend automatically generates a default checkpoint in Area A to ensure the site is immediately operational. The four fixed areas (A, B, C, D) are hard-coded in the system and cannot be renamed or deleted. This constraint simplifies reporting and ensures consistency across all sites, but it also means that sites with unique zoning requirements must map their internal zones to the four available areas.")
    add_p(doc, "Site deletion is a protected operation that requires confirmation and is only allowed if the site has no active duty sessions or pending visitor logs. Deleting a site also removes all associated checkpoints and reassigns users to a default 'Unassigned' site. This destructive action is logged in the audit trail and triggers a notification to all affected users. Regular admins (manageOnly=false) cannot access the site management functions and see a read-only list of sites instead.")
    
    add_h2(doc, "9.3 Checkpoints management (Super Admin)")
    add_p(doc, "Checkpoint management is another Super Admin exclusive function. The Checkpoints screen lists all checkpoints across all sites, with filters for site and area. Each checkpoint displays its name, assigned site, area (A, B, C, or D), and a preview of its QR code. Tapping a checkpoint opens a detail view where the Super Admin can edit the checkpoint name, reassign it to a different area (within the same site), and regenerate the QR code if needed.")
    add_p(doc, "Creating a new checkpoint requires selecting a site and area, entering a checkpoint name (e.g., 'North Gate', 'Warehouse Entrance'), and optionally specifying GPS coordinates for location-based validation. The backend generates a unique checkpoint ID in the format 'APT-{siteCode}-{sequentialNumber}' and creates a JSON payload containing checkpointId, siteId, siteName, checkpoint name, and area. This payload is encoded as a QR code and returned to the mobile app for display. The Super Admin can download or share the QR code image for printing and placement at the physical checkpoint location.")
    add_p(doc, "Checkpoints cannot be deleted if they have associated patrol scan records, as this would break the audit trail. Instead, checkpoints can be marked as 'inactive', which hides them from the patrol scan interface but preserves historical data. The QR code format is designed to be tamper-evident: the JSON payload includes a hash of the checkpoint data, and the server validates this hash on every scan to prevent spoofed or modified QR codes from being accepted.")
    
    add_h2(doc, "9.4 Team roster and assignment")
    add_p(doc, "The Teams tab in the Admin mobile interface provides access to the user roster, including all security officers, admins, and super admins. Each user entry displays the user's name, role, assigned sites, and current duty status (on-duty, off-duty, or inactive). Admins can filter the roster by role and site, and they can tap a user to view detailed information including recent duty history, patrol scan statistics, and contact information.")
    add_p(doc, "Super Admins can edit user profiles from the mobile app, including changing roles (promoting officers to admins or vice versa), reassigning users to different sites, and toggling the manageOnly flag to grant or revoke Super Admin privileges. User account creation and deletion are restricted to the web-based Admin Console for security reasons, as these operations require additional validation and approval workflows that are not suitable for the mobile interface.")
    add_p(doc, "The Teams tab also supports bulk actions such as assigning multiple users to a site or scheduling shifts. The shift scheduling feature integrates with the Schedule collection in the database, allowing admins to define shift start and end times for each user. The mobile app displays upcoming shifts and sends push notifications to remind users to clock in. However, the shift scheduling interface is more fully featured in the web console, and most admins use the mobile app primarily for quick roster lookups and on-the-go approvals rather than complex scheduling tasks.")
    
    add_h2(doc, "9.5 Visitors management and PDF export")
    add_p(doc, "The Visitors tab in the Admin mobile interface displays a comprehensive log of all visitor entries and exits across the admin's assigned sites. The list is sortable by entry time, exit time, site, and officer, with search functionality for finding specific plate numbers or visitor names. Each visitor entry shows the plate number, site name, entry and exit timestamps (if logged), duration, and the officer who performed the log.")
    add_p(doc, "Admins can tap a visitor entry to view detailed information including GPS coordinates at entry and exit, any photos captured during the log, and notes entered by the officer. From the detail view, admins can manually correct entry or exit times if errors were made, and they can add administrative notes for audit purposes. These corrections are logged in the audit trail and flagged for supervisor review.")
    add_p(doc, "The Visitors tab includes a 'Generate PDF' button that exports the current filtered list as a PDF report. The PDF includes columns for plate number, site name, entry time, exit time, duration, and officer name, and it is formatted for printing or email distribution. The PDF generation is performed server-side (the mobile app sends a POST /api/visitors/export request with filter parameters), and the resulting PDF is returned as a downloadable URL. The mobile app opens the PDF in the device's default viewer, allowing the admin to share or print it directly from their phone.")
    
    add_h2(doc, "9.6 Patrol reports with Site column PDF")
    add_p(doc, "The Patrol tab in the Admin mobile interface provides access to aggregated patrol scan reports across all sites. Unlike the security officer's patrol history (which shows only their own scans), the admin's patrol report displays all scans by all officers, grouped by site, checkpoint, and time range. The report includes columns for Site, Checkpoint, Area, Officer, Scanned On (timestamp), and GPS coordinates, with the Site column prominently displayed to support multi-site oversight.")
    add_p(doc, "Admins can filter the patrol report by date range, site, checkpoint, area, and officer, enabling targeted analysis of patrol coverage and compliance. The report view includes summary statistics such as total scans, unique checkpoints scanned, average scans per officer, and a heat map visualization (available in web console, simplified in mobile app) showing patrol density across areas and times of day.")
    add_p(doc, "Like the visitor report, the patrol report supports PDF export via a server-side endpoint. The exported PDF includes the Site column as the first column, followed by Checkpoint, Area, Scanned On, and Officer. This layout is specifically designed to match the reporting requirements of the APTNexus Operations Programme, ensuring that site-level accountability is immediately visible. The PDF is formatted in landscape orientation to accommodate the wide table, and it includes page headers with the report title, date range, and filter criteria.")
    page_break(doc)
    
    # 10. Maps, QR codes, and checkpoint identity
    add_h1(doc, "10. Maps, QR codes, and checkpoint identity")
    
    add_h2(doc, "10.1 Checkpoint JSON structure")
    add_p(doc, "Each checkpoint QR code encodes a JSON object that uniquely identifies the checkpoint and its context within the APTNexus system. The JSON structure includes the following fields: checkpointId (unique identifier in APT- format), siteId (MongoDB ObjectId of the parent site), siteName (human-readable site name for display), name (checkpoint name such as 'Main Entrance'), area (one of A, B, C, D), and an optional hash field for tamper detection.")
    add_p(doc, "When a security officer scans a checkpoint QR code, the mobile app decodes the JSON and validates the structure before sending it to the backend. The server performs additional validation: it verifies that the checkpointId exists in the database, that the siteId and siteName match the checkpoint's registered site, and that the hash (if present) is correct. If any validation fails, the scan is rejected with an error message ('Invalid checkpoint', 'Tampered QR code', etc.), and the rejection is logged in the audit trail.")
    add_p(doc, "The JSON structure is designed to be both human-readable (for debugging) and compact (to keep the QR code size small and easily scannable). The checkpoint name and site name are included in the JSON to allow the mobile app to display immediate feedback ('You scanned North Gate at Site Alpha') without waiting for a server round-trip. This improves user experience and reduces latency in the patrol workflow.")
    
    add_h2(doc, "10.2 APT- code format")
    add_p(doc, "The checkpoint ID format APT-{siteCode}-{sequentialNumber} is a human-friendly identifier that encodes the site context and provides a globally unique reference. The siteCode is a short alphanumeric string (typically 3-4 characters) derived from the site name (e.g., 'ALPHA' becomes 'ALPH', 'Beta Site' becomes 'BETA'). The sequentialNumber is a zero-padded integer (e.g., 001, 002, 099) that increments for each checkpoint created at the site.")
    add_p(doc, "This format ensures that checkpoint IDs are easy to communicate verbally ('APT-ALPH-001') and are self-documenting in reports and logs. The APT prefix distinguishes APTNexus checkpoints from other QR codes that might be present on site, reducing the risk of accidental scans. The backend enforces uniqueness of checkpoint IDs across all sites, and it prevents duplicate IDs by maintaining a sequence counter per site in the database.")
    add_p(doc, "When a Super Admin generates a new checkpoint, the backend automatically assigns the next available sequential number for the site. If a checkpoint is deleted, its ID is not reused, preserving the audit trail and avoiding confusion. The QR code image generated by the backend includes the checkpoint ID in text form below the QR symbol, allowing for manual entry if the QR code is damaged or unreadable.")
    
    add_h2(doc, "10.3 Fixed Areas A-D")
    add_p(doc, "APTNexus enforces a fixed set of four areas (A, B, C, D) for all sites, with no option to add, remove, or rename areas. This constraint simplifies reporting and ensures consistency across the platform, but it requires sites to map their internal zoning to the four available areas. For example, a site with six zones might map zones 1-2 to Area A, zones 3-4 to Area B, zones 5 to Area C, and zone 6 to Area D.")
    add_p(doc, "When a Super Admin creates a new site, the system automatically generates a default checkpoint in Area A. This ensures that every site has at least one scannable checkpoint from day one, preventing operational gaps. Super Admins can subsequently create additional checkpoints in any of the four areas, and they can reassign existing checkpoints to different areas (within the same site) as needed.")
    add_p(doc, "The fixed area model is reflected in all reports and exports: patrol reports include an Area column, visitor logs can be filtered by area, and the Admin Console's map visualizations use color-coding to distinguish areas. The choice of four areas balances granularity (enough to support meaningful zoning) with simplicity (few enough to avoid overwhelming users with options). Future versions of APTNexus may introduce configurable areas, but this would require significant changes to the data model and reporting infrastructure.")
    page_break(doc)
    
    # 11. Authentication and session
    add_h1(doc, "11. Authentication and session")
    
    add_h2(doc, "11.1 Login flow")
    add_p(doc, "The login flow begins when the user opens the app and is presented with the login screen (if no valid token is stored). The screen includes fields for email and password, with validation for email format and minimum password length. Upon tapping the 'Login' button, the app sends a POST /api/auth/login request with the credentials as JSON payload. The server validates the credentials against the users collection in MongoDB, checking that the email exists and that the password hash matches (using bcrypt).")
    add_p(doc, "If authentication succeeds, the server generates a JSON Web Token (JWT) containing the user's ID, email, role, sites array, and manageOnly flag. The JWT is signed with a secret key and has an expiration time of 14 days (SESSION_ACTIVE constant). The server returns the JWT in the response body, and the mobile app stores it securely using AsyncStorage (Android) or SecureStore (iOS). The app also stores the user's profile data (name, role, sites) in memory for fast access during the session.")
    add_p(doc, "If authentication fails, the server returns a 401 response with an error message ('Invalid email or password'). The mobile app displays this message to the user and does not store any token. After three failed login attempts, the server enforces a rate limit (5-minute lockout), and the mobile app displays a countdown timer before allowing another attempt. This mechanism prevents brute-force attacks while minimizing disruption to legitimate users who mistype their passwords.")
    add_figure(doc, "fig_auth_flow.png", "Figure 10 — Authentication flow with JWT token issuance and storage", width=6.0)
    
    add_h2(doc, "11.2 Token management")
    add_p(doc, "The JWT token is included in the Authorization header of every API request as 'Bearer {token}'. The backend middleware decodes and validates the token on each request, checking the signature and expiration time. If the token is expired, the server returns a 401 response with a specific error code ('TOKEN_EXPIRED'), and the mobile app automatically redirects to the login screen, prompting the user to re-authenticate.")
    add_p(doc, "Token refresh is not implemented in the current version; users must log in again after 14 days. This design choice balances security (limiting token lifetime) with user convenience (avoiding frequent logins). Future versions may introduce refresh tokens, allowing the app to obtain a new JWT without requiring the user to re-enter credentials, as long as the refresh token (with a longer expiration, e.g., 90 days) remains valid.")
    add_p(doc, "The mobile app clears the stored token when the user explicitly logs out, or when the token validation fails due to tampering or revocation (e.g., if a Super Admin deactivates the user account). Token revocation is implemented via a blacklist in the backend: when a user is deactivated or logs out from the web console, their current token's ID (JTI claim) is added to a blacklist collection, and subsequent requests with that token are rejected even if the token has not expired.")
    page_break(doc)
    
    # 12. Integration with Admin Console
    add_h1(doc, "12. Integration with Admin Console")
    add_p(doc, "The APTNexus Mobile Application and the Admin Console (web application) share the same backend API and database, ensuring data consistency and seamless integration. Actions performed in the mobile app (clock-ins, patrol scans, visitor logs) are immediately visible in the Admin Console, and vice versa. For example, if an admin creates a new checkpoint in the web console, security officers see the new checkpoint in their mobile app's patrol scan interface within seconds (subject to cache TTL).")
    add_p(doc, "The Admin Console provides a richer set of features than the mobile app, including advanced reporting, bulk data imports/exports, multi-site dashboards, real-time GPS trail visualization, and comprehensive user management. These features are optimized for desktop or tablet screens and are not replicated in the mobile app due to screen size constraints and the field-focused use case. Instead, the mobile app focuses on core operational workflows (clock-in, patrol, visitor log) and provides quick access to summary data and alerts.")
    add_p(doc, "Push notifications are used to alert mobile users of events originating from the Admin Console, such as shift reminders, new site assignments, or urgent messages from supervisors. The web console includes a notification composer that allows admins to send targeted messages to individual users, groups, or all users at a site. These messages are delivered via Expo's push notification service and are displayed as banners on the mobile device, even when the app is in the background.")
    add_p(doc, "The integration architecture is designed to support future expansions, such as third-party integrations (e.g., exporting data to payroll systems, integrating with access control hardware) and additional client applications (e.g., a supervisor tablet app with real-time dashboards). All such integrations would consume the same REST API, ensuring that the business logic and data integrity constraints remain centralized and consistent.")
    page_break(doc)
    
    # 13. Security and deployment
    add_h1(doc, "13. Security and deployment")
    
    add_h2(doc, "13.1 Expo Application Services (EAS)")
    add_p(doc, "Expo Application Services (EAS) is a cloud-based platform that streamlines the build, submission, and update processes for Expo-based React Native applications. APTNexus Mobile leverages EAS Build to compile the JavaScript codebase and native modules into distributable Android APK/AAB and iOS IPA packages. The build process is triggered via the Expo CLI command 'eas build --platform android' (or ios), which uploads the project source to EAS servers, runs the appropriate build tools (Gradle for Android, Xcode for iOS), and returns the compiled binary.")
    add_p(doc, "EAS Build handles complex native configuration automatically, including signing APKs with the configured keystore, managing provisioning profiles for iOS, and injecting environment-specific variables (API URLs, feature flags) at build time. The build configuration is defined in eas.json, which specifies build profiles for development, staging, and production. Each profile can override settings such as bundle identifier, version number, and environment variables, allowing the same codebase to produce multiple variants of the app.")
    add_p(doc, "EAS Update provides over-the-air (OTA) update capabilities, enabling non-native code changes (JavaScript, assets) to be pushed directly to installed apps without requiring a new build or app store submission. This is particularly useful for bug fixes, UI tweaks, and feature toggles. When the app launches, it checks for available updates and downloads them in the background. The next time the app is fully restarted, the new code is applied. EAS Update respects the app's version and platform, ensuring that updates are only delivered to compatible clients.")
    
    add_h2(doc, "13.2 Android APK build with Gradle")
    add_p(doc, "The Android build process uses Gradle as the build system, orchestrated by EAS Build. The project includes a standard Expo-managed Android directory structure (android/), which contains the app module, Gradle build scripts, and native configuration files. The build process compiles the JavaScript bundle using Metro, packages it into the APK along with native code and assets, and signs the APK with the keystore specified in eas.json or uploaded to EAS Secrets.")
    add_p(doc, "For production builds, the APK is optimized with ProGuard (code obfuscation) and minification (removing unused code and assets). The resulting APK is typically 25-35 MB in size, depending on included native modules and asset density. The APK can be distributed via internal channels (email, enterprise MDM systems) or uploaded to Google Play Store for broader distribution. The app package name is com.aptnexus.app, and the version code is incremented automatically by EAS Build for each release.")
    add_p(doc, "Gradle build configurations allow for multiple build variants (e.g., development with debug logging enabled, production with logging disabled). Environment-specific API URLs and feature flags are injected at build time via Gradle extra properties, which are read from eas.json profiles. This approach ensures that the same codebase can produce development, staging, and production builds without manual code changes.")
    
    add_h2(doc, "13.3 iOS build via same Expo project")
    add_p(doc, "The iOS build process follows a similar pattern to Android but uses Xcode and the iOS SDK. The Expo project includes an ios/ directory (managed by Expo) that contains the Xcode project file, Info.plist, and native configuration. EAS Build runs xcodebuild to compile the app, sign it with the provided provisioning profile and certificate, and produce an IPA file suitable for installation on iOS devices or submission to the App Store.")
    add_p(doc, "There is no separate APTNexusIOS project; both Android and iOS builds are generated from the same React Native codebase. Platform-specific code (when necessary) is handled via React Native's Platform module, which allows conditional imports and rendering based on the platform. For example, certain UI components use platform-specific styling, and some native modules (like camera or location services) have iOS-specific permission prompts and configurations.")
    add_p(doc, "iOS builds require valid Apple Developer credentials, including a provisioning profile and signing certificate. These are managed via EAS Secrets or Apple's developer portal and are automatically applied during the build process. The iOS app bundle identifier is com.aptnexus.app (matching the Android package name for consistency), and the version number is synchronized across platforms to simplify version management and release coordination.")
    page_break(doc)
    
    # 14. Technology alternatives and rationale
    add_h1(doc, "14. Technology alternatives and rationale")
    add_p(doc, "The decision to use Expo SDK 57 and React Native 0.86 was driven by several factors: the need for a single codebase supporting both Android and iOS, the requirement for rapid iteration and OTA updates, and the availability of mature native modules (location, camera, barcode scanning) within the Expo ecosystem. Alternative frameworks considered included Flutter, native iOS (Swift) and Android (Kotlin) development, and Progressive Web Apps (PWAs).")
    add_p(doc, "Flutter was rejected due to the team's existing expertise in JavaScript and React, and the perception that Expo's OTA update capability and managed workflow offered better operational flexibility. Native development was ruled out due to the cost and complexity of maintaining two separate codebases, and the longer development cycles required to implement feature parity. PWAs were considered but ultimately deemed unsuitable for the APTNexus use case, as the app requires deep integration with device hardware (GPS, camera, barcode scanner) and needs to function reliably in low-connectivity environments—both areas where PWAs have limitations compared to native apps.")
    add_p(doc, "For state management, the team chose React's built-in Context API and hooks over external libraries like Redux or MobX. This decision was based on the app's relatively simple state requirements (most state is ephemeral and tied to specific screens) and the desire to minimize dependencies and bundle size. For API communication, axios was selected over fetch due to its more ergonomic API, built-in request/response interceptors, and better error handling. These choices prioritize developer productivity and maintainability over theoretical purity or adherence to specific architectural patterns.")
    page_break(doc)
    
    # 15. Glossary
    add_h1(doc, "15. Glossary")
    add_grid_table(doc,
        ["Term", "Definition"],
        [
            ["Admin", "User role with access to monitoring, reporting, and limited management functions"],
            ["APK", "Android Package — distributable file format for Android apps"],
            ["Checkpoint", "Physical location with QR code for patrol scan verification"],
            ["Clock-in/Clock-out", "Start and end of a security officer's duty shift with GPS recording"],
            ["Duty", "A work session from clock-in to clock-out with GPS trail"],
            ["EAS", "Expo Application Services — cloud build and update platform"],
            ["Expo", "Framework for building React Native apps with managed workflow"],
            ["GPS Trail", "Sequence of GPS coordinates recorded during an active duty session"],
            ["JWT", "JSON Web Token — authentication token format with embedded claims"],
            ["manageOnly", "Flag indicating Super Admin privileges for site/checkpoint/user CRUD"],
            ["OCR", "Optical Character Recognition — text extraction from images"],
            ["OTA", "Over-The-Air — remote software update without app store submission"],
            ["Patrol", "Checkpoint scan event with timestamp, GPS, and site/area metadata"],
            ["QR Code", "Two-dimensional barcode encoding checkpoint JSON payload"],
            ["RBAC", "Role-Based Access Control — permissions based on user role"],
            ["React Native", "JavaScript framework for cross-platform mobile app development"],
            ["Security Officer", "Field personnel performing clock-in, patrol, and visitor logging"],
            ["Site", "Physical location with associated checkpoints and assigned users"],
            ["Super Admin", "User role with full CRUD access to sites, checkpoints, and users"],
            ["Trail", "GPS coordinate record appended to an active duty session"],
            ["Visitor", "Person or vehicle logged at site gate with entry/exit times"],
        ]
    )
    
    doc.save(OUT / "APTNexus-Mobile-Documentation.docx")
    print(f"Mobile doc saved: {OUT / 'APTNexus-Mobile-Documentation.docx'}")


def build_dashboard_doc():
    """Generate APTNexus-Dashboard-Documentation.docx"""
    doc = new_doc()
    
    # Title block
    add_title_block(doc, "APTNexus Admin Console", "Technical Documentation")
    page_break(doc)
    
    # Document control
    add_doc_control(
        doc,
        product="APTNexus Admin Console (Dashboard) — Port 5190",
        prepared_for="APTNexus Operations Programme (Site Security)",
        title="APTNexus Admin Console — Technical Documentation",
        related="APTNexus Mobile Documentation, API Reference Guide",
        version="1.0",
        date="14 October 2026"
    )
    page_break(doc)
    
    # Contents
    toc_entries = [
        (1, "1. Purpose and scope", "4"),
        (2, "1.1 Document purpose", "4"),
        (2, "1.2 Target audience and scope", "4"),
        (1, "2. Architecture", "5"),
        (2, "2.1 System context", "5"),
        (2, "2.2 Layered architecture for admin console", "6"),
        (2, "2.3 Request path and middleware", "7"),
        (1, "3. System context and user roles", "8"),
        (2, "3.1 Admin role", "8"),
        (2, "3.2 Super Admin role", "9"),
        (2, "3.3 Security officer (read-only access)", "10"),
        (1, "4. Technology stack", "11"),
        (2, "4.1 Backend — Express 5 and Mongoose", "11"),
        (2, "4.2 Frontend — Vite and React 19", "12"),
        (2, "4.3 Process management — PM2", "13"),
        (1, "5. Backend and database", "14"),
        (2, "5.1 REST API catalogue by domain", "14"),
        (2, "5.2 Authentication domain (/api/auth)", "15"),
        (2, "5.3 Duty tracking domain (/api/track)", "16"),
        (2, "5.4 Patrols domain (/api/patrols)", "17"),
        (2, "5.5 Checkpoints domain (/api/checkpoints)", "18"),
        (2, "5.6 Sites domain (/api/sites)", "19"),
        (2, "5.7 Visitors domain (/api/visitors)", "20"),
        (2, "5.8 Users domain (/api/users)", "21"),
        (2, "5.9 Notifications domain (/api/notifications)", "22"),
        (2, "5.10 Schedules domain (/api/schedules)", "23"),
        (2, "5.11 Chat domain (/api/chat)", "24"),
        (2, "5.12 Overview domain (/api/overview)", "25"),
        (2, "5.13 Support domain (/api/support)", "26"),
        (1, "6. Data model and KPI tracking", "27"),
        (2, "6.1 Core entities and relationships", "27"),
        (2, "6.2 KPI and activity metrics", "28"),
        (1, "7. Languages and localization", "29"),
        (1, "8. Functional architecture", "30"),
        (2, "8.1 Module boundaries and responsibilities", "30"),
        (2, "8.2 Admin Console sitemap", "31"),
        (1, "9. Console modules and pages", "32"),
        (2, "9.1 Dashboard — Overview and KPIs", "32"),
        (2, "9.2 Sites — Site management and configuration", "33"),
        (2, "9.3 Checkpoints — Checkpoint CRUD and QR generation", "34"),
        (2, "9.4 Teams — User roster and role management", "35"),
        (2, "9.5 Duty — Clock-in/out logs and GPS trails", "36"),
        (2, "9.6 Patrols — Scan logs and compliance reports", "37"),
        (2, "9.7 Visitors — Gate logs and PDF export", "38"),
        (2, "9.8 Schedules — Shift planning and assignments", "39"),
        (2, "9.9 Notifications — Alert management and history", "40"),
        (2, "9.10 Chat — Internal messaging (admin-only)", "41"),
        (2, "9.11 Settings — System configuration", "42"),
        (2, "9.12 Reports — Custom and scheduled exports", "43"),
        (1, "10. Authentication and session management", "44"),
        (2, "10.1 JWT token issuance and validation", "44"),
        (2, "10.2 Session lifecycle — 14-day SESSION_ACTIVE", "45"),
        (2, "10.3 Token blacklist and revocation", "46"),
        (1, "11. Maps, trails, and dwell analysis", "47"),
        (2, "11.1 GPS trail visualization", "47"),
        (2, "11.2 Dwell time calculation", "48"),
        (2, "11.3 Heat maps and density charts", "49"),
        (1, "12. Integration with mobile application", "50"),
        (2, "12.1 Shared API and database", "50"),
        (2, "12.2 Real-time data synchronization", "51"),
        (2, "12.3 Push notifications to mobile", "52"),
        (1, "13. Security, operations, and deployment", "53"),
        (2, "13.1 HTTPS and TLS configuration", "53"),
        (2, "13.2 PM2 process management", "54"),
        (2, "13.3 Deployment checklist", "55"),
        (1, "14. Technology alternatives and rationale", "56"),
        (1, "15. Glossary", "57"),
    ]
    add_toc(doc, toc_entries)
    page_break(doc)
    
    # 1. Purpose and scope
    add_h1(doc, "1. Purpose and scope")
    
    add_h2(doc, "1.1 Document purpose")
    add_p(doc, "This document provides comprehensive technical documentation for the APTNexus Admin Console (Dashboard), the web-based administrative interface for the APTNexus Operations Programme. The Admin Console is a full-stack web application that enables administrators and super administrators to monitor site security operations, manage users and sites, configure checkpoints, generate reports, and oversee real-time duty tracking and patrol compliance. It serves as the central command center for the APTNexus platform, complementing the mobile application used by field security personnel.")
    add_p(doc, "The dashboard is accessible at https://aptnexus-admin.sbd-one.com and provides a rich, responsive user interface optimized for desktop and tablet browsers. It is built with modern web technologies including Express 5 for the backend API, MongoDB for data persistence, React 19 with Vite for the frontend, and PM2 for process management. This documentation covers the system architecture, API design, data models, functional modules, security measures, and deployment procedures, serving as the authoritative reference for developers, system administrators, and technical stakeholders.")
    
    add_h2(doc, "1.2 Target audience and scope")
    add_p(doc, "The primary audience for this document includes backend and frontend developers, DevOps engineers, database administrators, security auditors, and technical project managers responsible for the APTNexus platform. Operations managers and senior administrators who require deep technical understanding of the system will also benefit from this documentation.")
    add_p(doc, "The scope encompasses the complete Admin Console application, including the backend REST API (Express 5 with Mongoose ODM), the frontend single-page application (React 19 with Vite bundler), the MongoDB database schema, authentication and authorization mechanisms, real-time data synchronization patterns, and operational deployment with PM2. This document does not cover the mobile application implementation (refer to APTNexus Mobile Documentation), but it does describe the API contracts and integration points that the mobile app consumes. Infrastructure concerns such as server provisioning, network configuration, and database backups are addressed at a high level, with references to separate operational runbooks where appropriate.")
    page_break(doc)
    
    # 2. Architecture
    add_h1(doc, "2. Architecture")
    
    add_h2(doc, "2.1 System context")
    add_p(doc, "The APTNexus Admin Console operates as the server-side component of the APTNexus ecosystem, providing both the backend API and the frontend web application. External actors include administrators and super administrators accessing the web interface via HTTPS, mobile application clients consuming the REST API, and the MongoDB database storing all operational data. The console does not integrate with external third-party services in the current version, though future enhancements may include integrations with payroll systems, SMS gateways, or cloud storage providers.")
    add_p(doc, "The system context diagram illustrates the relationships between the Admin Console, mobile clients, and the database. All data flows through the Express API layer, which enforces authentication, authorization, input validation, and business logic. The frontend SPA communicates with the backend via AJAX requests (using fetch or axios), rendering data in a responsive UI built with React components. The mobile application communicates with the same API endpoints, ensuring data consistency and reducing backend maintenance overhead.")
    add_figure(doc, "fig_system_context.png", "Figure 1 — System context showing Admin Console, mobile clients, and MongoDB", width=6.2)
    
    add_h2(doc, "2.2 Layered architecture for admin console")
    add_p(doc, "The Admin Console is structured in a classic three-tier architecture: presentation layer (React frontend), application layer (Express API with business logic), and data layer (MongoDB with Mongoose ODM). The presentation layer is a single-page application that runs entirely in the user's browser, communicating with the application layer via RESTful HTTPS requests. The application layer is stateless (aside from session tokens), enabling horizontal scaling by running multiple API server instances behind a load balancer.")
    add_p(doc, "The data layer is a MongoDB cluster (currently a single replica set, scalable to sharded clusters as data volume grows) that persists all entities: users, sites, checkpoints, duties, patrols, visitors, notifications, schedules, and chat messages. The Mongoose ODM provides schema validation, relationship management, and query abstraction, allowing the application layer to work with JavaScript objects rather than raw BSON documents. This separation of concerns ensures that database schema changes can be managed centrally without scattering SQL or query logic throughout the codebase.")
    add_figure(doc, "fig_layered_admin.png", "Figure 2 — Layered architecture: React SPA, Express API, Mongoose ODM, MongoDB", width=6.0)
    
    add_h2(doc, "2.3 Request path and middleware")
    add_p(doc, "When a user accesses the Admin Console at https://aptnexus-admin.sbd-one.com, the HTTPS request is terminated by an Nginx reverse proxy (or similar), which forwards it to the Express application listening on port 5190. The Express app first passes the request through a series of middleware functions: CORS headers are set to allow requests from the frontend origin, the body-parser middleware decodes JSON payloads, and the authentication middleware (authMiddleware.js) validates the JWT token in the Authorization header.")
    add_p(doc, "If the token is valid, the middleware attaches the decoded user object (with id, role, sites, manageOnly fields) to req.user, and the request proceeds to the route handler. If the token is missing or invalid, the middleware responds with 401 Unauthorized, and the frontend redirects to the login page. After authentication, role-based authorization middleware (roleMiddleware.js) checks if the user has the required role (e.g., Admin or Super Admin) to access the requested endpoint. If authorization fails, a 403 Forbidden response is returned.")
    add_p(doc, "The route handler (defined in routes/ directory) executes the business logic: it may query the database via Mongoose models, perform calculations, validate input against schemas (using express-validator), and construct a response. Errors are caught by a global error handler middleware that logs the error, sanitizes sensitive details, and returns a standardized error response to the client. This middleware pipeline ensures that cross-cutting concerns (auth, logging, error handling) are handled consistently across all endpoints.")
    page_break(doc)
    
    # 3. System context and user roles
    add_h1(doc, "3. System context and user roles")
    
    add_h2(doc, "3.1 Admin role")
    add_p(doc, "Administrators (role='Admin', manageOnly=false) have read and limited write access to the Admin Console. They can view dashboards, monitor duty status, access patrol and visitor logs, generate reports, and manage schedules for users within their assigned sites. Admins cannot create or delete sites, checkpoints, or user accounts—these privileged operations are reserved for Super Admins. The Admin role is intended for operations managers and site supervisors who need oversight and reporting capabilities but should not have the power to alter the fundamental structure of the system.")
    add_p(doc, "Admins can assign users to shifts, send notifications, export data to PDF or CSV, and view real-time GPS trails and heat maps. They can also edit certain user profile fields (e.g., contact information) and update visitor logs if errors were made during entry. All actions performed by Admins are logged in the audit trail, and Super Admins can review these logs to ensure compliance with operational policies.")
    
    add_h2(doc, "3.2 Super Admin role")
    add_p(doc, "Super Administrators (role='Admin', manageOnly=true) have unrestricted access to all features of the Admin Console. They can create, edit, and delete sites, checkpoints, and user accounts. They can promote users to Admin or demote them to Security Officer roles. They can configure system-wide settings such as GPS trail recording intervals, patrol compliance thresholds, and notification templates. Super Admins are typically IT managers or program directors who are responsible for the overall health and configuration of the APTNexus platform.")
    add_p(doc, "The manageOnly flag is the primary differentiator between Admins and Super Admins. This flag is checked by backend middleware and frontend UI components to conditionally render CRUD interfaces for sites, checkpoints, and users. Super Admins can also view aggregated statistics across all sites (whereas regular Admins see only their assigned sites), and they have access to advanced debugging tools such as raw database query results and API logs.")
    
    add_h2(doc, "3.3 Security officer (read-only access)")
    add_p(doc, "Security officers (role='Security') do not typically access the Admin Console web interface—they use the mobile application for all operational tasks. However, if a security officer navigates to the Admin Console URL and logs in with their credentials, they are granted read-only access to their own duty history, patrol logs, and profile. They cannot view other users' data, access administrative reports, or modify any settings. This read-only access is intended as a fallback for officers who may want to review their performance metrics or print personal reports.")
    add_p(doc, "Security officers have no inbox for notifications in the Admin Console (unlike admins, who receive an overview of system alerts). The mobile app is the primary channel for delivering alerts and messages to security officers, via push notifications and in-app banners. This design decision keeps the Admin Console streamlined for administrative workflows and avoids cluttering the interface with features that field personnel do not need.")
    page_break(doc)
    
    # 4. Technology stack
    add_h1(doc, "4. Technology stack")
    
    add_h2(doc, "4.1 Backend — Express 5 and Mongoose")
    add_p(doc, "The backend API is implemented with Express 5, a fast, minimalist web framework for Node.js. Express 5 introduces async error handling improvements, making it easier to write clean async/await route handlers without explicit try-catch boilerplate. The API server listens on port 5190 and serves RESTful endpoints organized by domain (auth, track, patrols, checkpoints, sites, visitors, users, notifications, schedules, chat, overview, support). Each domain is defined in a separate router module (routes/auth.js, routes/patrols.js, etc.) and registered with the main Express app.")
    add_p(doc, "Mongoose 8.x is used as the Object-Document Mapper (ODM) for MongoDB, providing schema definitions, validation, relationship management, and a fluent query API. Mongoose models are defined in the models/ directory (User.js, Site.js, Checkpoint.js, Duty.js, Patrol.js, Visitor.js, etc.), each with a schema that specifies field types, required fields, default values, and indexes. Mongoose middleware (pre/post hooks) is used for tasks like hashing passwords before saving (in User model) and updating denormalized fields (e.g., copying siteName from Site to Checkpoint when a Site is updated).")
    add_p(doc, "The choice of Express and Mongoose balances developer productivity (familiar JavaScript syntax, rich ecosystem of middleware and plugins) with performance (Node.js event loop handles concurrent requests efficiently, Mongoose query caching reduces database load). The async nature of Node.js is well-suited to the I/O-bound workload of the Admin Console, where most request time is spent waiting for database queries or external HTTP calls.")
    
    add_grid_table(doc,
        ["Component", "Version", "Purpose"],
        [
            ["Node.js", "20 LTS", "JavaScript runtime for server-side execution"],
            ["Express", "5.x", "Web framework for REST API"],
            ["Mongoose", "8.x", "MongoDB ODM with schema validation"],
            ["MongoDB", "7.x", "NoSQL document database"],
            ["bcrypt", "5.x", "Password hashing and verification"],
            ["jsonwebtoken", "9.x", "JWT token generation and validation"],
            ["express-validator", "7.x", "Request validation middleware"],
            ["cors", "2.x", "Cross-Origin Resource Sharing middleware"],
            ["dotenv", "16.x", "Environment variable management"],
        ]
    )
    
    add_h2(doc, "4.2 Frontend — Vite and React 19")
    add_p(doc, "The Admin Console frontend is a single-page application (SPA) built with React 19 and bundled with Vite 5. Vite provides a fast development server with hot module replacement (HMR) and an optimized production build pipeline that leverages native ES modules and Rollup for tree-shaking and code splitting. The SPA is served as static assets (index.html, JavaScript bundles, CSS, images) from the Express server's public/ directory, or from a CDN for production deployments.")
    add_p(doc, "React 19 introduces concurrent rendering, automatic batching, and improved hooks (useTransition, useDeferredValue) that enhance UI responsiveness when handling large datasets or frequent updates. The frontend codebase is organized into components (src/components/), pages (src/pages/), hooks (src/hooks/), and utilities (src/utils/). State management is handled with React Context API for global state (user session, site list) and local component state for UI-specific concerns (form inputs, modal visibility).")
    add_p(doc, "Routing is implemented with React Router 6, which provides nested routes, lazy loading, and programmatic navigation. The Admin Console uses a sidebar layout with top-level routes for Dashboard, Sites, Checkpoints, Teams, Duty, Patrols, Visitors, Schedules, Notifications, Chat, Settings, and Reports. Each page is code-split into its own bundle, loaded on-demand to keep the initial page load fast. API communication is handled via a centralized api.js module that wraps fetch, manages auth tokens, and provides type-safe (via JSDoc comments) interfaces for all endpoints.")
    
    add_grid_table(doc,
        ["Component", "Version", "Purpose"],
        [
            ["React", "19", "UI library with concurrent rendering"],
            ["Vite", "5.x", "Fast dev server and production bundler"],
            ["React Router", "6.x", "Client-side routing and navigation"],
            ["Chart.js", "4.x", "Charts and data visualization"],
            ["Leaflet", "1.9.x", "Interactive maps for GPS trail visualization"],
            ["date-fns", "3.x", "Date formatting and manipulation"],
            ["react-pdf", "7.x", "PDF generation and rendering"],
        ]
    )
    
    add_h2(doc, "4.3 Process management — PM2")
    add_p(doc, "The Admin Console backend is deployed as a Node.js process managed by PM2, a production-grade process manager that provides process monitoring, automatic restarts, log management, and cluster mode for load balancing. PM2 is configured via ecosystem.config.js, which specifies the entry point (server.js), environment variables, instance count (typically 2-4 instances for a multi-core server), and restart policies (restart on crash, restart on file changes in watch mode for development).")
    add_p(doc, "PM2 logs are written to /var/log/aptnexus/ (or a configurable path) and are rotated daily to prevent disk exhaustion. The logs include stdout (informational messages, request logs) and stderr (error stack traces, warnings). PM2 also exposes a monitoring dashboard (pm2 monit) that displays CPU, memory, and request rate metrics for each process instance, enabling real-time troubleshooting and capacity planning.")
    add_p(doc, "In production, PM2 runs the Admin Console in cluster mode, spawning multiple worker processes that share the same port (5190). Incoming requests are load-balanced across workers by the OS kernel's round-robin mechanism. If a worker crashes (e.g., due to an unhandled exception), PM2 automatically spawns a replacement worker, ensuring zero downtime. PM2 can also perform rolling restarts when deploying new code: it restarts workers one at a time, waiting for each to become healthy before restarting the next, avoiding service interruptions.")
    page_break(doc)
    
    # 5. Backend and database
    add_h1(doc, "5. Backend and database")
    
    add_h2(doc, "5.1 REST API catalogue by domain")
    add_p(doc, "The Admin Console API is organized into 12 functional domains, each exposed via a distinct URL prefix. This modular structure promotes maintainability, as each domain's routes, controllers, and business logic are co-located in a single directory. The domains are: Authentication (/api/auth), Duty Tracking (/api/track), Patrols (/api/patrols), Checkpoints (/api/checkpoints), Sites (/api/sites), Visitors (/api/visitors), Users (/api/users), Notifications (/api/notifications), Schedules (/api/schedules), Chat (/api/chat), Overview (/api/overview), and Support (/api/support).")
    add_p(doc, "Each domain exposes a standard set of CRUD endpoints (GET for read, POST for create, PUT/PATCH for update, DELETE for delete) plus domain-specific operations (e.g., POST /api/track/clockin for clock-in, POST /api/visitors/export for PDF generation). All endpoints return JSON responses with standardized structure: success responses have { success: true, data: {...} }, and error responses have { success: false, error: { code, message } }. This consistency simplifies client-side error handling and logging.")
    
    add_grid_table(doc,
        ["Domain", "Prefix", "Key Endpoints"],
        [
            ["Authentication", "/api/auth", "POST /login, POST /verify, POST /logout"],
            ["Duty Tracking", "/api/track", "POST /clockin, POST /clockout, POST /trail, GET /active"],
            ["Patrols", "/api/patrols", "POST /, GET /history, GET /report, POST /export"],
            ["Checkpoints", "/api/checkpoints", "POST /, GET /:id, PUT /:id, DELETE /:id, GET /site/:siteId"],
            ["Sites", "/api/sites", "POST /, GET /:id, PUT /:id, DELETE /:id, GET /list"],
            ["Visitors", "/api/visitors", "POST /, GET /:id, PUT /:id, GET /logs, POST /export"],
            ["Users", "/api/users", "POST /, GET /:id, PUT /:id, DELETE /:id, GET /roster"],
            ["Notifications", "/api/notifications", "POST /, GET /inbox, PUT /:id/read, DELETE /:id"],
            ["Schedules", "/api/schedules", "POST /, GET /user/:userId, PUT /:id, DELETE /:id"],
            ["Chat", "/api/chat", "POST /send, GET /conversation/:userId, GET /inbox"],
            ["Overview", "/api/overview", "GET /kpis, GET /activity, GET /alerts"],
            ["Support", "/api/support", "POST /ticket, GET /tickets, PUT /ticket/:id"],
        ]
    )
    
    add_h2(doc, "5.2 Authentication domain (/api/auth)")
    add_p(doc, "The authentication domain handles user login, token verification, and logout. POST /api/auth/login accepts { email, password } in the request body, validates the credentials against the users collection, and returns a JWT token with 14-day expiration (SESSION_ACTIVE=14d). The token is signed with a secret key (JWT_SECRET environment variable) and includes claims for userId, email, role, sites, and manageOnly. The mobile app and web frontend store this token and include it in the Authorization header (Bearer {token}) for all subsequent requests.")
    add_p(doc, "POST /api/auth/verify accepts a token in the Authorization header and returns the decoded user object if the token is valid. This endpoint is called at app startup (mobile) or page load (web) to restore the user session without requiring re-login. If the token is expired or invalid, a 401 response is returned, and the client redirects to the login screen. POST /api/auth/logout does not accept any payload; it simply adds the current token's JTI (JWT ID) to a blacklist collection in MongoDB, preventing the token from being used again even if it has not expired. This is a simple form of token revocation without requiring a distributed cache like Redis.")
    
    add_h2(doc, "5.3 Duty tracking domain (/api/track)")
    add_p(doc, "The duty tracking domain manages clock-in, clock-out, and GPS trail recording. POST /api/track/clockin accepts { userId, siteId, lat, lng } and creates a new Duty document with clockIn timestamp and initial GPS coordinates. The endpoint validates that the user is assigned to the site, that the user does not already have an active duty session, and that the GPS coordinates are within a reasonable distance of the site's registered location (configurable threshold, typically 500 meters). If validation passes, the server returns the duty ID, which the mobile app uses for subsequent trail updates.")
    add_p(doc, "POST /api/track/clockout accepts { dutyId, lat, lng } and updates the Duty document with clockOut timestamp and final GPS coordinates. The server calculates the total duty duration and stores it in the Duty record. If the clock-out location is significantly distant from the site, a warning flag is set, but the clock-out is still processed (to avoid blocking legitimate scenarios like officers responding to off-site incidents). POST /api/track/trail accepts { dutyId, lat, lng, timestamp } and appends a Trail document to the trails collection, linked to the Duty session. These trails are used to visualize the officer's movement on a map in the Admin Console.")
    add_p(doc, "GET /api/track/active returns a list of all currently active duty sessions (those with clockIn but no clockOut) across all sites that the requesting user has access to (filtered by user's role and site assignments). Admins use this endpoint to populate the 'Officers on duty' dashboard widget, which displays real-time duty status and allows supervisors to contact officers or review their GPS trails.")
    
    add_h2(doc, "5.4 Patrols domain (/api/patrols)")
    add_p(doc, "The patrols domain manages checkpoint scan records and compliance reporting. POST /api/patrols accepts { userId, checkpointId, siteId, siteName, checkpointName, area, lat, lng, scannedAt } and creates a Patrol document. The server validates that the checkpoint exists, that the officer is assigned to the checkpoint's site, and that the officer has an active duty session. The siteName and siteId are included explicitly in the Patrol record (denormalized) to simplify reporting queries—this avoids expensive joins when generating patrol reports that group by site.")
    add_p(doc, "GET /api/patrols/history accepts query parameters { userId, siteId, startDate, endDate } and returns a paginated list of Patrol records. This endpoint is used by the mobile app to display an officer's scan history and by the Admin Console to generate detailed patrol logs. GET /api/patrols/report is a more complex endpoint that aggregates patrol data: it returns total scans per site, scans per checkpoint, scans per officer, compliance rate (ratio of expected scans to actual scans, based on scheduled patrol routes), and time-of-day distribution. This data feeds the patrol compliance dashboard in the Admin Console.")
    add_p(doc, "POST /api/patrols/export accepts filter parameters { siteId, startDate, endDate, area } and generates a PDF report with columns for Site, Checkpoint, Area, Scanned On, and Officer. The PDF generation is performed server-side using a Node.js PDF library (e.g., pdfkit or puppeteer), and the resulting file is returned as a downloadable URL or base64 data. The inclusion of the Site column as the first column is a specific requirement to support multi-site oversight, allowing administrators to quickly identify which site each scan belongs to without scanning the entire table.")
    
    add_h2(doc, "5.5 Checkpoints domain (/api/checkpoints)")
    add_p(doc, "The checkpoints domain provides CRUD operations for checkpoint entities. POST /api/checkpoints (Super Admin only) accepts { siteId, name, area, lat, lng } and creates a new Checkpoint document. The server generates a unique checkpoint ID in APT-{siteCode}-{sequentialNumber} format, encodes a JSON payload { checkpointId, siteId, siteName, name, area } as a QR code (using a QR code library like qrcode), and stores the QR code image as a base64 string or file URL in the Checkpoint document. The response includes the checkpoint ID and QR code, which can be displayed in the Admin Console or printed for placement at the physical location.")
    add_p(doc, "GET /api/checkpoints/:id returns a single Checkpoint document, including its QR code and recent scan activity (count of patrols at this checkpoint in the last 7 days). PUT /api/checkpoints/:id (Super Admin only) allows updating the checkpoint name, area, or coordinates. Changing the area does not invalidate the QR code (the JSON payload is regenerated), but changing the site is disallowed (checkpoints cannot be moved between sites; they must be deleted and recreated). DELETE /api/checkpoints/:id (Super Admin only) marks the checkpoint as inactive (soft delete) rather than removing the document, preserving historical patrol references.")
    add_p(doc, "GET /api/checkpoints/site/:siteId returns all checkpoints for a given site, grouped by area (A, B, C, D). This endpoint is used to populate the checkpoint selection dropdown in the mobile patrol scan interface and to display a site's checkpoint map in the Admin Console. The response includes each checkpoint's recent scan count, allowing supervisors to identify checkpoints that are being under-patrolled.")
    
    add_h2(doc, "5.6 Sites domain (/api/sites)")
    add_p(doc, "The sites domain manages site entities and their relationships to users and checkpoints. POST /api/sites (Super Admin only) accepts { name, address, lat, lng } and creates a new Site document. The server automatically generates a default checkpoint in Area A to ensure the site is immediately operational. The site's name is used to derive a site code (e.g., 'Alpha Site' becomes 'ALPH'), which is used in checkpoint ID generation. GET /api/sites/:id returns a single site with its associated checkpoints, users, and recent activity (duty count, patrol count, visitor count in the last 7 days).")
    add_p(doc, "PUT /api/sites/:id (Super Admin only) allows updating the site name, address, or coordinates. Changing the name triggers a background job to update the siteName field in all associated Patrol and Checkpoint documents (denormalized data consistency). DELETE /api/sites/:id (Super Admin only) is a protected operation that requires confirmation: the site can only be deleted if it has no active duty sessions, no pending visitor logs, and all users have been reassigned to other sites. Deleting a site also soft-deletes all associated checkpoints.")
    add_p(doc, "GET /api/sites/list returns all sites accessible to the requesting user (filtered by role and site assignments). For Security Officers and Admins, this returns only their assigned sites; for Super Admins, this returns all sites in the system. The response includes summary statistics (checkpoint count, user count, active duty count) for each site, enabling quick assessment of site activity levels.")
    
    add_h2(doc, "5.7 Visitors domain (/api/visitors)")
    add_p(doc, "The visitors domain manages visitor entry and exit logging. POST /api/visitors accepts { siteId, plateNumber, entryTime, officerId, photo } and creates a Visitor document with entry timestamp and officer ID. The photo field is optional and stores a base64-encoded image of the vehicle plate or visitor ID. GET /api/visitors/:id returns a single visitor record with entry/exit details. PUT /api/visitors/:id allows updating the exit time, plate number (for corrections), or adding exit photos.")
    add_p(doc, "GET /api/visitors/logs accepts query parameters { siteId, startDate, endDate, status } where status can be 'active' (no exit time), 'exited' (has exit time), or 'all'. This endpoint returns a paginated list of visitors, used to populate the Visitors module in the Admin Console. Admins can filter by site, date range, and status to find specific visitors or generate daily gate logs.")
    add_p(doc, "POST /api/visitors/export generates a PDF report with columns for Plate Number, Site Name, Entry Time, Exit Time, Duration, and Officer. The PDF is formatted for printing and includes page headers with report metadata (date range, site, generated by). The export respects the admin's site access: only visitors from sites the admin is assigned to are included in the report. This ensures data privacy and prevents admins from viewing visitor logs from sites outside their jurisdiction.")
    
    add_h2(doc, "5.8 Users domain (/api/users)")
    add_p(doc, "The users domain provides CRUD operations for user accounts and role management. POST /api/users (Super Admin only) accepts { name, email, password, role, sites[], manageOnly } and creates a new User document. The password is hashed with bcrypt (10 rounds) before storage, and the email is validated for uniqueness. GET /api/users/:id returns a user's profile, excluding the password hash. PUT /api/users/:id (Super Admin only) allows updating name, role, sites, and manageOnly fields; password changes require a separate endpoint (POST /api/users/:id/change-password) for security and audit purposes.")
    add_p(doc, "DELETE /api/users/:id (Super Admin only) soft-deletes the user by setting an 'active' flag to false. Soft-deleted users cannot log in, but their historical records (duty, patrols, visitor logs) remain intact for audit purposes. GET /api/users/roster returns all users with optional filters for role, site, and active status. This endpoint powers the Teams module in the Admin Console, where admins can view user lists, filter by criteria, and bulk-assign users to sites or schedules.")
    
    add_h2(doc, "5.9 Notifications domain (/api/notifications)")
    add_p(doc, "The notifications domain manages system-generated and admin-sent notifications. POST /api/notifications (Admin/Super Admin only) accepts { userId, type, message } and creates a Notification document. The type field categorizes the notification (e.g., 'shift_reminder', 'missed_patrol', 'visitor_alert') and determines the delivery channel (in-app, push, email). GET /api/notifications/inbox returns all unread notifications for the requesting user, sorted by creation time descending.")
    add_p(doc, "PUT /api/notifications/:id/read marks a notification as read, removing it from the inbox but preserving it in the notifications history. DELETE /api/notifications/:id permanently removes a notification (typically used by admins to clear test notifications or spam). Notifications are delivered to mobile users via Expo push notifications, and to web users via in-app banners and a notifications panel in the Admin Console sidebar.")
    add_p(doc, "Security officers do not have an inbox in the Admin Console (they receive notifications exclusively via the mobile app), but admins and super admins see an overview panel that aggregates notifications across all users in their assigned sites. This allows supervisors to monitor system-wide alerts (e.g., 'Officer X has not clocked in for scheduled shift') and take corrective action.")
    
    add_h2(doc, "5.10 Schedules domain (/api/schedules)")
    add_p(doc, "The schedules domain manages shift planning and assignments. POST /api/schedules (Admin/Super Admin only) accepts { userId, siteId, shiftStart, shiftEnd, recurrence } and creates a Schedule document. The recurrence field supports daily, weekly, and custom patterns (e.g., 'Monday/Wednesday/Friday'). GET /api/schedules/user/:userId returns all scheduled shifts for a user, used by the mobile app to display upcoming shifts and send reminders.")
    add_p(doc, "PUT /api/schedules/:id allows admins to update shift times or recurrence. DELETE /api/schedules/:id removes a scheduled shift. The backend includes a cron job (implemented with node-cron) that runs every hour to check for upcoming shifts (within the next 2 hours) and sends push notifications to remind users to clock in. The cron job also checks for missed shifts (shift start time has passed but no clock-in recorded) and alerts admins.")
    
    add_h2(doc, "5.11 Chat domain (/api/chat)")
    add_p(doc, "The chat domain provides basic user-to-user messaging. POST /api/chat/send accepts { fromUserId, toUserId, message } and creates a Chat document. Messages are plaintext only (no rich media or attachments in the current version). GET /api/chat/conversation/:userId returns all messages between the requesting user and the specified user, sorted by timestamp. GET /api/chat/inbox returns a list of users the requesting user has recent conversations with, along with the last message timestamp and unread count.")
    add_p(doc, "Chat functionality is lightly used in the current system and is primarily accessed via the Admin Console (not exposed in the mobile app's main navigation for security officers). Admins use chat for quick coordination, such as asking officers to check a specific checkpoint or confirming visitor identities. All chat messages are stored in the database and are subject to audit review, so users are advised not to use chat for sensitive or personal communications.")
    
    add_h2(doc, "5.12 Overview domain (/api/overview)")
    add_p(doc, "The overview domain aggregates data for dashboard KPIs and activity feeds. GET /api/overview/kpis returns real-time counts for officers on duty, patrol scans today, visitor entries today, and active alerts. The counts are scoped to the requesting user's assigned sites (for Admins) or all sites (for Super Admins). GET /api/overview/activity returns a recent activity feed (last 50 events) including clock-ins, clock-outs, patrol scans, visitor logs, and system notifications.")
    add_p(doc, "GET /api/overview/alerts returns a list of actionable alerts that require admin attention, such as missed patrols (checkpoint expected to be scanned but was not), unclocked duties (scheduled shift with no clock-in), and visitor exceptions (visitor logged entry but no exit after 12 hours). Admins can dismiss alerts (POST /api/overview/alert/:id/dismiss) to remove them from the alert list once resolved.")
    add_figure(doc, "fig_kpi_activity.png", "Figure 3 — KPI dashboard showing duty, patrol, and visitor metrics", width=6.5)
    
    add_h2(doc, "5.13 Support domain (/api/support)")
    add_p(doc, "The support domain provides a lightweight ticketing system for reporting issues and requesting assistance. POST /api/support/ticket accepts { subject, description, priority } and creates a Support ticket. Tickets are visible to all Super Admins and can be assigned to specific users for resolution. GET /api/support/tickets returns all tickets with optional filters for status (open, in-progress, closed) and priority (low, medium, high, critical). PUT /api/support/ticket/:id allows updating ticket status, adding comments, or changing assignee.")
    add_p(doc, "The support system is a simple internal tool and does not integrate with external ticketing platforms (e.g., Jira, Zendesk) in the current version. Future enhancements may include email notifications when tickets are created or updated, and integration with third-party support services for escalation.")
    page_break(doc)
    
    # 6. Data model and KPI tracking
    add_h1(doc, "6. Data model and KPI tracking")
    
    add_h2(doc, "6.1 Core entities and relationships")
    add_p(doc, "The MongoDB database 'aptnexus' contains collections corresponding to core domain entities: users, sites, checkpoints, duties, trails, patrols, visitors, notifications, schedules, chats, and support. Users belong to one or more Sites (many-to-many via sites array in User document). Sites have many Checkpoints (one-to-many, with siteId foreign key in Checkpoint). Duties link Users and Sites, and each Duty has many Trail records (one-to-many, with dutyId foreign key in Trail). Patrols link Users, Checkpoints, and Sites, with denormalized siteName and area fields for efficient reporting.")
    add_p(doc, "Visitors link to Sites and Users (the officer who logged the visit), with entry and exit timestamps. Notifications and Schedules belong to Users (one-to-many). Chat messages reference two Users (fromUserId and toUserId). The data model emphasizes denormalization for read-heavy queries: siteName is copied into Checkpoint and Patrol documents to avoid joins, and area is included in Patrol even though it is also available via Checkpoint, to support direct filtering and grouping in reports.")
    add_figure(doc, "fig_data_model.png", "Figure 4 — Entity-relationship diagram showing MongoDB collections and relationships", width=6.5)
    
    add_h2(doc, "6.2 KPI and activity metrics")
    add_p(doc, "The Admin Console dashboard displays key performance indicators (KPIs) derived from real-time aggregation queries. 'Officers on Duty' is computed by counting Duty documents with non-null clockIn and null clockOut, grouped by site. 'Patrol Scans Today' counts Patrol documents with scannedAt timestamp in the current day (UTC). 'Visitor Entries Today' counts Visitor documents with entryTime in the current day. These KPIs are refreshed via polling (the frontend calls /api/overview/kpis every 30 seconds) and displayed as large, color-coded cards on the dashboard.")
    add_p(doc, "Activity metrics include duty duration (average time between clockIn and clockOut per officer, per site), patrol coverage (percentage of checkpoints scanned in the last 24 hours, per site), and visitor throughput (entries per hour). These metrics feed trend charts (line graphs, bar charts) in the Reports module, allowing admins to identify patterns and anomalies. For example, if patrol coverage drops below 80%, an alert is triggered, prompting admins to investigate whether officers are skipping checkpoints or if there is a staffing shortage.")
    add_p(doc, "Dwell time is a derived metric calculated from GPS trails: it measures how long an officer remained within a defined radius (e.g., 50 meters) of a checkpoint or area. Dwell analysis is used to verify that officers are spending adequate time at each checkpoint rather than just scanning and immediately moving on. The Admin Console includes a heat map visualization that overlays dwell time data on a site map, with color gradients indicating high-dwell (green) and low-dwell (red) zones.")
    page_break(doc)
    
    # 7. Languages and localization
    add_h1(doc, "7. Languages and localization")
    add_p(doc, "The Admin Console supports three languages: English (en), Malay (ms), and Chinese (zh), matching the mobile application. The frontend uses a lightweight i18n library (react-i18next) that loads language JSON files from public/locales/. All UI text, labels, button captions, and error messages are externalized into these JSON files, ensuring that no hardcoded English strings appear in React components.")
    add_p(doc, "The user's language preference is stored in their User profile (language field) and is applied when rendering the Admin Console. The language setting can be changed from the Settings module, and the change takes effect immediately across all tabs without requiring a page reload (the i18n library supports dynamic language switching). Date and time formatting respects the user's locale, with timestamps displayed in DD/MM/YYYY HH:mm format for Malay and Chinese users, and MM/DD/YYYY HH:mm for English users.")
    add_p(doc, "Backend API responses are language-agnostic (JSON data structures), but error messages returned to the client include a localized 'message' field that the frontend displays to the user. The backend determines the appropriate language by reading the Accept-Language HTTP header, which the frontend sets based on the user's profile. This approach ensures that error messages, validation warnings, and system notifications are presented in the user's preferred language.")
    page_break(doc)
    
    # 8. Functional architecture
    add_h1(doc, "8. Functional architecture")
    
    add_h2(doc, "8.1 Module boundaries and responsibilities")
    add_p(doc, "The Admin Console frontend is organized into 12 functional modules, each corresponding to a top-level route and a domain in the backend API. Modules are: Dashboard (overview KPIs and activity feed), Sites (site CRUD and summary), Checkpoints (checkpoint CRUD and QR generation), Teams (user roster and role management), Duty (clock logs and GPS trails), Patrols (scan logs and compliance reports), Visitors (gate logs and PDF export), Schedules (shift planning), Notifications (alert inbox), Chat (internal messaging), Settings (system config), and Reports (custom and scheduled exports).")
    add_p(doc, "Each module is implemented as a React component hierarchy with a top-level page component (e.g., DashboardPage.jsx), child components for sub-views (e.g., KPICard.jsx, ActivityFeed.jsx), and shared utility hooks (e.g., useFetchKPIs, usePolling). The modules are loosely coupled: they communicate via the shared API layer and global state (React Context), but they do not directly import each other's components or logic. This modularity supports independent development, testing, and future extraction of modules into micro-frontends if needed.")
    
    add_h2(doc, "8.2 Admin Console sitemap")
    add_p(doc, "The Admin Console sitemap defines the navigation structure and user flows. The top-level navigation (sidebar) includes: Dashboard (home), Sites, Checkpoints, Teams, Duty, Patrols, Visitors, Schedules, Notifications, Chat, Settings, and Reports. Each top-level item expands to reveal sub-pages: for example, Sites expands to Site List, Site Detail, and Create Site. The sitemap also defines role-based visibility: Security Officers see only Dashboard, Duty, Patrols, and Profile; Admins see all modules except Sites and Checkpoints CRUD; Super Admins see all modules.")
    add_p(doc, "The sitemap is implemented as a routing configuration (routes.jsx) with nested routes and lazy-loaded components. The sidebar component reads the routing configuration and filters it based on the logged-in user's role, rendering only the navigation items the user has permission to access. This approach centralizes access control logic and reduces the risk of accidental exposure of privileged features.")
    add_figure(doc, "fig_admin_sitemap.png", "Figure 5 — Admin Console sitemap showing module hierarchy and role-based access", width=6.5)
    page_break(doc)
    
    # 9. Console modules and pages
    add_h1(doc, "9. Console modules and pages")
    
    add_h2(doc, "9.1 Dashboard — Overview and KPIs")
    add_p(doc, "The Dashboard module is the landing page for all users after login. It displays a grid of KPI cards at the top (Officers on Duty, Patrol Scans Today, Visitor Entries Today, Active Alerts), each card showing a large count and a trend indicator (up/down arrow with percentage change compared to yesterday). Below the KPI cards is an Activity Feed that lists recent events (clock-ins, clock-outs, patrol scans, visitor logs) in reverse chronological order, with timestamps, user names, site names, and action descriptions.")
    add_p(doc, "The Activity Feed is updated via polling (every 30 seconds) and supports infinite scroll (loads 50 events at a time, with a 'Load More' button at the bottom). Each event in the feed is clickable: tapping a clock-in event navigates to the Duty detail page, tapping a patrol scan navigates to the Patrol detail page, and tapping a visitor log navigates to the Visitor detail page. This provides quick drill-down access to detailed information without navigating through multiple menus.")
    add_p(doc, "For Super Admins, the Dashboard includes an additional section: System Health, which displays backend API response time, database query latency, and PM2 process status (number of active workers, memory usage). This section uses data from GET /api/overview/health (a privileged endpoint) and helps Super Admins diagnose performance issues or detect anomalies such as high memory usage or slow queries.")
    
    add_h2(doc, "9.2 Sites — Site management and configuration")
    add_p(doc, "The Sites module is accessible to Super Admins only and provides a full CRUD interface for managing sites. The Site List page displays all sites in a table with columns for Name, Address, Checkpoints (count), Users (count), and Actions (Edit, Delete). Clicking a site name navigates to the Site Detail page, which shows comprehensive information: site address, GPS coordinates, list of checkpoints (grouped by area), list of assigned users, and recent activity (duty count, patrol count, visitor count in the last 7 days).")
    add_p(doc, "The Create Site page includes a form with fields for site name, address, and GPS coordinates (with a map picker for visual selection). Upon submission, the backend creates the site and automatically generates a default checkpoint in Area A. The Edit Site page allows updating name, address, and coordinates; changes to the name trigger a background job to update denormalized siteName fields in Checkpoint and Patrol documents. The Delete Site action requires confirmation via a modal dialog and is only allowed if the site has no active duties or pending visitors.")
    
    add_h3(doc, "9.2.1 Automatic Area A checkpoint creation")
    add_p(doc, "When a Super Admin creates a new site, the backend automatically generates a checkpoint named 'Default Checkpoint' in Area A. This ensures that every site is immediately operational and that security officers can begin patrol scans without waiting for manual checkpoint creation. The default checkpoint's QR code is displayed on the Site Detail page immediately after creation, and Super Admins can rename or relocate it as needed.")
    
    add_h2(doc, "9.3 Checkpoints — Checkpoint CRUD and QR generation")
    add_p(doc, "The Checkpoints module is also restricted to Super Admins. The Checkpoint List page displays all checkpoints across all sites, with filters for site and area. Each checkpoint row shows Name, Site, Area, QR Code (thumbnail preview), and Recent Scans (count in the last 7 days). Clicking a checkpoint navigates to the Checkpoint Detail page, which includes a large QR code image (suitable for printing), checkpoint metadata (site, area, coordinates), and a list of recent patrol scans at this checkpoint.")
    add_p(doc, "The Create Checkpoint page includes a form with fields for site selection (dropdown), area selection (radio buttons for A/B/C/D), checkpoint name, and optional GPS coordinates. Upon submission, the backend generates a unique checkpoint ID, creates a JSON payload, encodes it as a QR code, and returns the checkpoint document with the QR code image. The Edit Checkpoint page allows changing the name, area, or coordinates; changes to the area regenerate the QR code. The Delete Checkpoint action soft-deletes the checkpoint (marks as inactive) rather than removing it, preserving historical patrol references.")
    
    add_h2(doc, "9.4 Teams — User roster and role management")
    add_p(doc, "The Teams module is accessible to Admins and Super Admins. The Teams List page displays all users in a table with columns for Name, Role, Sites (comma-separated list), Status (Active/Inactive), and Actions (View, Edit for Super Admins). Filters allow narrowing by role (Security, Admin, Super Admin), site, and status. Clicking a user name navigates to the User Detail page, which shows full profile information, recent duty history, patrol statistics, and assigned schedules.")
    add_p(doc, "Super Admins can access the Create User page, which includes fields for name, email, password, role, and site assignments (multi-select dropdown). The Edit User page allows Super Admins to change role, sites, and the manageOnly flag. Admins (non-Super) can view user details but cannot create, edit, or delete users. Password changes are handled via a separate flow (Change Password button on User Detail page) that requires the user to enter their current password for verification before setting a new one.")
    
    add_h2(doc, "9.5 Duty — Clock-in/out logs and GPS trails")
    add_p(doc, "The Duty module displays clock-in and clock-out logs for all users within the admin's assigned sites. The Duty Log page includes a table with columns for Officer, Site, Clock In, Clock Out, Duration, and GPS Trail (button to view trail on map). Filters allow narrowing by date range, site, and user. The GPS Trail button opens a modal with an interactive map (Leaflet.js) that plots the officer's trail as a polyline, with markers at clock-in, clock-out, and intermediate trail points.")
    add_p(doc, "The map visualization supports playback: admins can scrub a timeline slider to see the officer's position at different times during the shift, useful for incident investigation or verifying that the officer covered expected patrol routes. The Duty Detail page (accessed by clicking an officer name or duty row) displays comprehensive information: clock-in and clock-out times with GPS coordinates, total duration, number of trail points recorded, and a summary of patrols (scans) performed during the duty session.")
    
    add_h2(doc, "9.6 Patrols — Scan logs and compliance reports")
    add_p(doc, "The Patrols module provides access to all patrol scan logs and compliance reporting. The Patrol Log page displays a table with columns for Site, Checkpoint, Area, Officer, Scanned On, and GPS Location (map link). Filters include date range, site, checkpoint, area, and officer. The Site column is displayed first to support multi-site oversight, allowing admins to quickly group and filter by site.")
    add_p(doc, "The Patrol Report page generates aggregated compliance metrics: total scans per site, scans per checkpoint, scans per officer, expected scans (based on scheduled patrol routes, if configured), actual scans, and compliance rate (actual/expected as percentage). The report includes a heat map visualization that overlays scan density on a site map, color-coded by area. Admins can export the patrol log to PDF via a button, which calls POST /api/patrols/export and downloads the resulting PDF with Site, Checkpoint, Area, Scanned On, and Officer columns.")
    
    add_h2(doc, "9.7 Visitors — Gate logs and PDF export")
    add_p(doc, "The Visitors module displays all visitor entry and exit logs. The Visitor Log page includes a table with columns for Plate Number, Site, Entry Time, Exit Time, Duration, and Officer. Filters allow narrowing by date range, site, and status (Active=no exit, Exited=has exit). Clicking a visitor row opens the Visitor Detail page, which shows entry/exit GPS coordinates, photos (if captured), and notes entered by the officer or admin.")
    add_p(doc, "Admins can manually correct entry or exit times if errors were made (e.g., officer logged wrong time), and these corrections are flagged in the audit trail. The Export PDF button generates a printable report with all visible rows (respecting current filters), formatted in landscape orientation with page headers. The PDF is returned as a downloadable file via the browser's download API.")
    
    add_h2(doc, "9.8 Schedules — Shift planning and assignments")
    add_p(doc, "The Schedules module allows Admins and Super Admins to plan and assign shifts for security officers. The Schedule Calendar page displays a week or month view with color-coded shifts for each user, grouped by site. Admins can click a date/time slot to create a new shift, or click an existing shift to edit or delete it. The Create Shift form includes fields for user selection, site, shift start time, shift end time, and recurrence (None, Daily, Weekly, Custom).")
    add_p(doc, "Shifts are stored in the schedules collection and are used by the backend cron job to send shift reminders (2 hours before shift start) and detect missed shifts (no clock-in within 30 minutes of shift start). The mobile app also queries the schedules endpoint to display upcoming shifts to officers. The Schedules module supports bulk shift creation: admins can select multiple users and create the same shift for all of them in a single action, reducing administrative overhead for large teams.")
    
    add_h2(doc, "9.9 Notifications — Alert management and history")
    add_p(doc, "The Notifications module provides an inbox for admins to view and manage system alerts. The Notifications Inbox page displays unread notifications at the top, followed by a history of read notifications. Each notification includes a type icon (color-coded by severity: green for info, yellow for warning, red for critical), a message, a timestamp, and actions (Mark as Read, Dismiss). Clicking a notification navigates to the relevant context: a 'missed patrol' notification links to the Patrol Log page filtered for the affected checkpoint.")
    add_p(doc, "Admins can compose and send custom notifications to users via a Send Notification button. The compose form includes fields for recipient (single user or group/site), notification type, message, and delivery channel (in-app, push, email). Notifications are immediately visible in the recipient's mobile app (via push notification and in-app banner) and in the Admin Console inbox (if the recipient is an admin). The Notifications module also includes a Settings sub-page where admins can configure notification rules: for example, 'Alert if checkpoint is not scanned within 2 hours of expected patrol time'.")
    
    add_h2(doc, "9.10 Chat — Internal messaging (admin-only)")
    add_p(doc, "The Chat module provides basic user-to-user messaging for admins. The Chat Inbox page lists all conversations, each showing the other user's name, last message preview, and timestamp. Clicking a conversation opens a Chat Thread page with a scrollable message history (newest at bottom) and a text input box for composing new messages. Messages are plaintext only (no rich formatting, images, or attachments).")
    add_p(doc, "The Chat module is not exposed in the mobile app's main navigation for security officers (they do not have an inbox), but admins can initiate chats with officers via the User Detail page (a 'Send Message' button). The officer receives a push notification with the message preview and can view/reply to the message by opening the mobile app and navigating to a dedicated Messages screen (accessible via the Settings tab or a notification tap). This asymmetric design keeps the mobile app focused on operational workflows while enabling lightweight communication initiated by admins.")
    
    add_h2(doc, "9.11 Settings — System configuration")
    add_p(doc, "The Settings module provides access to system-wide configuration options, accessible to Super Admins only. The General Settings page includes fields for GPS trail recording interval (default 60 seconds), clock-in/out location radius tolerance (default 500 meters), patrol compliance thresholds (e.g., 'Alert if checkpoint not scanned in 2 hours'), session timeout (default 14 days), and default language. Changes are saved to a config collection in MongoDB and take effect immediately (no server restart required).")
    add_p(doc, "The User Profile sub-page (accessible to all users via a profile icon in the header) allows users to update their own name, email, password, and language preference. Profile photo upload is supported (stored as base64 in the User document). The Audit Log sub-page (Super Admin only) displays a chronological log of all privileged actions (user created, site deleted, checkpoint edited, etc.) with timestamps, actor (user who performed the action), and before/after values for edited fields. The audit log is immutable (no delete or edit actions) and is used for compliance and incident investigation.")
    
    add_h2(doc, "9.12 Reports — Custom and scheduled exports")
    add_p(doc, "The Reports module enables Admins and Super Admins to generate custom data exports beyond the predefined patrol and visitor PDFs. The Custom Report page includes a report builder with filters for entity type (Duty, Patrol, Visitor, User), date range, sites, and output format (PDF, CSV, Excel). The user selects desired columns (e.g., for Patrol report: Site, Checkpoint, Area, Officer, Scanned On, GPS), applies filters, and clicks Generate Report. The backend processes the query and returns a downloadable file.")
    add_p(doc, "The Scheduled Reports sub-page allows admins to define recurring reports: for example, 'Generate daily patrol compliance report at 8 AM and email to supervisor@aptnexus.com'. Scheduled reports are stored in the database with cron-style schedule expressions, and a backend cron job executes them on schedule. Generated reports are stored in a reports/ directory on the server (or uploaded to cloud storage) and are accessible via a Reports History page, which lists all generated reports with download links and expiration dates (reports are auto-deleted after 30 days to conserve storage).")
    page_break(doc)
    
    # 10. Authentication and session management
    add_h1(doc, "10. Authentication and session management")
    
    add_h2(doc, "10.1 JWT token issuance and validation")
    add_p(doc, "User authentication in the Admin Console follows the same JWT-based flow as the mobile application. When a user logs in via the web interface (POST /api/auth/login with email and password), the backend validates credentials, generates a JWT token with 14-day expiration, and returns it to the frontend. The frontend stores the token in localStorage (or sessionStorage for 'Remember me' unchecked) and includes it in the Authorization header (Bearer {token}) for all subsequent API requests.")
    add_p(doc, "The JWT token payload includes userId, email, role, sites (array of site IDs), and manageOnly (boolean). The backend middleware (authMiddleware.js) decodes and validates the token on every request, checking the signature (using JWT_SECRET) and expiration time. If validation fails, a 401 response is returned, and the frontend redirects to the login page. The token validation logic also checks for revocation: if the token's JTI is present in the blacklist collection, the request is rejected even if the token is otherwise valid.")
    
    add_h2(doc, "10.2 Session lifecycle — 14-day SESSION_ACTIVE")
    add_p(doc, "The session lifetime is set to 14 days (SESSION_ACTIVE constant) to balance security and user convenience. This means users must re-authenticate every two weeks, but they are not interrupted during active use. The frontend does not implement automatic token refresh in the current version; users are logged out when the token expires and must re-enter their credentials. Future versions may introduce refresh tokens (with a longer expiration, e.g., 90 days) to allow seamless session extension without requiring re-login.")
    add_p(doc, "When a user logs out (via the Logout button in the Admin Console header or mobile app Settings), the frontend calls POST /api/auth/logout, which adds the current token's JTI to the blacklist. The frontend then clears the stored token and redirects to the login page. If the user attempts to use the same token again (e.g., on another device or browser tab), the request is rejected due to blacklist presence. This mechanism provides single-logout semantics: logging out on one device/tab invalidates the token globally.")
    
    add_h2(doc, "10.3 Token blacklist and revocation")
    add_p(doc, "Token revocation is implemented via a blacklist collection in MongoDB. Each blacklist entry includes the JTI (JWT ID, a unique identifier embedded in the token), the expiration timestamp, and the revocation timestamp. The authMiddleware checks the blacklist on every request: if the token's JTI is found and the current time is before the token's expiration, the request is rejected. Blacklist entries are automatically deleted once the token's expiration time has passed (via a TTL index on the expiration field), preventing the blacklist from growing indefinitely.")
    add_p(doc, "Super Admins can manually revoke a user's active sessions by accessing the User Detail page and clicking 'Revoke All Sessions'. This action adds all of the user's currently issued tokens to the blacklist (the system queries the tokens collection, which logs all issued tokens, though this is optional and not enabled by default). This feature is used when a user account is compromised or when an employee is terminated and immediate access revocation is required.")
    page_break(doc)
    
    # 11. Maps, trails, and dwell analysis
    add_h1(doc, "11. Maps, trails, and dwell analysis")
    
    add_h2(doc, "11.1 GPS trail visualization")
    add_p(doc, "The Admin Console includes interactive map visualizations (powered by Leaflet.js) that display GPS trails recorded during duty sessions. On the Duty Detail page, admins can click 'View GPS Trail' to open a modal with a map centered on the site. The officer's trail is rendered as a polyline connecting all Trail records for the duty session, with markers at clock-in, clock-out, and intermediate points. Each marker displays a tooltip with timestamp and coordinates when hovered.")
    add_p(doc, "The map supports playback: a timeline slider at the bottom allows admins to scrub through the trail, and the map updates to show the officer's position at the selected time. A Play button animates the trail, moving the slider and updating the map at a configurable speed (default 1 real-time = 60x trail-time, allowing a 2-hour shift to be reviewed in 2 minutes). This feature is invaluable for incident investigation, route verification, and training: supervisors can review an officer's patrol path and identify deviations or gaps.")
    
    add_h2(doc, "11.2 Dwell time calculation")
    add_p(doc, "Dwell time is a metric that measures how long an officer remained within a defined radius (e.g., 50 meters) of a checkpoint or area. The backend calculates dwell time by analyzing consecutive Trail records: if multiple trail points fall within the dwell radius, the time span from the first to the last point is considered dwell time. Dwell analysis is useful for verifying that officers are spending adequate time at checkpoints (e.g., performing thorough inspections) rather than just scanning the QR code and immediately moving on.")
    add_p(doc, "The Patrol Detail page displays dwell time for each scan: if the officer's GPS trail shows they remained within 50 meters of the checkpoint for at least 2 minutes, this is flagged as 'Adequate dwell'. If the dwell time is less than 1 minute, it is flagged as 'Insufficient dwell', and the patrol scan is highlighted in yellow on the Patrol Log page. Admins can configure dwell thresholds (radius and minimum time) in the Settings module, tailoring the analysis to site-specific requirements.")
    
    add_h2(doc, "11.3 Heat maps and density charts")
    add_p(doc, "The Admin Console's Patrol Report page includes a heat map visualization that overlays patrol scan density on a site map. The heat map is generated by aggregating Patrol records for a selected date range and site, grouping by GPS coordinates (rounded to 100-meter grid cells), and counting scans per cell. Cells with high scan counts are rendered in red/orange, medium counts in yellow, and low counts in green. This visualization helps admins identify under-patrolled areas and adjust patrol routes or schedules.")
    add_p(doc, "Density charts (bar charts and pie charts) show patrol distribution by area (A, B, C, D), by time of day (hourly buckets), and by officer. These charts are interactive: clicking a bar or pie slice filters the Patrol Log table to show only the relevant scans. The combination of heat maps and density charts provides a comprehensive view of patrol coverage, enabling data-driven decisions about resource allocation and shift planning.")
    page_break(doc)
    
    # 12. Integration with mobile application
    add_h1(doc, "12. Integration with mobile application")
    
    add_h2(doc, "12.1 Shared API and database")
    add_p(doc, "The Admin Console and mobile application share the same backend API and MongoDB database, ensuring data consistency and reducing infrastructure complexity. All data written by the mobile app (clock-ins, patrol scans, visitor logs) is immediately visible in the Admin Console, and all configuration changes made in the Admin Console (new checkpoints, updated schedules, sent notifications) are immediately accessible to the mobile app. This tight integration eliminates data synchronization lag and reduces the risk of inconsistencies.")
    add_p(doc, "The API is designed with role-based access control (RBAC) to support both mobile and web clients. Endpoints enforce permissions based on the JWT token's role claim: Security Officers can only access their own data, Admins can access data for their assigned sites, and Super Admins have unrestricted access. This allows the same API codebase to serve multiple client types with different privilege levels, simplifying backend maintenance and ensuring consistent business logic enforcement.")
    
    add_h2(doc, "12.2 Real-time data synchronization")
    add_p(doc, "Real-time synchronization is achieved via polling rather than WebSockets or server-sent events (SSE). The mobile app polls critical endpoints (e.g., GET /api/track/active, GET /api/notifications/inbox) at regular intervals (30-60 seconds) to detect changes. The Admin Console uses the same polling strategy for live dashboards and activity feeds. This approach is simpler to implement and maintain than WebSockets, and it is sufficient for the APTNexus use case, where update frequency is low (most events occur at most once per minute).")
    add_p(doc, "Future versions may introduce WebSocket support for truly real-time updates (e.g., instant notification delivery, live GPS trail updates on maps). The backend would use Socket.IO or a similar library to establish persistent connections, and clients would subscribe to channels (e.g., 'site-123-updates') to receive push notifications. This would reduce polling overhead and improve responsiveness, especially for high-traffic sites with many concurrent users.")
    
    add_h2(doc, "12.3 Push notifications to mobile")
    add_p(doc, "The Admin Console can send push notifications to mobile users via Expo's push notification service. When an admin composes a notification in the Notifications module and selects 'Push' as the delivery channel, the backend calls Expo's push API with the recipient's device token (stored in the User document). The push notification payload includes a title, message, and optional data (e.g., deeplink to a specific screen in the mobile app).")
    add_p(doc, "Push notifications are used for shift reminders, missed patrol alerts, visitor approvals, and urgent messages from supervisors. The mobile app handles incoming push notifications via Expo's notification listener, which displays a banner (if the app is in the foreground) or a system notification (if the app is in the background). Tapping the notification opens the app and navigates to the relevant screen (e.g., Patrol History for a missed patrol alert). Push notification delivery is best-effort (no guaranteed delivery), but the Admin Console logs all sent notifications, allowing admins to verify that a notification was sent even if the user did not receive it (e.g., due to device offline or notification disabled).")
    page_break(doc)
    
    # 13. Security, operations, and deployment
    add_h1(doc, "13. Security, operations, and deployment")
    
    add_h2(doc, "13.1 HTTPS and TLS configuration")
    add_p(doc, "The Admin Console is deployed with HTTPS (TLS 1.2 or higher) to encrypt all data in transit between clients and the server. The TLS certificate is issued by a trusted Certificate Authority (Let's Encrypt or commercial CA) and is configured on the Nginx reverse proxy that terminates HTTPS and forwards requests to the Express app. The Nginx configuration includes HTTP Strict Transport Security (HSTS) headers to force all clients to use HTTPS, and it disables weak cipher suites to prevent downgrade attacks.")
    add_p(doc, "The backend API enforces secure cookie attributes (Secure, HttpOnly, SameSite=Strict) for any cookies it sets (though the current implementation uses Bearer tokens in headers rather than cookies). The Express app also sets security headers (Content-Security-Policy, X-Content-Type-Options, X-Frame-Options) via the helmet middleware to protect against common web vulnerabilities (XSS, clickjacking, MIME sniffing). These configurations are defined in the server startup script (server.js) and are applied globally to all routes.")
    
    add_h2(doc, "13.2 PM2 process management")
    add_p(doc, "The Admin Console backend is managed by PM2, which runs the Express app as a cluster of Node.js processes. The PM2 configuration (ecosystem.config.js) specifies the number of instances (typically equal to the number of CPU cores), the entry point (server.js), environment variables (NODE_ENV=production, PORT=5190, MONGO_URI, JWT_SECRET), and restart policies (restart on crash, max memory threshold). PM2 also handles log rotation, writing stdout and stderr to separate files and rotating them daily.")
    add_p(doc, "PM2 provides zero-downtime deployment via the reload command, which performs a rolling restart of worker processes: it restarts one worker at a time, waiting for each to become healthy before restarting the next. This ensures that at least one worker is always available to serve requests during deployments. PM2 can also run the frontend build (npm run build) as a separate process, though it is more common to serve the frontend static assets via Nginx or a CDN, with PM2 managing only the backend API.")
    
    add_h2(doc, "13.3 Deployment checklist")
    add_p(doc, "Deploying the Admin Console to production involves the following steps: (1) Provision a Linux server (Ubuntu 22.04 LTS or similar) with sufficient resources (4 CPU cores, 8 GB RAM, 50 GB disk minimum); (2) Install Node.js 20 LTS, MongoDB 7.x, Nginx 1.24, and PM2 globally via npm; (3) Clone the APTNexus repository and install dependencies (npm install in backend/ and frontend/ directories); (4) Build the frontend (npm run build in frontend/, outputs static files to frontend/dist/); (5) Configure Nginx to serve the frontend static files and proxy API requests to the backend (listen on port 443 for HTTPS, reverse proxy /api/* to http://localhost:5190); (6) Configure environment variables (create .env file in backend/ with MONGO_URI, JWT_SECRET, PORT=5190, NODE_ENV=production); (7) Start the backend with PM2 (pm2 start ecosystem.config.js --env production); (8) Verify that the service is running (pm2 status, curl http://localhost:5190/api/health); (9) Configure TLS certificate (certbot for Let's Encrypt, or upload commercial certificate to Nginx); (10) Enable firewall rules (allow 443, 22, deny 5190 to external traffic); (11) Configure MongoDB backups (daily snapshots, 7-day retention); (12) Set up monitoring (PM2 monitoring, Nginx access logs, application logs, database slow query logs).")
    page_break(doc)
    
    # 14. Technology alternatives and rationale
    add_h1(doc, "14. Technology alternatives and rationale")
    add_p(doc, "The choice of Express 5, Mongoose, React 19, and Vite for the Admin Console was driven by team expertise, ecosystem maturity, and alignment with the mobile application's technology stack. Alternative backend frameworks considered included NestJS (rejected due to higher complexity and steeper learning curve), Koa (rejected due to smaller ecosystem and fewer middleware options), and Fastify (rejected due to less mature ORM options for MongoDB). Express was chosen for its simplicity, large community, and extensive middleware ecosystem.")
    add_p(doc, "For the frontend, alternatives to React included Vue.js and Svelte. Vue was rejected due to the team's stronger React experience and the desire to reuse React components and patterns from the mobile app (though direct code reuse is limited due to React Native vs React DOM differences). Svelte was rejected due to its smaller ecosystem and fewer mature UI libraries. Vite was chosen over Create React App (CRA) for its faster dev server startup, optimized production builds, and native ES module support.")
    add_p(doc, "For data visualization, Chart.js was chosen over D3.js (too low-level, requires more boilerplate) and Recharts (less flexible, fewer chart types). For maps, Leaflet was chosen over Google Maps API (cost concerns, vendor lock-in) and Mapbox (more complex integration, overkill for simple trail visualization). For process management, PM2 was chosen over systemd (less ergonomic for Node.js, no built-in clustering) and Docker/Kubernetes (overkill for single-server deployment, though Docker may be adopted in future for multi-server deployments).")
    page_break(doc)
    
    # 15. Glossary
    add_h1(doc, "15. Glossary")
    add_grid_table(doc,
        ["Term", "Definition"],
        [
            ["Admin", "User role with monitoring, reporting, and limited management privileges"],
            ["Admin Console", "Web-based dashboard for APTNexus management and oversight"],
            ["API", "Application Programming Interface — REST endpoints for data access"],
            ["Checkpoint", "Physical location with QR code for patrol verification"],
            ["Dwell Time", "Duration an officer remained within a defined radius of a checkpoint"],
            ["Express", "Node.js web framework for building REST APIs"],
            ["Heat Map", "Visualization showing patrol density by location and color"],
            ["JWT", "JSON Web Token — authentication token with embedded claims"],
            ["KPI", "Key Performance Indicator — metric for operational monitoring"],
            ["manageOnly", "Flag indicating Super Admin privileges for CRUD operations"],
            ["Mongoose", "Object-Document Mapper (ODM) for MongoDB with schema validation"],
            ["Patrol", "Checkpoint scan event with timestamp, GPS, and metadata"],
            ["PM2", "Process manager for Node.js with clustering and monitoring"],
            ["QR Code", "Two-dimensional barcode encoding checkpoint JSON payload"],
            ["RBAC", "Role-Based Access Control — permissions based on user role"],
            ["React", "JavaScript library for building user interfaces"],
            ["SESSION_ACTIVE", "Token expiration period — 14 days for APTNexus"],
            ["Site", "Physical location with checkpoints, users, and security operations"],
            ["Super Admin", "User role with full CRUD access to sites, checkpoints, and users"],
            ["Trail", "GPS coordinate record appended to an active duty session"],
            ["Vite", "Fast dev server and bundler for frontend projects"],
        ]
    )
    
    doc.save(OUT / "APTNexus-Dashboard-Documentation.docx")
    print(f"Dashboard doc saved: {OUT / 'APTNexus-Dashboard-Documentation.docx'}")


if __name__ == "__main__":
    print("Building APTNexus technical documentation...")
    build_mobile_doc()
    build_dashboard_doc()
    print("All documents generated successfully!")
