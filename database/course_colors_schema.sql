-- Course Colors Database Schema
-- This file documents the database structure for course background colors

-- Courses table with background color support
CREATE TABLE courses (
    course_id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    code VARCHAR(50) NOT NULL,
    department VARCHAR(100),
    credits INT DEFAULT 3,
    semester VARCHAR(50),
    year INT,
    background_color VARCHAR(7) DEFAULT '#4A90E2', -- Hex color code
    instructor_id VARCHAR(255) NOT NULL,
    instructor_name VARCHAR(255) NOT NULL,
    instructor_email VARCHAR(255) NOT NULL,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    start_date DATE,
    end_date DATE,
    max_students INT,
    current_enrollment INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL,
    
    INDEX idx_instructor (instructor_id),
    INDEX idx_status (status),
    INDEX idx_semester_year (semester, year),
    INDEX idx_department (department)
);

-- Available course colors reference table
CREATE TABLE course_colors (
    color_id INT AUTO_INCREMENT PRIMARY KEY,
    color_name VARCHAR(50) NOT NULL,
    hex_code VARCHAR(7) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_hex_code (hex_code)
);

-- Insert default course colors
INSERT INTO course_colors (color_name, hex_code) VALUES
('Sky Blue', '#4A90E2'),
('Coral', '#FF6F61'),
('Golden Yellow', '#FFD166'),
('Mint Green', '#06D6A0'),
('Lavender', '#9B5DE5'),
('Charcoal', '#333333'),
('Ocean Blue', '#0077BE'),
('Forest Green', '#228B22'),
('Sunset Orange', '#FF8C00'),
('Royal Purple', '#800080'),
('Crimson Red', '#DC143C'),
('Teal', '#008080');

-- Course color preferences for instructors
CREATE TABLE instructor_color_preferences (
    preference_id INT AUTO_INCREMENT PRIMARY KEY,
    instructor_id VARCHAR(255) NOT NULL,
    course_id VARCHAR(255),
    preferred_colors JSON, -- Array of preferred color IDs
    default_color VARCHAR(7) DEFAULT '#4A90E2',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    INDEX idx_instructor (instructor_id)
);

-- Example queries for course colors

-- Get all available colors
SELECT color_name, hex_code FROM course_colors WHERE is_active = TRUE ORDER BY color_name;

-- Get courses with their background colors
SELECT 
    c.course_id,
    c.title,
    c.code,
    c.background_color,
    cc.color_name
FROM courses c
LEFT JOIN course_colors cc ON c.background_color = cc.hex_code
WHERE c.status = 'published'
ORDER BY c.title;

-- Update course background color
UPDATE courses 
SET background_color = '#06D6A0', updated_at = CURRENT_TIMESTAMP 
WHERE course_id = 'your-course-id';

-- Get instructor's color preferences
SELECT 
    icp.preferred_colors,
    icp.default_color,
    c.title as course_title
FROM instructor_color_preferences icp
LEFT JOIN courses c ON icp.course_id = c.course_id
WHERE icp.instructor_id = 'your-instructor-id';
