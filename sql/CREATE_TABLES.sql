-- Drop all user-defined tables in the current schema (cascade deletes all dependencies)
DO
$$
DECLARE
    _tbl TEXT;
BEGIN
    FOR _tbl IN
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP TABLE IF EXISTS %I CASCADE;', _tbl);
    END LOOP;
END;
$$;

-- 1. Author table
CREATE TABLE author (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    password VARCHAR(1024),
    image VARCHAR(1000) DEFAULT 'https://www.123rf.com/photo_91832679_man-avatar-icon-flat-illustration-of-man-avatar-vector-icon-isolated-on-white-background.html',
    description VARCHAR(3000)
);

-- 3. Publisher table
CREATE TABLE publisher (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    founding_date DATE,
    image VARCHAR(1000) DEFAULT 'https://ds.rokomari.store/rokomari110/company/publisher.png'
);

-- 4. Voucher table
CREATE TABLE voucher (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    discount NUMERIC NOT NULL,
    validity DATE,
    cap NUMERIC DEFAULT 250
);

-- 5. App User table
CREATE TABLE app_user (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(1024) NOT NULL,
    address VARCHAR(1000),
    phone VARCHAR(20),
    dob VARCHAR(20),
    image VARCHAR(1000) DEFAULT '/images/no-profile-picture.jpg',
    cart_id INTEGER
);

-- 7. Cart table
CREATE TABLE cart (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    created_at DATE DEFAULT CURRENT_DATE,
    CONSTRAINT cart_user_fk FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE
);

-- 8. Add foreign key for cart_id in app_user (after cart creation)
ALTER TABLE app_user
ADD CONSTRAINT app_user_cart_id_fk FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE;

-- 6. Book table
CREATE TABLE book (
    id SERIAL PRIMARY KEY,
    author_id INTEGER,
    publisher_id INTEGER,
    name VARCHAR(100),
    image VARCHAR(1000) DEFAULT '/images/books/defaultbook.jpg',
    isbn VARCHAR(100),
    page NUMERIC,
    edition VARCHAR(100),
    publishing_year NUMERIC,
    price NUMERIC,
    stock NUMERIC,
    language VARCHAR(20),
    genre VARCHAR(512),
    summary VARCHAR(3000),
    star NUMERIC DEFAULT 0,
    review_count NUMERIC DEFAULT 0,
    CONSTRAINT book_author_fk FOREIGN KEY (author_id) REFERENCES author(id) ON DELETE CASCADE,
    CONSTRAINT book_publisher_fk FOREIGN KEY (publisher_id) REFERENCES publisher(id) ON DELETE CASCADE
);

-- 9. Book Order table
CREATE TABLE book_order (
    id SERIAL PRIMARY KEY,
    cart_id INTEGER,
    voucher_id INTEGER,
    name VARCHAR(100) NOT NULL,
    phone1 VARCHAR(20) NOT NULL,
    phone2 VARCHAR(20),
    address VARCHAR(1000),
    pick INTEGER DEFAULT 1 NOT NULL,
    total_price NUMERIC,
    total_item NUMERIC,
    state VARCHAR(50),
    payment_method VARCHAR(50),
    created_at DATE DEFAULT CURRENT_DATE,
    CONSTRAINT order_cart_fk FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE,
    CONSTRAINT order_voucher_fk FOREIGN KEY (voucher_id) REFERENCES voucher(id) ON DELETE SET NULL
);

-- 10. Rates table
CREATE TABLE rates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    book_id INTEGER,
    stars NUMERIC,
    review VARCHAR(1000),
    created_at DATE DEFAULT CURRENT_DATE,
    CONSTRAINT rates_user_fk FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE,
    CONSTRAINT rates_book_fk FOREIGN KEY (book_id) REFERENCES book(id) ON DELETE CASCADE
);

-- 11. Picked (cart-book relationship) table
CREATE TABLE picked (
    id SERIAL PRIMARY KEY,
    cart_id INTEGER,
    book_id INTEGER,
    created_at DATE DEFAULT CURRENT_DATE,
    amount INTEGER DEFAULT 1 CHECK (amount BETWEEN 1 AND 5),
    CONSTRAINT picked_cart_fk FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE,
    CONSTRAINT picked_book_fk FOREIGN KEY (book_id) REFERENCES book(id) ON DELETE CASCADE
);

-- 13. Wish List table (many-to-many: user <-> book)
CREATE TABLE wish_list (
    user_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, book_id),
    CONSTRAINT wish_list_user_fk FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE,
    CONSTRAINT wish_list_book_fk FOREIGN KEY (book_id) REFERENCES book(id) ON DELETE CASCADE
);

-----new add---
-- 1) Insert a cart row for every user
WITH new_carts AS (
  INSERT INTO cart (user_id)
  SELECT id FROM app_user
  RETURNING id AS cart_id, user_id
)
-- 2) Update each user’s cart_id to the newly created cart
UPDATE app_user
SET cart_id = new_carts.cart_id
FROM new_carts
WHERE app_user.id = new_carts.user_id;
