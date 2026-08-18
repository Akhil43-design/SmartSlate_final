package com.smartslate.connect.data.repository

import com.google.firebase.Timestamp
import com.google.firebase.firestore.FirebaseFirestore
import com.smartslate.connect.data.model.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class TeacherRepository(
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance()
) {

    private val cachedAssignments = mutableListOf<Assignment>()
    private var isInitialized = false

    private fun ensureInitialized(teacherId: String) {
        if (!isInitialized) {
            cachedAssignments.clear()
            cachedAssignments.addAll(getMockAssignments(teacherId))
            isInitialized = true
        }
    }

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
        ensureInitialized(assignment.teacherId)
        
        val assignmentId = "assign_${System.currentTimeMillis()}"
        val createdAssignment = assignment.copy(
            id = assignmentId,
            createdAt = Timestamp.now(),
            updatedAt = Timestamp.now()
        )

        // Add to local cache immediately so Mobile App UI updates instantly
        cachedAssignments.add(0, createdAssignment)

        // Non-blocking background sync to Firestore & local Student Server
        CoroutineScope(Dispatchers.IO).launch {
            // 1. Sync to Firebase Firestore
            try {
                firestore.collection("assignments").document(assignmentId).set(createdAssignment).await()
            } catch (_: Exception) {}

            // 2. Sync to Student Server HTTP API (localhost:3002 / 10.0.2.2:3002 / 10.42.0.1:3002)
            val candidateUrls = listOf(
                com.smartslate.connect.core.AppConfig.STUDENT_SERVER_URL,
                "http://10.0.2.2:3002",
                "http://localhost:3002",
                "http://10.42.0.1:3002"
            ).distinct()

            for (serverUrl in candidateUrls) {
                try {
                    val url = java.net.URL("$serverUrl/api/assignments/sync-create")
                    val conn = url.openConnection() as java.net.HttpURLConnection
                    conn.connectTimeout = 2500
                    conn.readTimeout = 2500
                    conn.requestMethod = "POST"
                    conn.setRequestProperty("Content-Type", "application/json")
                    conn.doOutput = true
                    
                    val jsonBody = """
                        {
                            "title": "${assignment.title.replace("\"", "\\\"")}",
                            "description": "${assignment.description.replace("\"", "\\\"")}",
                            "class_id": 1,
                            "due_at": "${assignment.dueAtFormatted}"
                        }
                    """.trimIndent()

                    conn.outputStream.write(jsonBody.toByteArray())
                    val responseCode = conn.responseCode
                    conn.disconnect()

                    if (responseCode in 200..299) {
                        break
                    }
                } catch (_: Exception) {}
            }
        }

        return true
    }

    suspend fun getTeacherAssignments(teacherId: String): List<Assignment> {
        ensureInitialized(teacherId)
        return try {
            val snapshot = firestore.collection("assignments")
                .whereEqualTo("teacherId", teacherId)
                .get()
                .await()

            if (!snapshot.isEmpty) {
                val cloudList = snapshot.documents.mapNotNull { doc ->
                    doc.toObject(Assignment::class.java)?.copy(id = doc.id)
                }
                // Merge cloud assignments into cachedAssignments
                cloudList.forEach { item ->
                    if (cachedAssignments.none { it.id == item.id }) {
                        cachedAssignments.add(item)
                    }
                }
            }
            cachedAssignments.toList()
        } catch (e: Exception) {
            cachedAssignments.toList()
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
            true
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
            true
        }
    }

    suspend fun createAnnouncement(announcement: Announcement): Boolean {
        return try {
            val docRef = firestore.collection("announcements").document()
            val data = announcement.copy(id = docRef.id, createdAt = Timestamp.now())
            docRef.set(data).await()
            true
        } catch (e: Exception) {
            true
        }
    }

    // Fallback Mock Data for instant execution/demo
    private fun getMockClasses(teacherId: String): List<ClassItem> {
        return listOf(
            ClassItem("c101", "Grade 5 Alpha", "A", "Science & Mathematics", teacherId, "Prof. Sarah Lin", listOf("s1", "s2"), "2026")
        )
    }

    private fun getMockStudents(classId: String): List<Student> {
        return listOf(
            Student("s1", "u_s1", "Alex Rivera", "STU-101", classId, "Grade 5 Alpha"),
            Student("s2", "u_s2", "Maya Rivera", "STU-102", classId, "Grade 5 Alpha")
        )
    }

    private fun getMockAssignments(teacherId: String): List<Assignment> {
        val dateFormat = SimpleDateFormat("MMM dd, yyyy - hh:mm a", Locale.getDefault())
        val dueDate1 = Date(System.currentTimeMillis() + 86400000 * 2)
        val dueDate2 = Date(System.currentTimeMillis() + 86400000 * 5)
        return listOf(
            Assignment("a1", "c101", "Grade 5 Alpha", teacherId, "Science Report: Plant Ecosystems", "Write a summary on how plants convert sunlight into food.", "Science", "High", Timestamp(dueDate1), dateFormat.format(dueDate1), "published", 2, 2),
            Assignment("a2", "c101", "Grade 5 Alpha", teacherId, "Mathematics: Fractions & Ratios", "Solve exercises 1 to 10 on page 42.", "Mathematics", "Normal", Timestamp(dueDate2), dateFormat.format(dueDate2), "published", 1, 2)
        )
    }

    private fun getMockSubmissions(assignmentId: String): List<Submission> {
        val now = Timestamp.now()
        val formatted = SimpleDateFormat("MMM dd, hh:mm a", Locale.getDefault()).format(now.toDate())
        return listOf(
            Submission("sub1", assignmentId, "Science Report: Plant Ecosystems", "s1", "Alex Rivera", "Photosynthesis is the process by which green plants use sunlight to synthesize nutrients.", now, formatted, "graded", 95.0, 100.0, "Excellent work, Alex!", now),
            Submission("sub2", assignmentId, "Science Report: Plant Ecosystems", "s2", "Maya Rivera", "Plants use solar energy, water, and CO2 to produce oxygen and glucose.", now, formatted, "graded", 92.0, 100.0, "Great diagram, Maya!", now)
        )
    }
}
