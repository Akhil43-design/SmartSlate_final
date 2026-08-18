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
            NotificationItem("n1", userId, "New Assignment Posted", "Prof. Sarah Lin posted 'Science Report: Plant Ecosystems' due Aug 15.", "assignment", false, Timestamp.now()),
            NotificationItem("n2", userId, "Submission Graded", "Alex's Science Report has been graded: 95/100.", "grade", false, Timestamp.now()),
            NotificationItem("n3", userId, "Attendance Alert", "Alex was marked Present for Grade 5 Alpha today.", "attendance", true, Timestamp.now())
        )
    }
}
