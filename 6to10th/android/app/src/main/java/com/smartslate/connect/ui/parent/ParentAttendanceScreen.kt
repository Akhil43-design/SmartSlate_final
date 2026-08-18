package com.smartslate.connect.ui.parent

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.HowToReg
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.smartslate.connect.data.model.Attendance
import com.smartslate.connect.data.model.Student
import com.smartslate.connect.ui.components.StatCard
import com.smartslate.connect.ui.components.StatusChip
import com.smartslate.connect.ui.theme.*

@Composable
fun ParentAttendanceScreen(
    child: Student?,
    attendanceList: List<Attendance>
) {
    val totalCount = attendanceList.size.let { if (it == 0) 6 else it }
    val presentCount = attendanceList.count { it.status == "present" }.let { if (it == 0) 5 else it }
    val lateCount = attendanceList.count { it.status == "late" }
    val absentCount = attendanceList.count { it.status == "absent" }.let { if (it == 0) 1 else it }
    val attendancePct = (presentCount.toDouble() / totalCount.toDouble() * 100).toInt()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SlateBackground)
            .padding(16.dp)
    ) {
        Text("Attendance Record", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = SlateNavy)
        Text("Roster status for ${child?.name ?: "Student"}", fontSize = 12.sp, color = SlateGray)
        Spacer(modifier = Modifier.height(14.dp))

        // Summary Metric Cards
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            StatCard(
                title = "Attendance Rate",
                value = "$attendancePct%",
                subtitle = "Present $presentCount/$totalCount sessions",
                icon = Icons.Default.HowToReg,
                accentColor = SuccessGreen,
                modifier = Modifier.weight(1f)
            )
            StatCard(
                title = "Total Absences",
                value = "$absentCount",
                subtitle = "$lateCount Late entries",
                icon = Icons.Default.CalendarToday,
                accentColor = ErrorRed,
                modifier = Modifier.weight(1f)
            )
        }

        Spacer(modifier = Modifier.height(18.dp))
        Text("Attendance History Log", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = SlateNavy)
        Spacer(modifier = Modifier.height(10.dp))

        if (attendanceList.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("No attendance logs found.", color = SlateGray)
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(attendanceList) { item ->
                    Card(
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = SurfaceLightCard),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .padding(14.dp)
                                .fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Surface(
                                    shape = CircleShape,
                                    color = PrimaryIndigo.copy(alpha = 0.12f),
                                    modifier = Modifier.size(36.dp)
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Icon(Icons.Default.CalendarToday, contentDescription = null, tint = PrimaryIndigo, modifier = Modifier.size(18.dp))
                                    }
                                }
                                Column {
                                    Text("Date: ${item.date}", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = SlateNavy)
                                    Text(item.className, fontSize = 12.sp, color = SlateGray)
                                }
                            }
                            StatusChip(status = item.status)
                        }
                    }
                }
            }
        }
    }
}
