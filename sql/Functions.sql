CREATE OR REPLACE FUNCTION has_stock(cid INTEGER)
RETURNS INTEGER AS $$
DECLARE
    bid INTEGER;
    amnt INTEGER;
    r RECORD;
BEGIN
    FOR r IN SELECT * FROM picked WHERE picked.cart_id = cid LOOP
        bid := r.book_id;
        -- Use SELECT FOR UPDATE to lock the book row and prevent race conditions
        SELECT stock INTO amnt FROM book WHERE id = bid FOR UPDATE;
        IF r.amount > amnt THEN
            RETURN 1;
        END IF;
    END LOOP;
    RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- 1) Function for AFTER INSERT on rates: add star and increment review_count
CREATE OR REPLACE FUNCTION fn_add_review()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE book
    SET star = star + NEW.stars,
        review_count = review_count + 1
    WHERE id = NEW.book_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;


-- 2) Function for AFTER UPDATE OF stars on rates: adjust star based on difference
CREATE OR REPLACE FUNCTION fn_update_review()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE book
    SET star = star + (NEW.stars - OLD.stars)
    WHERE id = NEW.book_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;


-- 3) Function for AFTER INSERT on book_order: reduce stock based on picked rows for that cart
CREATE OR REPLACE FUNCTION fn_update_stock()
RETURNS TRIGGER AS $$
DECLARE
    r RECORD;
    current_stock INTEGER;
    rows_affected INTEGER;
BEGIN
    FOR r IN SELECT * FROM picked WHERE cart_id = NEW.cart_id LOOP
        -- Atomically update stock only if sufficient stock is available
        UPDATE book
        SET stock = stock - r.amount
        WHERE id = r.book_id AND stock >= r.amount;
        
        -- Check if the update was successful
        GET DIAGNOSTICS rows_affected = ROW_COUNT;
        
        -- If no rows were affected, it means insufficient stock
        IF rows_affected = 0 THEN
            -- Get current stock for error message
            SELECT stock INTO current_stock FROM book WHERE id = r.book_id;
            
            -- Cancel the entire order by raising an exception
            RAISE EXCEPTION 'Insufficient stock for book ID %. Required: %, Available: %', 
                r.book_id, r.amount, current_stock;
        END IF;
    END LOOP;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;


