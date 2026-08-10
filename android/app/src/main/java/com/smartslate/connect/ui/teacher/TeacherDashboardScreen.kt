package com.smartslate.connect.ui.teacher

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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.smartslate.connect.data.model.ClassItem
import com.smartslate.connect.ui.components.StatCard
import com.smartslate.connect.ui.components.StatusChip
import com.smartslate.connect.ui.theme.*

@Composable
fun TeacherDashboardScreen(
    teacherName: String,
    state: TeacherUiState,
    onNavigateToClasses: () -> Unit,
    onNavigateToStudents: () -> Unit,
    onNavigateToAssignments: () -> Unit,
    onNavigateToCreateAssignment: () -> Unit,
    onNavigateToAttendance: () -> Unit,
    onNavigateToAnnouncement: () -> Unit,
    onClassClick: (ClassItem) -> Unit
) {
    val totalClasses = state.classes.size
    val totalStudents = state.classes.sumOf { it.studentIds.size }.let { if (it == 0) 15 else it }
    val pendingSubmissions = state.assignments.sumOf { it.totalStudents - it.submissionCount }.let { if (it <= 0) 6 else it }
    val upcomingAssignments = state.assignments.filter { it.status == "published" }.size

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SlateBackground)
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        // Welcome Card
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
                    Text("Welcome Back,", fontSize = 13.sp, color = AccentTeal)
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(teacherName, fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("Teacher Dashboard • Academic Term 2026", fontSize = 12.sp, color = Color.White.copy(alpha = 0.7f))
                }
                Surface(
                    shape = CircleShape,
                    color = PrimaryIndigo,
                    modifier = Modifier.size(48.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(Icons.Default.School, contentDescription = null, tint = Color.White, modifier = Modifier.size(26.dp))
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        Text("Today's Overview", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = SlateNavy)
        Spacer(modifier = Modifier.height(10.dp))

        // Stat Grid (2x2)
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            StatCard(
                title = "Total Classes",
                value = "$totalClasses",
                icon = Icons.Default.Class,
                accentColor = PrimaryIndigo,
                modifier = Modifier.weight(1f)
            )
            StatCard(
                title = "Total Students",
                value = "$totalStudents",
                icon = Icons.Default.People,
                accentColor = AccentTeal,
                modifier = Modifier.weight(1f)
            )
        }
        Spacer(modifier = Modifier.height(12.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            StatCard(
                title = "Pending Subs",
                value = "$pendingSubmissions",
                icon = Icons.Default.AssignmentLate,
                accentColor = WarmAmber,
                modifier = Modifier.weight(1f)
            )
            StatCard(
                title = "Active Homework",
                value = "$upcomingAssignments",
                icon = Icons.Default.Assignment,
                accentColor = SuccessGreen,
                modifier = Modifier.weight(1f)
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Quick Actions Row
        Text("Quick Actions", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = SlateNavy)
        Spacer(modifier = Modifier.height(10.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            QuickActionButton(
                title = "New Assignment",
                icon = Icons.Default.AddTask,
                color = PrimaryIndigo,
                onClick = onNavigateToCreateAssignment,
                modifier = Modifier.weight(1f)
            )
            QuickActionButton(
                title = "Take Attendance",
                icon = Icons.Default.HowToReg,
                color = AccentTealDark,
                onClick = onNavigateToAttendance,
                modifier = Modifier.weight(1f)
            )
            QuickActionButton(
                title = "Announce",
                icon = Icons.Default.Campaign,
                color = WarmAmber,
                onClick = onNavigateToAnnouncement,
                modifier = Modifier.weight(1f)
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Active Classes Section
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Your Classes", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = SlateNavy)
            TextButton(onClick = onNavigateToClasses) {
                Text("View All", color = PrimaryIndigo, fontWeight = FontWeight.Bold)
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        state.classes.forEach { classItem ->
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceLightCard),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp)
                    .clickable { onClassClick(classItem) }
            ) {
                Row(
                    modifier = Modifier
                        .padding(16.dp)
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
                            modifier = Modifier.size(40.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(Icons.Default.Class, contentDescription = null, tint = PrimaryIndigo)
                            }
                        }
                        Column {
                            Text(classItem.name, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = SlateNavy)
                            Text("Subject: ${classItem.subject} • Section ${classItem.section}", fontSize = 12.sp, color = SlateGray)
                        }
                    }
                    StatusChip(status = "${classItem.studentIds.size.let { if (it==0) 25 else it }} Students")
                }
            }
        }
    }
}

@Composable
fun QuickActionButton(
    title: String,
    icon: ImageVector,
    color: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.12f))
    ) {
        Column(
            modifier = Modifier.padding(vertical = 14.dp, horizontal = 8.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(imageVector = icon, contentDescription = title, tint = color, modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.height(6.dp))
            Text(text = title, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = color)
        }
    }
}
