# Stock Shipments Table Schema

This documentation covers the `stock_shipments` and `stock_shipment_items` tables used to track incoming stock purchases and their individual product breakdown.

## DDL Script

```sql
CREATE TABLE stock_shipments (
    shipment_id BIGSERIAL PRIMARY KEY,
    stock_date DATE NOT NULL,
    total_value DECIMAL(12,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE stock_shipment_items (
    id BIGSERIAL PRIMARY KEY,
    shipment_id BIGINT NOT NULL REFERENCES stock_shipments(shipment_id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES inventory(item_id) ON DELETE CASCADE,
    quantity_added INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shipment_items_shipment ON stock_shipment_items(shipment_id);
CREATE INDEX idx_shipment_items_item ON stock_shipment_items(item_id);
```

## `stock_shipments` Columns

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `shipment_id` | `BIGSERIAL` | Primary Key | Unique shipment identifier. |
| `stock_date` | `DATE` | `NOT NULL` | Date stock was received from manufacturer. |
| `total_value` | `DECIMAL(12,2)` | `NOT NULL` | Total monetary value of the shipment (auto-calculated or manually overridden). |
| `notes` | `TEXT` | Nullable | Optional notes about the shipment. |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | Record creation timestamp. |

## `stock_shipment_items` Columns

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | Primary Key | Row identifier. |
| `shipment_id` | `BIGINT` | `NOT NULL`, FK → `stock_shipments` | Parent shipment reference. |
| `item_id` | `BIGINT` | `NOT NULL`, FK → `inventory` | Product reference from inventory table. |
| `quantity_added` | `INTEGER` | `NOT NULL` | Number of individual pieces added in this shipment. |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | Record creation timestamp. |

## Relationships

- `stock_shipment_items.shipment_id` → `stock_shipments.shipment_id` (cascade delete)
- `stock_shipment_items.item_id` → `inventory.item_id` (cascade delete)

## Derived Values

- **Packs added** = `quantity_added / inventory.units_per_pack` (calculated at display time, not stored)
- **Shipment total** = `SUM(quantity_added × inventory.purchase_price)` across all items in the shipment (default calculation; user can override via `total_value`)
