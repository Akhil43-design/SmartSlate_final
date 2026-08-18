package com.smartslate.connect.data.repository

import com.google.firebase.Timestamp
import com.google.firebase.firestore.FirebaseFirestore
import com.smartslate.connect.data.model.*
import kotlinx.coroutines.tasks.await
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class ParentRepository(
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance()
) {

    suspend fun getParentChildren(parentUserId: String): List<Student> {
        return try {
            val parentDoc = firestore.collection("parents").document(parentUserId).get().await()
            val studentIds = if (parentDoc.exists()) {
                parentDoc.toObject(Parent::class.java)?.studentIds ?: emptyList()
            } else {
                emptyList()
            }

            if (studentIds.isNotEmpty()) {
                val snapshot = firestore.collection("students")
                    .whereIn("id", studentIds)
                    .get()
                    .await()
                snapshot.documents.mapNotNull { doc ->
                    doc.toObject(Student::class.java)?.copy(id = doc.id)
                }
            } else {
                getMockChildren(parentUserId)
            }
        } catch (e: Exception) {
            getMockChildren(parentUserId)
        }
    }

    suspend fun getChildAttendance(studentId: String): List<Attendance> {
        return try {
            val snapshot = firestore.collection("attendance")
                .whereEqualTo("studentId", studentId)
                .get()
                .await()

            if (!snapshot.isEmpty) {
                snapshot.documents.mapNotNull { doc ->
                    doc.toObject(Attendance::class.java)?.copy(id = doc.id)
                }
            } else {
                getMockAttendance(studentId)
            }
        } catch (e: Exception) {
            getMockAttendance(studentId)
        }
    }

    suspend fun getChildSubmissions(studentId: String): List<Submission> {
        return try {
            val snapshot = firestore.collection("submissions")
                .whereEqualTo("studentId", studentId)
                .get()
                .await()

            if (!snapshot.isEmpty) {
                snapshot.documents.mapNotNull { doc ->
                    doc.toObject(Submission::class.java)?.copy(id = doc.id)
                }
            } else {
                getMockSubmissions(studentId)
            }
        } catch (e: Exception) {
            getMockSubmissions(studentId)
        }
    }

    suspend fun getChildProgress(studentId: String): StudentProgress {
        return try {
            val doc = firestore.collection("student_progress").document(studentId).get().await()
            if (doc.exists()) {
                doc.toObject(StudentProgress::class.java) ?: getMockProgress(studentId)
            } else {
                getMockProgress(studentId)
            }
        } catch (e: Exception) {
            getMockProgress(studentId)
        }
    }

    suspend fun getAnnouncementsForClass(classId: String): List<Announcement> {
        return try {
            val snapshot = firestore.collection("announcements")
                .whereEqualTo("classId", classId)
                .get()
                .await()

            if (!snapshot.isEmpty) {
                snapshot.documents.mapNotNull { doc ->
                    doc.toObject(Announcement::class.java)?.copy(id = doc.id)
                }
            } else {
                getMockAnnouncements(classId)
            }
        } catch (e: Exception) {
            getMockAnnouncements(classId)
        }
    }

    private fun getMockChildren(parentUserId: String): List<Student> {
        return listOf(
            Student("s1", "u_s1", "Aarav Mehta", "STU-1001", "c101", "Class 10-A"),
            Student("s6", "u_s6", "Diya Mehta", "STU-1006", "c103", "Class 9-A")
        )
    }

    private fun getMockAttendance(studentId: String): List<Attendance> {
        return listOf(
            Attendance("att1", "c101", "Class 10-A", studentId, "Aarav Mehta", "t1", "2026-08-10", "present"),
            Attendance("att2", "c101", "Class 10-A", studentId, "Aarav Mehta", "t1", "2026-08-09", "present"),
            Attendance("att3", "c101", "Class 10-A", studentId, "Aarav Mehta", "t1", "2026-08-08", "present"),
            Attendance("att4", "c101", "Class 10-A", studentId, "Aarav Mehta", "t1", "2026-08-07", "late"),
            Attendance("att5", "c101", "Class 10-A", studentId, "Aarav Mehta", "t1", "2026-08-06", "present"),
            Attendance("att6", "c101", "Class 10-A", studentId, "Aarav Mehta", "t1", "2026-08-05", "absent")
        )
    }

    private fun getMockSubmissions(studentId: String): List<Submission> {
        val now = Timestamp.now()
        val formatted = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()).format(now.toDate())
        return listOf(
            Submission("sub1", "a1", "Quadratic Equations Problem Set", studentId, "Aarav Mehta", "Completed solutions for Q1-Q15.", now, formatted, "graded", 95.0, 100.0, "Excellent work! Keep it up.", now),
            Submission("sub2", "a2", "Trigonometry Basics Quiz", studentId, "Aarav Mehta", "Submitted quiz responses.", now, formatted, "graded", 90.0, 100.0, "Great understanding of identities.", now),
            Submission("sub3", "a3", "Newton's Laws Lab Report", studentId, "Aarav Mehta", "Draft laboratory report.", now, formatted, "submitted", null, 100.0, "Under evaluation by teacher.", null)
        )
    }

    private fun getMockProgress(studentId: String): StudentProgress {
        return StudentProgress(
            studentId = studentId,
            attendancePercentage = 92.5,
            assignmentCompletionPercentage = 95.0,
            averagePercentage = 92.8,
            totalAssignments = 12,
            completedAssignments = 11,
            totalClasses = 40,
            presentClasses = 37,
            updatedAt = Timestamp.now()
        )
    }

    private fun getMockAnnouncements(classId: String): List<Announcement> {
        val dateFormat = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault())
        return listOf(
            Announcement("anc1", "t1", "Prof. Sharma", classId, "Class 10-A", "Mid-Term Examination Schedule", "The Mathematics mid-term exam will take place on Monday, Aug 18th at 09:00 AM.", "high", Timestamp.now(), dateFormat.format(Date())),
            Announcement("anc2", "t1", "Prof. Sharma", classId, "Class 10-A", "Parent-Teacher Conference", "Quarterly progress review meeting scheduled for Saturday, Aug 23rd.", "normal", Timestamp.now(), dateFormat.format(Date()))
        )
    }
}
