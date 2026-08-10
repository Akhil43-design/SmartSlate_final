package com.smartslate.connect.data.repository

import com.google.firebase.Timestamp
import com.google.firebase.firestore.FirebaseFirestore
import com.smartslate.connect.data.model.NotificationItem
import kotlinx.coroutines.tasks.await

class NotificationRepository(
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance()
) {
    suspend fun getUserNotifications(userId: String): List<NotificationItem> {
        return try {
            val snapshot = firestore.collection("notifications")
                .whereEqualTo("userId", userId)
                .get()
                .await()

            if (!snapshot.isEmpty) {
                snapshot.documents.mapNotNull { doc ->
                    doc.toObject(NotificationItem::class.java)?.copy(id = doc.id)
                }
            } else {
                getMockNotifications(userId)
            }
        } catch (e: Exception) {
            getMockNotifications(userId)
        }
    }

    suspend fun markAsRead(notificationId: String): Boolean {
        return try {
            firestore.collection("notifications").document(notificationId).update("read", true).await()
            true
        } catch (e: Exception) {
            false
        }
    }

    private fun getMockNotifications(userId: String): List<NotificationItem> {
        return listOf(
            NotificationItem("n1", userId, "New Assignment Posted", "Prof. Sharma posted 'Quadratic Equations Problem Set' due Aug 12.", "assignment", false, Timestamp.now()),
            NotificationItem("n2", userId, "Submission Graded", "Aarav's Math Problem Set has been graded: 95/100.", "grade", false, Timestamp.now()),
            NotificationItem("n3", userId, "Attendance Alert", "Aarav was marked Present for Class 10-A today.", "attendance", true, Timestamp.now())
        )
    }
}
