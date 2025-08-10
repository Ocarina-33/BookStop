
SELECT *

 FROM app_user;

SELECT * FROM app_user WHERE id = 127;

SELECT * FROM book WHERE id = 7419;

CREATE TABLE test (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    password VARCHAR(1024),
    image VARCHAR(1000) DEFAULT 'https://www.123rf.com/photo_91832679_man-avatar-icon-flat-illustration-of-man-avatar-vector-icon-isolated-on-white-background.html',
    description VARCHAR(3000)
);

