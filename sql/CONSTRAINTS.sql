-- Add constraints to prevent data integrity issues

-- Prevent negative stock values
ALTER TABLE book 
ADD CONSTRAINT check_positive_stock 
CHECK (stock >= 0);

-- Prevent negative order amounts in picked table
ALTER TABLE picked 
ADD CONSTRAINT check_positive_amount 
CHECK (amount > 0);

-- Ensure valid order states (1-7)
ALTER TABLE book_order 
ADD CONSTRAINT check_valid_order_state 
CHECK (state >= 1 AND state <= 7);
