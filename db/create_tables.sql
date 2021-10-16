CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) UNIQUE,
    username VARCHAR(100) UNIQUE,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    firstname VARCHAR(100),
    lastname VARCHAR(100),
    sex VARCHAR(100),
    verified BOOLEAN, 
    sexuality VARCHAR(100),
    longitude DECIMAL(11,8),
    latitude DECIMAL(10,8),
    bio VARCHAR(255),
    birthday DATE ,
    famerate DECIMAL(20),
    connected BOOLEAN, 
    PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS likes (
    like_id INT AUTO_INCREMENT PRIMARY KEY,
    liked_userId VARCHAR(255),
    liking_userID VARCHAR(255),
    date_like DATETIME,
    matched INT,
    notify BOOLEAN,
    FOREIGN KEY (liked_userId) REFERENCES users(id),
    FOREIGN KEY (liking_userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS matches (
    match_id INT AUTO_INCREMENT PRIMARY KEY,
    user_1 VARCHAR(255),
    user_2 VARCHAR(255),
    date_match DATETIME,
    notify BOOLEAN,
    FOREIGN KEY (user_1) REFERENCES users(id),
    FOREIGN KEY (user_2) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS views (
    view_id INT AUTO_INCREMENT PRIMARY KEY,
    viewed_user_id VARCHAR(255),
    viewing_user_id VARCHAR(255),
    date_view DATETIME,
    count_view INT,
    notify BOOLEAN,
    FOREIGN KEY (viewed_user_id) REFERENCES users(id),
    FOREIGN KEY (viewing_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS messages (
    message_id VARCHAR(255) UNIQUE PRIMARY KEY,
    message_content TEXT,
    checked BOOLEAN,
    sender_id VARCHAR(255),
    reciever_id VARCHAR(255),
    message_date DATETIME,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (reciever_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS pictures (
    picture_id INT AUTO_INCREMENT PRIMARY KEY,
    picture_1 VARCHAR(100) UNIQUE,
    picture_2 VARCHAR(100) UNIQUE,
    picture_3 VARCHAR(100) UNIQUE,
    picture_4 VARCHAR(100) UNIQUE,
    picture_5 VARCHAR(100) UNIQUE,
    owner_id VARCHAR(255),
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS tags (
    tag_id INT AUTO_INCREMENT PRIMARY KEY,
    tag_value VARCHAR(100) UNIQUE
);

CREATE TABLE IF NOT EXISTS user_selected_tags (
    user_id VARCHAR(255) REFERENCES users(id),
    tag_id INT REFERENCES tags(tag_id),
    PRIMARY KEY (user_id, tag_id)
);

CREATE TABLE IF NOT EXISTS reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    reporter_id VARCHAR(255) REFERENCES users(id),
    reported_id VARCHAR(255) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS blocks (
    block_id INT AUTO_INCREMENT PRIMARY KEY,
    blocker_id VARCHAR(255) REFERENCES users(id),
    blocked_id VARCHAR(255) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
    notif_id INT AUTO_INCREMENT PRIMARY KEY,
    notif_from VARCHAR(255) REFERENCES users(id),
    notif_for VARCHAR(255) REFERENCES users(id),
    notif_type ENUM('like', 'unlike', 'message', 'match', 'view'),
    notif_date DATETIME,
    seen BOOLEAN
);

