-- Add 5 Best J.K. Rowling (Harry Potter) Books
-- Using author_id = 22 (J.K. Rowling) and publisher_id = 1 (Bloomsbury Publishing)

INSERT INTO book (id, author_id, publisher_id, name, image, isbn, page, edition, publishing_year, price, stock, language, genre, summary, star, review_count) VALUES 
(9001, 22, 1, 'Harry Potter and the Philosopher''s Stone', 
'https://m.media-amazon.com/images/I/91wKDODkgWL._AC_UF1000,1000_QL80_.jpg', 
'978-0-7475-3269-9', 223, '1st Edition', 1997, 450, 50,
'English', 'Fantasy, Adventure, Young Adult', 
'The first book in the beloved Harry Potter series follows young Harry as he discovers he is a wizard and begins his magical education at Hogwarts School of Witchcraft and Wizardry.',
4.8, 25000),

(9002, 22, 1, 'Harry Potter and the Chamber of Secrets', 
'https://m.media-amazon.com/images/I/81sjJLF+ysL._AC_UF1000,1000_QL80_.jpg', 
'978-0-7475-3849-3', 251, '1st Edition', 1998, 465, 45,
'English', 'Fantasy, Adventure, Young Adult', 
'In his second year at Hogwarts, Harry faces the mystery of the Chamber of Secrets and encounters the memory of Tom Riddle.',
4.7, 22000),

(9003, 22, 1, 'Harry Potter and the Prisoner of Azkaban', 
'https://m.media-amazon.com/images/I/81lAPl9Fl0L._AC_UF1000,1000_QL80_.jpg', 
'978-0-7475-4215-5', 317, '1st Edition', 1999, 480, 40,
'English', 'Fantasy, Adventure, Young Adult', 
'Harry learns more about his past and encounters his godfather Sirius Black while dealing with the dangerous Dementors.',
4.9, 28000),

(9004, 22, 1, 'Harry Potter and the Goblet of Fire', 
'https://m.media-amazon.com/images/I/81DjKLPJ-6L._AC_UF1000,1000_QL80_.jpg', 
'978-0-7475-4624-5', 636, '1st Edition', 2000, 520, 35,
'English', 'Fantasy, Adventure, Young Adult', 
'Harry competes in the dangerous Triwizard Tournament and witnesses the return of Lord Voldemort.',
4.8, 30000),

(9005, 22, 1, 'Harry Potter and the Order of the Phoenix', 
'https://m.media-amazon.com/images/I/81FqYjlFsAL._AC_UF1000,1000_QL80_.jpg', 
'978-0-7475-5100-6', 766, '1st Edition', 2003, 550, 30,
'English', 'Fantasy, Adventure, Young Adult', 
'Harry forms Dumbledore''s Army and faces the Ministry of Magic''s denial of Voldemort''s return.',
4.7, 26000);

-- Update existing books to create variety in ratings and reviews for featured sections

-- Make some existing books "Recently Sold" (lower stock, indicating recent sales)
UPDATE book SET stock = 5, review_count = 1500, star = 4.5 WHERE id = 145; -- নূরজাহান ১ম পর্ব
UPDATE book SET stock = 8, review_count = 1200, star = 4.3 WHERE id = 8208; -- ১৯৫২ : নিছক কোন সংখ্যা নয়
UPDATE book SET stock = 12, review_count = 980, star = 4.2 WHERE id = 183; -- Another book
UPDATE book SET stock = 15, review_count = 850, star = 4.4 WHERE id = 188; -- Another book
UPDATE book SET stock = 18, review_count = 720, star = 4.1 WHERE id = 190; -- Another book

-- Make some books "Best Sellers" (high ratings and good stock)
UPDATE book SET star = 4.8, review_count = 3500, stock = 75 WHERE id = 200;
UPDATE book SET star = 4.7, review_count = 2800, stock = 60 WHERE id = 205;
UPDATE book SET star = 4.9, review_count = 4200, stock = 80 WHERE id = 210;
UPDATE book SET star = 4.6, review_count = 2100, stock = 55 WHERE id = 215;
UPDATE book SET star = 4.8, review_count = 3100, stock = 70 WHERE id = 220;

-- Make some books "Most Reviewed" (very high review counts)
UPDATE book SET review_count = 5500, star = 4.4 WHERE id = 225;
UPDATE book SET review_count = 4800, star = 4.3 WHERE id = 230;
UPDATE book SET review_count = 4500, star = 4.5 WHERE id = 235;
UPDATE book SET review_count = 4200, star = 4.2 WHERE id = 240;
UPDATE book SET review_count = 3900, star = 4.6 WHERE id = 245;

-- Add some review data to make the books more realistic
INSERT INTO rates (user_id, book_id, stars, review, created_at) VALUES
-- Reviews for Harry Potter books
(127, 9001, 5, 'Absolutely magical! This book started my love for the Harry Potter series.', '2025-07-10'),
(127, 9002, 5, 'Even better than the first! The mystery kept me hooked.', '2025-07-08'),
(127, 9003, 5, 'My favorite so far! The time-turner plot was brilliant.', '2025-07-06'),
(127, 9004, 4, 'Darker and more complex. Great character development.', '2025-07-04'),
(127, 9005, 4, 'Long but worth it. The emotional depth is incredible.', '2025-07-02'),

-- Reviews for other featured books
(127, 145, 4, 'চমৎকার উপন্যাস! চরিত্রায়ণ অসাধারণ।', '2025-07-12'),
(127, 8208, 5, 'ইতিহাসের এক অনবদ্য কাহিনী।', '2025-07-11'),
(127, 200, 5, 'Outstanding book! Highly recommend to everyone.', '2025-07-09'),
(127, 225, 4, 'Great read with valuable insights.', '2025-07-07'),
(127, 230, 5, 'Could not put it down! Absolutely loved it.', '2025-07-05');

-- Create some purchase history for "Recently Sold Products"
-- These would be in the picked table from recent cart activities
INSERT INTO picked (cart_id, book_id, amount, created_at) VALUES
(1, 145, 2, '2025-07-14'),
(1, 8208, 1, '2025-07-13'),
(1, 183, 1, '2025-07-12'),
(1, 188, 3, '2025-07-11'),
(1, 190, 1, '2025-07-10'),
(1, 9001, 2, '2025-07-09'),
(1, 9002, 1, '2025-07-08');

COMMIT;
