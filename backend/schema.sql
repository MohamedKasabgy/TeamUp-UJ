DROP DATABASE IF EXISTS uj_filehub;
CREATE DATABASE uj_filehub;
USE uj_filehub;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    university_id VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin') DEFAULT 'student',
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
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
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

-- Create the existing files for testing
INSERT INTO files (user_id, course_id, file_title, file_description, file_path, status) VALUES
(1, 1, 'CCSW 321 Part1 INTRODUCTION', 'A helpful file for web', '/uploads/web/CCSW 321 Part1 INTRODUCTION.pdf', 'approved'),
(1, 1, 'CCSW 321 Part2.1 HTML', 'A helpful file for web', '/uploads/web/CCSW 321 Part2.1 HTML.pdf', 'approved'),
(1, 1, 'CCSW321-Part2.2-HTML (1)', 'A helpful file for web', '/uploads/web/CCSW321-Part2.2-HTML (1).pdf', 'approved'),
(1, 1, 'CCSW321-Part3.1-CSS', 'A helpful file for web', '/uploads/web/CCSW321-Part3.1-CSS.pdf', 'approved'),
(1, 1, 'CCSW321-Part3.2-CSS', 'A helpful file for web', '/uploads/web/CCSW321-Part3.2-CSS.pdf', 'approved'),
(1, 1, 'CCSW321-Part4-JS (1)', 'A helpful file for web', '/uploads/web/CCSW321-Part4-JS (1).pdf', 'approved'),
(1, 1, 'CCSW321-Part5.1-JS4Web', 'A helpful file for web', '/uploads/web/CCSW321-Part5.1-JS4Web.pdf', 'approved'),
(1, 1, 'CCSW321-Part5.2-JS4Web', 'A helpful file for web', '/uploads/web/CCSW321-Part5.2-JS4Web.pdf', 'approved'),
(1, 1, 'CCSW321-Part6-JS4Backend', 'A helpful file for web', '/uploads/web/CCSW321-Part6-JS4Backend.pdf', 'approved'),
(1, 4, '01 Fundamentals_modified-New', 'A helpful file for algorithm', '/uploads/algorithm/01 Fundamentals_modified-New.pptx', 'approved'),
(1, 4, '02 Brute Force_modified', 'A helpful file for algorithm', '/uploads/algorithm/02 Brute Force_modified.pptx', 'approved'),
(1, 4, '03 Divide and Conquer_modified', 'A helpful file for algorithm', '/uploads/algorithm/03 Divide and Conquer_modified.pptx', 'approved'),
(1, 4, '04 Transform and Conquer', 'A helpful file for algorithm', '/uploads/algorithm/04 Transform and Conquer.pptx', 'approved'),
(1, 4, '05 Space and Time Tradeoffs_modified', 'A helpful file for algorithm', '/uploads/algorithm/05 Space and Time Tradeoffs_modified.pptx', 'approved'),
(1, 4, '06 Dynamic Programming', 'A helpful file for algorithm', '/uploads/algorithm/06 Dynamic Programming.pptx', 'approved'),
(1, 4, '07 Greedy Technique', 'A helpful file for algorithm', '/uploads/algorithm/07 Greedy Technique.pptx', 'approved'),
(1, 5, 'Chapter 1 What is Software Architecture', 'A helpful file for Architecture', '/uploads/Architecture/Chapter 1 What is Software Architecture.pdf', 'approved'),
(1, 5, 'Chapter 13 Patterns and Tactics', 'A helpful file for Architecture', '/uploads/Architecture/Chapter 13 Patterns and Tactics.pdf', 'approved'),
(1, 5, 'Chapter 16 Architecture and Requirements', 'A helpful file for Architecture', '/uploads/Architecture/Chapter 16 Architecture and Requirements.pdf', 'approved'),
(1, 5, 'Chapter 17 Designing an Architecture', 'A helpful file for Architecture', '/uploads/Architecture/Chapter 17 Designing an Architecture.pdf', 'approved'),
(1, 5, 'Chapter 3 The Many Contexts of Software.ppt', 'A helpful file for Architecture', '/uploads/Architecture/Chapter 3 The Many Contexts of Software.ppt.pdf', 'approved'),
(1, 5, 'Chapter 4 Understanding quality attributes', 'A helpful file for Architecture', '/uploads/Architecture/Chapter 4 Understanding quality attributes.pdf', 'approved'),
(1, 5, 'Chapter 5-11 Examples', 'A helpful file for Architecture', '/uploads/Architecture/Chapter 5-11 Examples.pdf', 'approved'),
(1, 5, 'Chapter 5-11 Quality attributesV3', 'A helpful file for Architecture', '/uploads/Architecture/Chapter 5-11 Quality attributesV3.pdf', 'approved');