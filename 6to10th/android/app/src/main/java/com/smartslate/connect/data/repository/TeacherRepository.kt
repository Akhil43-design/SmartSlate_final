package com.smartslate.connect.data.repository

import com.google.firebase.Timestamp
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.smartslate.connect.data.model.*
import kotlinx.coroutines.tasks.await
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class TeacherRepository(
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance()
) {

    suspend fun getTeacherClasses(teacherId: String): List<ClassItem> {
        return try {
            val snapshot = firestore.collection("classes")
                .whereEqualTo("teacherId", teacherId)
                .get()
                .await()

            if (!snapshot.isEmpty) {
                snapshot.documents.mapNotNull { doc ->
                    doc.toObject(ClassItem::class.java)?.copy(id = doc.id)
                }
            } else {
                getMockClasses(teacherId)
            }
        } catch (e: Exception) {
            getMockClasses(teacherId)
        }
    }

    suspend fun getClassStudents(classId: String): List<Student> {
        return try {
            val snapshot = firestore.collection("students")
                .whereEqualTo("classId", classId)
                .get()
                .await()

            if (!snapshot.isEmpty) {
                snapshot.documents.mapNotNull { doc ->
                    doc.toObject(Student::class.java)?.copy(id = doc.id)
                }
            } else {
                getMockStudents(classId)
            }
        } catch (e: Exception) {
            getMockStudents(classId)
        }
    }

    suspend fun createAssignment(assignment: Assignment): Boolean {
        return try {
            val newRef = firestore.collection("assignments").document()
            val createdAssignment = assignment.copy(
                id = newRef.id,
                createdAt = Timestamp.now(),
                updatedAt = Timestamp.now()
            )
            newRef.set(createdAssignment).await()
            true
        } catch (e: Exception) {
            false
        }
    }

    suspend fun getTeacherAssignments(teacherId: String): List<Assignment> {
        return try {
            val snapshot = firestore.collection("assignments")
                .whereEqualTo("teacherId", teacherId)
                .get()
                .await()

            if (!snapshot.isEmpty) {
                snapshot.documents.mapNotNull { doc ->
                    doc.toObject(Assignment::class.java)?.copy(id = doc.id)
                }
            } else {
                getMockAssignments(teacherId)
            }
        } catch (e: Exception) {
            getMockAssignments(teacherId)
        }
    }

    suspend fun getAssignmentSubmissions(assignmentId: String): List<Submission> {
        return try {
            val snapshot = firestore.collection("submissions")
                .whereEqualTo("assignmentId", assignmentId)
                .get()
                .await()

            if (!snapshot.isEmpty) {
                snapshot.documents.mapNotNull { doc ->
                    doc.toObject(Submission::class.java)?.copy(id = doc.id)
                }
            } else {
                getMockSubmissions(assignmentId)
            }
        } catch (e: Exception) {
            getMockSubmissions(assignmentId)
        }
    }

    suspend fun gradeSubmission(submissionId: String, grade: Double, feedback: String): Boolean {
        return try {
            val updates = mapOf(
                "grade" to grade,
                "feedback" to feedback,
                "status" to "graded",
                "gradedAt" to Timestamp.now()
            )
            firestore.collection("submissions").document(submissionId).update(updates).await()
            true
        } catch (e: Exception) {
            false
        }
    }

    suspend fun saveAttendance(classId: String, className: String, teacherId: String, date: String, records: List<Pair<String, String>>): Boolean {
        return try {
            val batch = firestore.batch()
            records.forEach { (studentId, status) ->
                val docRef = firestore.collection("attendance").document("${classId}_${studentId}_$date")
                val data = Attendance(
                    id = docRef.id,
                    classId = classId,
                    className = className,
                    studentId = studentId,
                    teacherId = teacherId,
                    date = date,
                    status = status,
                    createdAt = Timestamp.now()
                )
                batch.set(docRef, data)
            }
            batch.commit().await()
            true
        } catch (e: Exception) {
            false
        }
    }

    suspend fun createAnnouncement(announcement: Announcement): Boolean {
        return try {
            val docRef = firestore.collection("announcements").document()
            val data = announcement.copy(id = docRef.id, createdAt = Timestamp.now())
            docRef.set(data).await()
            true
        } catch (e: Exception) {
            false
        }
    }

    // Fallback Mock Data for instant execution/demo
    private fun getMockClasses(teacherId: String): List<ClassItem> {
        return listOf(
            ClassItem("c101", "Class 10-A", "A", "Mathematics", teacherId, "Prof. Sharma", listOf("s1", "s2", "s3", "s4", "s5"), "2026"),
            ClassItem("c102", "Class 10-B", "B", "Physics", teacherId, "Prof. Sharma", listOf("s6", "s7", "s8"), "2026"),
            ClassItem("c103", "Class 9-A", "A", "Science", teacherId, "Prof. Sharma", listOf("s9", "s10"), "2026")
        )
    }

    private fun getMockStudents(classId: String): List<Student> {
        return listOf(
            Student("s1", "u_s1", "Aarav Mehta", "STU-1001", classId, "Class 10-A"),
            Student("s2", "u_s2", "Ananya Verma", "STU-1002", classId, "Class 10-A"),
            Student("s3", "u_s3", "Rohan Gupta", "STU-1003", classId, "Class 10-A"),
            Student("s4", "u_s4", "Ishita Patel", "STU-1004", classId, "Class 10-A"),
            Student("s5", "u_s5", "Kabir Singh", "STU-1005", classId, "Class 10-A")
        )
    }

    private fun getMockAssignments(teacherId: String): List<Assignment> {
        val dateFormat = SimpleDateFormat("MMM dd, yyyy - hh:mm a", Locale.getDefault())
        val dueDate = Date(System.currentTimeMillis() + 86400000 * 2)
        return listOf(
            Assignment("a1", "c101", "Class 10-A", teacherId, "Quadratic Equations Problem Set", "Complete Problems 1 to 15 from Chapter 4 in your SmartSlate workbook.", "Mathematics", "High", Timestamp(dueDate), dateFormat.format(dueDate), "published", 4, 5),
            Assignment("a2", "c101", "Class 10-A", teacherId, "Trigonometry Basics Quiz", "Answer questions on Sine, Cosine, and Tangent identities.", "Mathematics", "Normal", Timestamp(Date(System.currentTimeMillis() + 86400000 * 4)), dateFormat.format(Date(System.currentTimeMillis() + 86400000 * 4)), "published", 2, 5),
            Assignment("a3", "c102", "Class 10-B", teacherId, "Newton's Laws Lab Report", "Summarize velocity and acceleration experiment observations.", "Physics", "Normal", Timestamp(Date(System.currentTimeMillis() - 86400000)), dateFormat.format(Date(System.currentTimeMillis() - 86400000)), "completed", 3, 3)
        )
    }

    private fun getMockSubmissions(assignmentId: String): List<Submission> {
        val now = Timestamp.now()
        val formatted = SimpleDateFormat("MMM dd, hh:mm a", Locale.getDefault()).format(now.toDate())
        return listOf(
            Submission("sub1", assignmentId, "Quadratic Equations Problem Set", "s1", "Aarav Mehta", "Completed solutions step-by-step for Q1-Q15.", now, formatted, "graded", 95.0, 100.0, "Excellent work! Neat steps.", now),
            Submission("sub2", assignmentId, "Quadratic Equations Problem Set", "s2", "Ananya Verma", "Solved Q1 to Q12.", now, formatted, "graded", 88.0, 100.0, "Good effort, double check Q10.", now),
            Submission("sub3", assignmentId, "Quadratic Equations Problem Set", "s3", "Rohan Gupta", "Attached notebook summary for problems.", now, formatted, "submitted", null, 100.0, "", null),
            Submission("sub4", assignmentId, "Quadratic Equations Problem Set", "s4", "Ishita Patel", "Draft completed locally.", now, formatted, "pending", null, 100.0, "", null)
        )
    }
}
