## ADDED Requirements

### Requirement: Triggering Alerts on Price Drop
The system SHALL evaluate each newly scraped product price against the user-configured alert thresholds to check if a WhatsApp notification is warranted.

#### Scenario: Price drops below percentage threshold
- **WHEN** a new price is scraped and it represents a drop greater than or equal to the user-defined percentage threshold (e.g., 10% drop from the reference price) AND the alert is currently inactive
- **THEN** the system SHALL mark the alert as active and trigger exactly ONE WhatsApp notification event.

#### Scenario: Price drops below fixed amount threshold
- **WHEN** a new price is scraped and it represents a drop greater than or equal to the user-defined absolute Euro threshold (e.g., €5.00 drop) AND the alert is currently inactive
- **THEN** the system SHALL mark the alert as active and trigger exactly ONE WhatsApp notification event.

#### Scenario: Price remains below threshold on subsequent scrapes
- **WHEN** a new price is scraped and it is still below the threshold AND the alert is already active
- **THEN** the system SHALL NOT trigger any additional WhatsApp notification events.

### Requirement: WhatsApp Notification Dispatch
The system SHALL dispatch a notification message to the user's WhatsApp number when an alerting event is triggered.

#### Scenario: Send WhatsApp alert message
- **WHEN** a WhatsApp notification event is triggered
- **THEN** the system SHALL compile a message (including product name, old price, new price, discount amount, and product URL) and send it via the configured WhatsApp API.
