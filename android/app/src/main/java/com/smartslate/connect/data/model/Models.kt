package com.smartslate.connect.data.model

import com.google.firebase.Timestamp

enum class UserRole {
    TEACHER,
    PARENT,
    ADMIN,
    UNKNOWN;

    companion object {
        fun fromString(role: String?): UserRole {
            return when (role?.lowercase()) {
                "teacher" -> TEACHER
                "parent" -> PARENT
                "admin" -> ADMIN
                else -> UNKNOWN
            }
        }
    }
}

data class User(
    val uid: String = "",
    val name: String = "",
    val email: String = "",
    val role: String = "parent",
    val phone: String = "",
    val photoUrl: String = "",
    val createdAt: Any? = null,
    val updatedAt: Any? = null
)

data class Teacher(
    val userId: String = "",
    val name: String = "",
    val email: String = "",
    val classIds: List<String> = emptyList(),
    val createdAt: Any? = null
)

data class Parent(
    val userId: String = "",
    val name: String = "",
    val email: String = "",
    val studentIds: List<String> = emptyList(),
    val createdAt: Any? = null
)

data class Student(
    val id: String = "",
    val userId: String = "",
    val name: String = "",
    val studentCode: String = "",
    val classId: String = "",
    val className: String = "Class 10-A",
    val createdAt: Any? = null
)

data class ClassItem(
    val id: String = "",
    val name: String = "",
    val section: String = "",
    val subject: String = "",
    val teacherId: String = "",
    val teacherName: String = "",
    val studentIds: List<String> = emptyList(),
    val academicYear: String = "2026",
    val createdAt: Any? = null
)

data class Assignment(
    val id: String = "",
    val classId: String = "",
    val className: String = "",
    val teacherId: String = "",
    val title: String = "",
    val description: String = "",
    val subject: String = "",
    val priority: String = "Normal",
    val dueAt: Timestamp? = null,
    val dueAtFormatted: String = "",
    val status: String = "published",
    val submissionCount: Int = 0,
    val totalStudents: Int = 0,
    val createdAt: Timestamp? = null,
    val updatedAt: Timestamp? = null
)

data class Submission(
    val id: String = "",
    val assignmentId: String = "",
    val assignmentTitle: String = "",
    val studentId: String = "",
    val studentName: String = "",
    val content: String = "",
    val submittedAt: Timestamp? = null,
    val submittedAtFormatted: String = "",
    val status: String = "pending", // pending, submitted, graded, late
    val grade: Double? = null,
    val maxGrade: Double = 100.0,
    val feedback: String = "",
    val gradedAt: Timestamp? = null
)

data class Attendance(
    val id: String = "",
    val classId: String = "",
    val className: String = "",
    val studentId: String = "",
    val studentName: String = "",
    val teacherId: String = "",
    val date: String = "",
    val status: String = "present", // present, absent, late, excused
    val createdAt: Timestamp? = null
)

data class Announcement(
    val id: String = "",
    val teacherId: String = "",
    val teacherName: String = "",
    val classId: String = "",
    val className: String = "",
    val title: String = "",
    val message: String = "",
    val priority: String = "normal",
    val createdAt: Timestamp? = null,
    val createdAtFormatted: String = ""
)

data class NotificationItem(
    val id: String = "",
    val userId: String = "",
    val title: String = "",
    val message: String = "",
    val type: String = "info",
    val read: Boolean = false,
    val createdAt: Timestamp? = null
)

data class StudentProgress(
    val studentId: String = "",
    val attendancePercentage: Double = 0.0,
    val assignmentCompletionPercentage: Double = 0.0,
    val averagePercentage: Double = 0.0,
    val totalAssignments: Int = 0,
    val completedAssignments: Int = 0,
    val totalClasses: Int = 0,
    val presentClasses: Int = 0,
    val updatedAt: Timestamp? = null
)
