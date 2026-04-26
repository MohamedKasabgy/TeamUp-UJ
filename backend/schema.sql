DROP DATABASE IF EXISTS uj_filehub;
CREATE DATABASE uj_filehub;
USE uj_filehub;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    university_id VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL UNIQUE,
    course_code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    file_title VARCHAR(150) NOT NULL,
    file_description TEXT,
    file_path VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE study_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    session_date DATE NOT NULL,
    session_time TIME NOT NULL,
    session_type ENUM('online', 'on-campus') NOT NULL,
    location VARCHAR(255),
    meeting_link VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    gender ENUM('male', 'female') NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    date_of_birth DATE NOT NULL,
    email VARCHAR(100) NOT NULL,
    language VARCHAR(30) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO courses (course_name, course_code, description) VALUES
('Web Development', 'CCSW321', 'Course materials for web development topics, labs, and resources.'),
('Database Systems', 'CCSW315', 'Resources related to SQL, database design, and DBMS concepts.'),
('Software Engineering', 'SWE302', 'Documents, notes, and study materials for software engineering.'),
('Algorithms', 'CS230', 'Problem solving, algorithm analysis, and practice resources.'),
('Computer Architecture', 'CS240', 'Architecture, assembly, and hardware-related materials.'),
('Networks', 'CNET220', 'Networking concepts, lab resources, and protocol notes.'),
('Operating Systems', 'CS350', 'Processes, memory, scheduling, and system concepts.'),
('Artificial Intelligence', 'AI310', 'AI basics, search, agents, and intelligent systems.'),
('Cybersecurity', 'CYB320', 'Security concepts, threats, and defensive techniques.');