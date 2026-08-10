package com.smartslate.connect.ui.parent

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.Comment
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.smartslate.connect.data.model.Student
import com.smartslate.connect.data.model.Submission
import com.smartslate.connect.ui.components.StatusChip
import com.smartslate.connect.ui.theme.*

@Composable
fun ParentAssignmentsScreen(
    child: Student?,
    submissions: List<Submission>
) {
    var selectedFilter by remember { mutableStateOf(0) }
    val filters = listOf("All", "Graded", "Submitted", "Pending")

    val filteredList = when (selectedFilter) {
        1 -> submissions.filter { it.status == "graded" }
        2 -> submissions.filter { it.status == "submitted" }
        3 -> submissions.filter { it.status == "pending" }
        else -> submissions
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SlateBackground)
            .padding(16.dp)
    ) {
        Text("Child Assignments & Grades", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = SlateNavy)
        Text("Homework submissions for ${child?.name ?: "Student"}", fontSize = 12.sp, color = SlateGray)
        Spacer(modifier = Modifier.height(14.dp))

        // Filter Bar
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            filters.forEachIndexed { idx, label ->
                val isSelected = selectedFilter == idx
                FilterChip(
                    selected = isSelected,
                    onClick = { selectedFilter = idx },
                    label = { Text(label, fontSize = 12.sp) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = PrimaryIndigo,
                        selectedLabelColor = Color.White
                    ),
                    modifier = Modifier.weight(1f)
                )
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        if (filteredList.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("No assignment submissions found.", color = SlateGray)
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(filteredList) { sub ->
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = SurfaceLightCard),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                        modifier = Modifier.fillMaxWidth()
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
                                        modifier = Modifier.size(38.dp)
                                    ) {
                                        Box(contentAlignment = Alignment.Center) {
                                            Icon(Icons.Default.Assignment, contentDescription = null, tint = PrimaryIndigo)
                                        }
                                    }
                                    Text(sub.assignmentTitle, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = SlateNavy)
                                }
                                StatusChip(status = sub.status)
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("Submitted: ${sub.submittedAtFormatted}", fontSize = 12.sp, color = SlateGray)

                                if (sub.grade != null) {
                                    Surface(
                                        shape = RoundedCornerShape(8.dp),
                                        color = SuccessGreen.copy(alpha = 0.15f)
                                    ) {
                                        Text(
                                            text = "${sub.grade} / ${sub.maxGrade} (${(sub.grade / sub.maxGrade * 100).toInt()}%)",
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = SuccessGreen,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                        )
                                    }
                                }
                            }

                            if (sub.feedback.isNotBlank()) {
                                Spacer(modifier = Modifier.height(10.dp))
                                Surface(
                                    shape = RoundedCornerShape(10.dp),
                                    color = PrimaryIndigo.copy(alpha = 0.08f),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        modifier = Modifier.padding(10.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(Icons.Default.Comment, contentDescription = null, tint = PrimaryIndigo, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text(
                                            text = "Teacher Feedback: \"${sub.feedback}\"",
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Medium,
                                            color = SlateNavy
                                        )
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
