package com.smartslate.connect.ui.parent

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.smartslate.connect.data.model.Announcement
import com.smartslate.connect.ui.components.StatusChip
import com.smartslate.connect.ui.theme.*

@Composable
fun ParentAnnouncementsScreen(
    announcements: List<Announcement>
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SlateBackground)
            .padding(16.dp)
    ) {
        Text("School & Teacher Notices", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = SlateNavy)
        Text("Official announcements published by classroom teachers", fontSize = 12.sp, color = SlateGray)
        Spacer(modifier = Modifier.height(16.dp))

        if (announcements.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("No announcements at this time.", color = SlateGray)
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(announcements) { anc ->
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = SurfaceLightCard),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(18.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    Surface(
                                        shape = CircleShape,
                                        color = WarmAmber.copy(alpha = 0.15f),
                                        modifier = Modifier.size(40.dp)
                                    ) {
                                        Box(contentAlignment = Alignment.Center) {
                                            Icon(Icons.Default.Campaign, contentDescription = null, tint = WarmAmber)
                                        }
                                    }
                                    Column {
                                        Text(anc.title, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = SlateNavy)
                                        Text("By ${anc.teacherName} • ${anc.className}", fontSize = 12.sp, color = SlateGray)
                                    }
                                }
                                StatusChip(status = anc.priority)
                            }

                            Spacer(modifier = Modifier.height(12.dp))
                            Text(anc.message, fontSize = 14.sp, color = SlateDark, lineHeight = 20.sp)
                            Spacer(modifier = Modifier.height(12.dp))
                            HorizontalDivider(color = BorderColorLight)
                            Spacer(modifier = Modifier.height(8.dp))

                            Text(
                                text = "Posted: ${anc.createdAtFormatted.ifBlank { "Aug 10, 2026" }}",
                                fontSize = 11.sp,
                                color = SlateGray
                            )
                        }
                    }
                }
            }
        }
    }
}
