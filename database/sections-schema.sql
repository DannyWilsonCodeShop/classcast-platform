-- Sections Table
-- Represents different sections of a course (e.g., Period 1, 2, 3 or Section A, B, C)
CREATE TABLE IF NOT EXISTS sections (
    section_id VARCHAR(255) PRIMARY KEY,
    course_id VARCHAR(255) NOT NULL,
    section_name VARCHAR(100) NOT NULL, -- e.g., "Period 1", "Section A", "Morning Class"
    section_code VARCHAR(20), -- e.g., "P1", "A", "MORN"
    description TEXT,
    max_enrollment INTEGER DEFAULT 30,
    current_enrollment INTEGER DEFAULT 0,
    schedule JSON, -- Store schedule information as JSON
    location VARCHAR(255), -- Classroom or online location
    instructor_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Foreign key constraints
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_sections_course_id (course_id),
    INDEX idx_sections_instructor_id (instructor_id),
    INDEX idx_sections_active (is_active),
    
    -- Unique constraint for section name within a course
    UNIQUE KEY unique_section_per_course (course_id, section_name)
);

-- Section Enrollments Table
-- Tracks which students are enrolled in which sections
CREATE TABLE IF NOT EXISTS section_enrollments (
    enrollment_id VARCHAR(255) PRIMARY KEY,
    section_id VARCHAR(255) NOT NULL,
    student_id VARCHAR(255) NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'dropped', 'transferred') DEFAULT 'active',
    
    -- Foreign key constraints
    FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_section_enrollments_section_id (section_id),
    INDEX idx_section_enrollments_student_id (student_id),
    INDEX idx_section_enrollments_status (status),
    
    -- Unique constraint to prevent duplicate enrollments
    UNIQUE KEY unique_student_section (section_id, student_id)
);

-- Assignment Sections Table
-- Links assignments to specific sections
CREATE TABLE IF NOT EXISTS assignment_sections (
    assignment_section_id VARCHAR(255) PRIMARY KEY,
    assignment_id VARCHAR(255) NOT NULL,
    section_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (assignment_id) REFERENCES assignments(assignment_id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_assignment_sections_assignment_id (assignment_id),
    INDEX idx_assignment_sections_section_id (section_id),
    
    -- Unique constraint to prevent duplicate assignment-section links
    UNIQUE KEY unique_assignment_section (assignment_id, section_id)
);

-- Update existing tables to support sections
-- Add section_id to submissions table
ALTER TABLE submissions 
ADD COLUMN section_id VARCHAR(255),
ADD INDEX idx_submissions_section_id (section_id),
ADD FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE SET NULL;

-- Add section_id to course_enrollments table (if it exists)
-- This allows tracking which section a student is enrolled in
ALTER TABLE course_enrollments 
ADD COLUMN section_id VARCHAR(255),
ADD INDEX idx_course_enrollments_section_id (section_id),
ADD FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE SET NULL;
