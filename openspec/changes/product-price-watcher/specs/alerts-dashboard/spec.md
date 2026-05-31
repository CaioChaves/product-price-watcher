## ADDED Requirements

### Requirement: Display Past Alerts Sent
The system SHALL display a list of all historical and recent alerts that have been triggered and sent.

#### Scenario: View alerts list
- **WHEN** the user navigates to the alerts dashboard
- **THEN** the system SHALL display a reverse-chronological list of sent alerts, including product name, price drop details, notification timestamp, and active/inactive status.

### Requirement: Toggle Alert Status
The system SHALL allow the user to toggle a recent alert's status between active and inactive.

#### Scenario: Toggle alert active to inactive
- **WHEN** the user toggles an active alert to inactive
- **THEN** the system SHALL update the alert status in the database to inactive, which resets the alert triggers and allows a new alert message to be sent if the price drops again.

#### Scenario: Toggle alert inactive to active
- **WHEN** the user toggles an inactive alert to active
- **THEN** the system SHALL update the alert status in the database to active, indicating that the user is currently aware of this price drop and preventing any new alerts from firing until reset.
