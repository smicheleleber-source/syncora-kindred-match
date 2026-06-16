# Auth Role Refactor Later

## Current Roles

- admin
- approver
- preparer
- auditor
- viewer

## Future Syncora Roles

- client
- professional
- organization
- volunteer
- event_host
- admin

## MVP Decision

Do not refactor auth during Phase 1.

Reason:

The Discovery Engine and matching flow can be built without changing authentication.

## Later Refactor

When Syncora moves beyond prototype, update AppRole to support marketplace roles:

client:
Creates requests and receives matches.

professional:
Lists services and receives client matches.

organization:
Creates Statements of Work and receives volunteer/member matches.

volunteer:
Completes discovery and matches with organizations.

event_host:
Creates event needs and matches with professionals/attendees.

admin:
Manages validation, moderation, and platform configuration.
