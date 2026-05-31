## ADDED Requirements

### Requirement: Interactive Price History Chart
The frontend SHALL display a visual line chart representing the price evolution of any tracked product over time.

#### Scenario: View product price chart
- **WHEN** the user selects a specific product in the frontend dashboard
- **THEN** the system SHALL render a responsive line chart with time on the X-axis and price on the Y-axis using historical data from the database.

### Requirement: User Interface to Configure Alerts
The frontend SHALL expose interactive inputs for the user to configure discount alerting thresholds on any given product.

#### Scenario: Configure discount thresholds
- **WHEN** the user inputs a threshold value (either a percentage % or a fixed Euro amount €) and clicks "Save Alert"
- **THEN** the frontend SHALL send a request to the backend to persist this alert configuration in the product database record.
