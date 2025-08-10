-- triggers for the BookShop database

-- Trigger for updating book ratings when a review is added
CREATE TRIGGER tg_add_review 
AFTER INSERT ON rates
FOR EACH ROW
EXECUTE FUNCTION fn_add_review();

-- Trigger for updating book ratings when a review is modified
CREATE TRIGGER tg_update_review 
AFTER UPDATE OF stars ON rates
FOR EACH ROW
EXECUTE FUNCTION fn_update_review();

-- Trigger for updating book stock when an order is placed
CREATE TRIGGER tg_update_stock 
AFTER INSERT ON book_order
FOR EACH ROW
EXECUTE FUNCTION fn_update_stock();
