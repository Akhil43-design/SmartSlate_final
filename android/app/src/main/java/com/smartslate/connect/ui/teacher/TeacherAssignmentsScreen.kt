package com.smartslate.connect.ui.teacher

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.smartslate.connect.data.model.Assignment
import com.smartslate.connect.ui.components.StatusChip
import com.smartslate.connect.ui.theme.*

@Composable
fun TeacherAssignmentsScreen(
    assignments: List<Assignment>,
    onAssignmentClick: (Assignment) -> Unit,
    onCreateAssignmentClick: () -> Unit
) {
    var selectedTab by remember { mutableStateOf(0) }
    val tabs = listOf("Active", "Completed", "All")

    val filteredAssignments = when (selectedTab) {
        0 -> assignments.filter { it.status == "published" }
        1 -> assignments.filter { it.status == "completed" }
        else -> assignments
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(SlateBackground)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("Assignments", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = SlateNavy)
                    Text("Track submissions and enter grades", fontSize = 12.sp, color = SlateGray)
                }
                FloatingActionButton(
                    onClick = onCreateAssignmentClick,
                    containerColor = PrimaryIndigo,
                    contentColor = Color.White,
                    modifier = Modifier.size(44.dp)
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Create Assignment")
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = SurfaceLightCard,
                contentColor = PrimaryIndigo,
                modifier = Modifier.fillMaxWidth()
            ) {
                tabs.forEachIndexed { index, title ->
                    Tab(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        text = { Text(title, fontWeight = if (selectedTab == index) FontWeight.Bold else FontWeight.Normal) }
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            if (filteredAssignments.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("No assignments in this category.", color = SlateGray)
                }
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(filteredAssignments) { item ->
                        Card(
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = SurfaceLightCard),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onAssignmentClick(item) }
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
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
                                            color = PrimaryIndigo.copy(alpha = 0.12f),
                                            modifier = Modifier.size(36.dp)
                                        ) {
                                            Box(contentAlignment = Alignment.Center) {
                                                Icon(Icons.Default.Assignment, contentDescription = null, tint = PrimaryIndigo)
                                            }
                                        }
                                        Column {
                                            Text(item.title, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = SlateNavy)
                                            Text("${item.className} • ${item.subject}", fontSize = 12.sp, color = SlateGray)
                                        }
                                    }
                                    StatusChip(status = item.status)
                                }

                                Spacer(modifier = Modifier.height(12.dp))
                                HorizontalDivider(color = BorderColorLight)
                                Spacer(modifier = Modifier.height(10.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "Submissions: ${item.submissionCount} / ${item.totalStudents}",
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = AccentTealDark
                                    )
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(
                                            text = "Due: ${item.dueAtFormatted}",
                                            fontSize = 12.sp,
                                            color = SlateGray
                                        )
                                        Icon(Icons.Default.ChevronRight, contentDescription = null, tint = SlateGray)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
