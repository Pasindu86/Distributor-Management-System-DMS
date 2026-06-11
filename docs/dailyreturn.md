# Database Schema — Daily Return

Run the following SQL in your Supabase SQL editor to create the required tables.

## Tables

### `daily_return`

```sql
CREATE TABLE daily_return (
  return_id          serial PRIMARY KEY,
  return_date        date NOT NULL DEFAULT CURRENT_DATE,
  total_return_value numeric NOT NULL DEFAULT 0,
  notes              text,
  created_at         timestamptz NOT NULL DEFAULT now()
);
```

### `daily_return_items`

```sql
CREATE TABLE daily_return_items (
  id                      serial PRIMARY KEY,
  return_id               int NOT NULL REFERENCES daily_return(return_id) ON DELETE CASCADE,
  item_id                 int NOT NULL REFERENCES inventory(item_id),
  quantity_returned       int NOT NULL,
  selling_price_per_unit  numeric NOT NULL,
  purchase_price_per_unit numeric NOT NULL,
  line_total              numeric NOT NULL
);
```

### RPC: Increment stock

```sql
CREATE OR REPLACE FUNCTION increment_stock(p_item_id int, p_quantity int)
RETURNS void AS $$
BEGIN
  UPDATE inventory
  SET stock_quantity = stock_quantity + p_quantity,
      updated_at = now()
  WHERE item_id = p_item_id;
END;
$$ LANGUAGE plpgsql;
```