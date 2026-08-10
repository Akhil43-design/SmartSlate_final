package com.smartslate.connect.ui.common

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartslate.connect.data.model.NotificationItem
import com.smartslate.connect.data.repository.NotificationRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class NotificationViewModel(
    private val repository: NotificationRepository = NotificationRepository()
) : ViewModel() {

    private val _notifications = MutableStateFlow<List<NotificationItem>>(emptyList())
    val notifications: StateFlow<List<NotificationItem>> = _notifications.asStateFlow()

    fun loadNotifications(userId: String) {
        viewModelScope.launch {
            val list = repository.getUserNotifications(userId)
            _notifications.value = list
        }
    }

    fun markAsRead(id: String) {
        viewModelScope.launch {
            repository.markAsRead(id)
            _notifications.value = _notifications.value.map {
                if (it.id == id) it.copy(read = true) else it
            }
        }
    }
}
