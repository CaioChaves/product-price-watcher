## ADDED Requirements

### Requirement: Add Product URL
The system SHALL allow users to register a product URL to be monitored.

#### Scenario: Register valid URL
- **WHEN** the user provides a valid product URL (e.g. "https://example.com/product-1")
- **THEN** the system SHALL validate the URL format and save the product in the database as an active tracked product.

#### Scenario: Register duplicate URL
- **WHEN** the user provides a product URL that is already registered
- **THEN** the system SHALL return an error indicating that the product is already tracked and must not create a duplicate record.

### Requirement: List Tracked Products
The system SHALL provide a way to retrieve all active tracked products.

#### Scenario: List all products
- **WHEN** the system is requested to retrieve the product list
- **THEN** the system SHALL return a list containing all registered products, including their names, URLs, and date of creation.

### Requirement: Delete Tracked Product
The system SHALL allow users to stop tracking and delete a product from the database.

#### Scenario: Delete active product
- **WHEN** the user deletes a product with a valid ID
- **THEN** the system SHALL remove the product record and all associated price history from the database.
