package com.smartslate.connect.ui.parent

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.smartslate.connect.data.model.Student
import com.smartslate.connect.ui.components.StatCard
import com.smartslate.connect.ui.components.StatusChip
import com.smartslate.connect.ui.theme.*

@Composable
fun ParentHomeScreen(
    parentName: String,
    state: ParentUiState,
    onChildSelect: (Student) -> Unit,
    onNavigateToAttendance: () -> Unit,
    onNavigateToAssignments: () -> Unit,
    onNavigateToProgress: () -> Unit,
    onNavigateToAnnouncements: () -> Unit
) {
    val child = state.selectedChild
    val prog = state.progress

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SlateBackground)
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        // Welcome Banner
        Text("Parent Portal", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = AccentTealDark)
        Text("Welcome, $parentName", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = SlateNavy)
        Spacer(modifier = Modifier.height(14.dp))

        // Child Switcher Row
        if (state.children.size > 1) {
            Text("Selected Child:", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = SlateNavy)
            Spacer(modifier = Modifier.height(6.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                state.children.forEach { s ->
                    val isSelected = s.id == child?.id
                    FilterChip(
                        selected = isSelected,
                        onClick = { onChildSelect(s) },
                        label = { Text(s.name) },
                        leadingIcon = { Icon(Icons.Default.Person, contentDescription = null, modifier = Modifier.size(16.dp)) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = PrimaryIndigo,
                            selectedLabelColor = Color.White,
                            selectedLeadingIconColor = Color.White
                        )
                    )
                }
            }
            Spacer(modifier = Modifier.height(14.dp))
        }

        // Active Child Hero Card
        if (child != null) {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = SlateNavy),
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .padding(20.dp)
                        .fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Surface(
                            shape = CircleShape,
                            color = AccentTeal.copy(alpha = 0.2f)
                        ) {
                            Text(
                                text = child.className,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = AccentTeal,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 3.dp)
                            )
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(child.name, fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        Spacer(modifier = Modifier.height(2.dp))
                        Text("Student ID: ${child.studentCode}", fontSize = 12.sp, color = Color.White.copy(alpha = 0.7f))
                    }
                    Surface(
                        shape = CircleShape,
                        color = PrimaryIndigo,
                        modifier = Modifier.size(54.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(Icons.Default.Face, contentDescription = null, tint = Color.White, modifier = Modifier.size(32.dp))
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))
        Text("Academic Highlights", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = SlateNavy)
        Spacer(modifier = Modifier.height(10.dp))

        // Stat Grid
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            StatCard(
                title = "Attendance Rate",
                value = "${prog?.attendancePercentage ?: 92.5}%",
                subtitle = "Present in 37/40 classes",
                icon = Icons.Default.HowToReg,
                accentColor = SuccessGreen,
                modifier = Modifier
                    .weight(1f)
                    .clickable { onNavigateToAttendance() }
            )
            StatCard(
                title = "Overall Grade",
                value = "${prog?.averagePercentage ?: 92.8}%",
                subtitle = "Grade Point Average: A",
                icon = Icons.Default.Stars,
                accentColor = PrimaryIndigo,
                modifier = Modifier
                    .weight(1f)
                    .clickable { onNavigateToProgress() }
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            StatCard(
                title = "Homework Done",
                value = "${prog?.completedAssignments ?: 11} / ${prog?.totalAssignments ?: 12}",
                subtitle = "95% Submission Rate",
                icon = Icons.Default.AssignmentCheck,
                accentColor = AccentTealDark,
                modifier = Modifier
                    .weight(1f)
                    .clickable { onNavigateToAssignments() }
            )
            StatCard(
                title = "School Notices",
                value = "${state.announcements.size}",
                subtitle = "Latest announcements",
                icon = Icons.Default.Campaign,
                accentColor = WarmAmber,
                modifier = Modifier
                    .weight(1f)
                    .clickable { onNavigateToAnnouncements() }
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Recent Announcements Preview
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Teacher Notices", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = SlateNavy)
            TextButton(onClick = onNavigateToAnnouncements) {
                Text("View All", color = PrimaryIndigo, fontWeight = FontWeight.Bold)
            }
        }

        Spacer(modifier = Modifier.height(6.dp))

        state.announcements.take(2).forEach { anc ->
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceLightCard),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp)
                    .clickable { onNavigateToAnnouncements() }
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(anc.title, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = SlateNavy)
                        StatusChip(status = anc.priority)
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(anc.message, fontSize = 13.sp, color = SlateGray, maxLines = 2)
                }
            }
        }
    }
}
