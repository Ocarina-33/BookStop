-- Update trigger functions for proper rating calculation

-- Drop existing triggers
DROP TRIGGER IF EXISTS tg_add_review ON rates;
DROP TRIGGER IF EXISTS tg_update_review ON rates;
DROP TRIGGER IF EXISTS tg_delete_review ON rates;

-- Create new trigger functions
CREATE OR REPLACE FUNCTION fn_add_review()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE book
    SET star = (
        SELECT ROUND(AVG(stars), 1)
        FROM rates
        WHERE book_id = NEW.book_id
    ),
    review_count = review_count + 1
    WHERE id = NEW.book_id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_update_review()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE book
    SET star = (
        SELECT ROUND(AVG(stars), 1)
        FROM rates
        WHERE book_id = NEW.book_id
    )
    WHERE id = NEW.book_id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_delete_review()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE book
    SET star = COALESCE((
        SELECT ROUND(AVG(stars), 1)
        FROM rates
        WHERE book_id = OLD.book_id
    ), 0),
    review_count = review_count - 1
    WHERE id = OLD.book_id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create new triggers
CREATE TRIGGER tg_add_review 
AFTER INSERT ON rates
FOR EACH ROW
EXECUTE FUNCTION fn_add_review();

CREATE TRIGGER tg_update_review 
AFTER UPDATE OF stars ON rates
FOR EACH ROW
EXECUTE FUNCTION fn_update_review();

CREATE TRIGGER tg_delete_review 
AFTER DELETE ON rates
FOR EACH ROW
EXECUTE FUNCTION fn_delete_review();
