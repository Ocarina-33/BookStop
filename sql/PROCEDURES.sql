--review book
CREATE OR REPLACE PROCEDURE review_book(
    bid INTEGER,
    uid INTEGER,
    star INTEGER,
    review_msg TEXT
)
LANGUAGE plpgsql AS $$
DECLARE
    hasRated  INTEGER;
    hasBought INTEGER;
    istar     INTEGER;
BEGIN
    SELECT COUNT(*) INTO hasRated
    FROM rates
    WHERE user_id = uid AND book_id = bid;

    SELECT COUNT(*) INTO hasBought
    FROM picked
    JOIN cart ON cart.id = picked.cart_id AND cart.user_id = uid
    JOIN book_order ON book_order.cart_id = cart.id AND book_order.state = '5'
    WHERE book_id = bid;

    istar := ROUND(star);

    IF hasRated = 0 AND hasBought <> 0 AND star > 0 AND star <= 5 THEN
        INSERT INTO rates(user_id, book_id, stars, review)
        VALUES (uid, bid, istar, review_msg);
        RAISE NOTICE 'Inserted review';
    ELSE
        RAISE NOTICE 'Cannot review';
    END IF;
END;
$$;


--assign new cart

CREATE OR REPLACE PROCEDURE assign_new_cart(uid INTEGER)
LANGUAGE plpgsql AS $$
DECLARE
    cid INTEGER;
BEGIN
    INSERT INTO cart(user_id) VALUES (uid) RETURNING id INTO cid;
    UPDATE app_user SET cart_id = cid WHERE id = uid;
END;
$$;

--create new order

CREATE OR REPLACE PROCEDURE create_order(
    uid INTEGER,
    vid INTEGER,
    name_ TEXT,
    phone1_ TEXT,
    phone2_ TEXT,
    address_ TEXT,
    pick_ INTEGER
)
LANGUAGE plpgsql AS $$
DECLARE
    cid              INTEGER;
    price_value      NUMERIC;
    item_count       INTEGER;
    cap_value        NUMERIC;
    discount_value   NUMERIC;
    stocked_out      INTEGER;
BEGIN
    -- Get user's current cart
    SELECT cart_id INTO cid FROM app_user WHERE id = uid;

    -- Calculate total price
    SELECT SUM(price * amount)
    INTO price_value
    FROM picked
    JOIN book ON picked.book_id = book.id
    WHERE cart_id = cid;

    -- Calculate total items
    SELECT SUM(amount)
    INTO item_count
    FROM picked
    WHERE cart_id = cid;

    IF item_count IS NULL OR item_count <= 0 THEN
        RETURN;
    END IF;

    -- Check stock availability
    stocked_out := has_stock(cid);
    IF stocked_out = 1 THEN
        RETURN;
    END IF;

    -- Apply voucher
    IF vid IS NOT NULL THEN
        SELECT discount INTO discount_value
        FROM voucher
        WHERE id = vid AND validity > NOW();

        SELECT cap INTO cap_value
        FROM voucher
        WHERE id = vid AND validity > NOW();

        price_value := price_value - LEAST(price_value * discount_value / 100, cap_value);
        price_value := CEIL(price_value);
    END IF;

    -- Insert into book_order
    INSERT INTO book_order(cart_id, voucher_id, total_price, total_item, name, phone1, phone2, address, pick, state)
    VALUES (cid, vid, price_value + 50, item_count, name_, phone1_, phone2_, address_, pick_, 1);

    -- Assign a new cart
    CALL assign_new_cart(uid);
END;
$$;
