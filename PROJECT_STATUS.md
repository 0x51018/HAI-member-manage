# Project Status

## Implemented Features
- Authentication with email/password, JWT access/refresh, and session storage.
- Member management with search, detail view, and memo CRUD with audit logging.
- Term, section, and team management including meeting day and attendance session generation.
- Attendance management with session listing and record updates.
- Spreadsheet Import v1 with CSV upload, phone normalization, and result report download.
- Events management with participant handling and CSV/TXT export.
- Audit logging API and UI for tracking key actions.
- Docker Compose configuration and seed scripts for local development.

## Outstanding Tasks
- Implement API and UI for user session management (list & removal).
- Show joined date and term timeline on member detail page.
- Add CI/CD workflows for API and web with Docker image build and deploy steps.

## Barriers to Immediate Use
- Users cannot review or revoke device sessions, posing security and account management concerns.
- Member detail page lacks joined date and term timeline, limiting historical insight for operators.
- Absence of CI/CD workflows requires manual deployment and increases risk of inconsistent environments.
- No automated tests or lint tasks, so changes must be verified manually.
