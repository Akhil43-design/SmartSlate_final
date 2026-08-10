package com.smartslate.connect.ui.common

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.smartslate.connect.data.model.NotificationItem
import com.smartslate.connect.ui.theme.*

@Composable
fun NotificationScreen(
    notifications: List<NotificationItem>,
    onMarkAsRead: (String) -> Unit,
    onBack: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SlateBackground)
            .padding(16.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = SlateNavy)
            }
            Text("Notifications Feed", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = SlateNavy)
        }

        Spacer(modifier = Modifier.height(16.dp))

        if (notifications.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("No notifications right now.", color = SlateGray)
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(notifications) { item ->
                    Card(
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (item.read) SurfaceLightCard.copy(alpha = 0.8f) else SurfaceLightCard
                        ),
                        elevation = CardDefaults.cardElevation(defaultElevation = if (item.read) 1.dp else 3.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { if (!item.read) onMarkAsRead(item.id) }
                    ) {
                        Row(
                            modifier = Modifier
                                .padding(16.dp)
                                .fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Surface(
                                shape = CircleShape,
                                color = if (item.read) SlateLight else PrimaryIndigo.copy(alpha = 0.15f),
                                modifier = Modifier.size(40.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        Icons.Default.Notifications,
                                        contentDescription = null,
                                        tint = if (item.read) SlateGray else PrimaryIndigo
                                    )
                                }
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                Text(item.title, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = SlateNavy)
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(item.message, fontSize = 13.sp, color = SlateGray)
                            }
                        }
                    }
                }
            }
        }
    }
}
