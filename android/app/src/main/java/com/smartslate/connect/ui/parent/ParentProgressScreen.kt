package com.smartslate.connect.ui.parent

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Assessment
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.smartslate.connect.data.model.Student
import com.smartslate.connect.data.model.StudentProgress
import com.smartslate.connect.ui.components.StatCard
import com.smartslate.connect.ui.theme.*

@Composable
fun ParentProgressScreen(
    child: Student?,
    progress: StudentProgress?
) {
    val attPct = progress?.attendancePercentage ?: 92.5
    val subPct = progress?.assignmentCompletionPercentage ?: 95.0
    val avgPct = progress?.averagePercentage ?: 92.8

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SlateBackground)
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        Text("Academic Progress & Analytics", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = SlateNavy)
        Text("Performance metrics for ${child?.name ?: "Student"}", fontSize = 12.sp, color = SlateGray)
        Spacer(modifier = Modifier.height(16.dp))

        // Hero Metric
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = SlateNavy),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Overall Performance Grade", fontSize = 12.sp, color = AccentTeal)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("$avgPct%", fontSize = 32.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    }
                    Surface(
                        shape = RoundedCornerShape(14.dp),
                        color = SuccessGreen.copy(alpha = 0.2f)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.TrendingUp, contentDescription = null, tint = SuccessGreen, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Top 10%", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = SuccessGreen)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))
                LinearProgressIndicator(
                    progress = (avgPct / 100).toFloat(),
                    color = AccentTeal,
                    trackColor = SlateMedium,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(8.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(20.dp))
        Text("Detailed Metrics", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = SlateNavy)
        Spacer(modifier = Modifier.height(10.dp))

        ProgressBarCard(title = "Class Attendance Rate", value = "$attPct%", fraction = (attPct / 100).toFloat(), color = SuccessGreen)
        Spacer(modifier = Modifier.height(10.dp))
        ProgressBarCard(title = "Assignment Completion Rate", value = "$subPct%", fraction = (subPct / 100).toFloat(), color = PrimaryIndigo)
        Spacer(modifier = Modifier.height(10.dp))
        ProgressBarCard(title = "Exam & Quiz Average", value = "90.0%", fraction = 0.90f, color = WarmAmber)

        Spacer(modifier = Modifier.height(20.dp))
        Text("Subject Breakdown", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = SlateNavy)
        Spacer(modifier = Modifier.height(10.dp))

        SubjectGradeRow(subject = "Mathematics", grade = "95 / 100", letter = "A+")
        Spacer(modifier = Modifier.height(8.dp))
        SubjectGradeRow(subject = "Physics & Science", grade = "90 / 100", letter = "A")
        Spacer(modifier = Modifier.height(8.dp))
        SubjectGradeRow(subject = "English Literature", grade = "88 / 100", letter = "B+")
    }
}

@Composable
fun ProgressBarCard(title: String, value: String, fraction: Float, color: Color) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceLightCard),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(title, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = SlateNavy)
                Text(value, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = color)
            }
            Spacer(modifier = Modifier.height(10.dp))
            LinearProgressIndicator(
                progress = fraction,
                color = color,
                trackColor = SlateLight,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(6.dp)
            )
        }
    }
}

@Composable
fun SubjectGradeRow(subject: String, grade: String, letter: String) {
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
            Text(subject, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = SlateNavy)
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(grade, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = SlateGray)
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = PrimaryIndigo.copy(alpha = 0.12f)
                ) {
                    Text(letter, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = PrimaryIndigo, modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp))
                }
            }
        }
    }
}
