-- Fix Rating System Script
-- This script will recalculate all book ratings to show proper averages instead of sums

-- First, let's see the current problematic ratings
SELECT 
    b.id,
    b.name,
    b.star as current_star,
    b.review_count,
    ROUND(AVG(r.stars), 1) as correct_average,
    COUNT(r.id) as actual_review_count
FROM book b
LEFT JOIN rates r ON r.book_id = b.id
WHERE b.review_count > 0
GROUP BY b.id, b.name, b.star, b.review_count
ORDER BY b.star DESC;

-- Update all book ratings to show correct averages
UPDATE book 
SET star = COALESCE((
    SELECT ROUND(AVG(stars), 1)
    FROM rates
    WHERE book_id = book.id
), 0),
review_count = COALESCE((
    SELECT COUNT(*)
    FROM rates
    WHERE book_id = book.id
), 0);

-- Verify the fix
SELECT 
    b.id,
    b.name,
    b.star as fixed_star,
    b.review_count as fixed_count,
    (SELECT AVG(r.stars) FROM rates r WHERE r.book_id = b.id) as verification_avg
FROM book b
WHERE b.review_count > 0
ORDER BY b.star DESC;

COMMIT;
