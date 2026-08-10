package com.smartslate.connect.ui.teacher

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.EditNote
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.smartslate.connect.data.model.Assignment
import com.smartslate.connect.data.model.Submission
import com.smartslate.connect.ui.components.StatusChip
import com.smartslate.connect.ui.theme.*

@Composable
fun TeacherSubmissionsScreen(
    assignment: Assignment,
    submissions: List<Submission>,
    onGradeSubmission: (submissionId: String, grade: Double, feedback: String, onComplete: (Boolean) -> Unit) -> Unit,
    onBack: () -> Unit
) {
    var selectedSubmissionForGrading by remember { mutableStateOf<Submission?>(null) }

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
            Text("Submissions & Grading", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = SlateNavy)
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Assignment Header Summary
        Card(
            shape = RoundedCornerShape(18.dp),
            colors = CardDefaults.cardColors(containerColor = SlateNavy),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Text(assignment.title, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
                Spacer(modifier = Modifier.height(4.dp))
                Text("Class: ${assignment.className} • Subject: ${assignment.subject}", fontSize = 13.sp, color = AccentTeal)
                Spacer(modifier = Modifier.height(6.dp))
                Text("Due: ${assignment.dueAtFormatted}", fontSize = 12.sp, color = Color.White.copy(alpha = 0.8f))
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
        Text("Student Submissions", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = SlateNavy)
        Spacer(modifier = Modifier.height(10.dp))

        if (submissions.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("No submissions received yet.", color = SlateGray)
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(submissions) { sub ->
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
                                        modifier = Modifier.size(40.dp)
                                    ) {
                                        Box(contentAlignment = Alignment.Center) {
                                            Icon(Icons.Default.Person, contentDescription = null, tint = PrimaryIndigo)
                                        }
                                    }
                                    Column {
                                        Text(sub.studentName, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = SlateNavy)
                                        Text("Submitted: ${sub.submittedAtFormatted}", fontSize = 12.sp, color = SlateGray)
                                    }
                                }
                                StatusChip(status = sub.status)
                            }

                            if (sub.content.isNotBlank()) {
                                Spacer(modifier = Modifier.height(10.dp))
                                Surface(
                                    shape = RoundedCornerShape(10.dp),
                                    color = SlateLight,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text(
                                        text = "\"${sub.content}\"",
                                        fontSize = 13.sp,
                                        color = SlateDark,
                                        modifier = Modifier.padding(10.dp)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(12.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                if (sub.grade != null) {
                                    Text(
                                        text = "Grade: ${sub.grade} / ${sub.maxGrade} (${(sub.grade / sub.maxGrade * 100).toInt()}%)",
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = SuccessGreen
                                    )
                                } else {
                                    Text("Not Graded Yet", fontSize = 13.sp, color = WarmAmber, fontWeight = FontWeight.SemiBold)
                                }

                                Button(
                                    onClick = { selectedSubmissionForGrading = sub },
                                    shape = RoundedCornerShape(10.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo),
                                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                                ) {
                                    Icon(Icons.Default.EditNote, contentDescription = null, modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(if (sub.grade != null) "Edit Grade" else "Grade Now", fontSize = 13.sp)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Grading Dialog Modal
    selectedSubmissionForGrading?.let { sub ->
        GradingDialog(
            submission = sub,
            onDismiss = { selectedSubmissionForGrading = null },
            onSave = { grade, feedback ->
                onGradeSubmission(sub.id, grade, feedback) { success ->
                    if (success) selectedSubmissionForGrading = null
                }
            }
        )
    }
}

@Composable
fun GradingDialog(
    submission: Submission,
    onDismiss: () -> Unit,
    onSave: (Double, String) -> Unit
) {
    var gradeText by remember { mutableStateOf(submission.grade?.toString() ?: "") }
    var feedback by remember { mutableStateOf(submission.feedback) }
    var isSaving by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Grade Submission for ${submission.studentName}", fontSize = 16.sp, fontWeight = FontWeight.Bold) },
        text = {
            Column {
                OutlinedTextField(
                    value = gradeText,
                    onValueChange = { gradeText = it },
                    label = { Text("Marks (Out of 100)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )
                Spacer(modifier = Modifier.height(10.dp))
                OutlinedTextField(
                    value = feedback,
                    onValueChange = { feedback = it },
                    label = { Text("Teacher Feedback") },
                    minLines = 3,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val gradeVal = gradeText.toDoubleOrNull() ?: 0.0
                    isSaving = true
                    onSave(gradeVal, feedback)
                },
                enabled = !isSaving,
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo)
            ) {
                if (isSaving) CircularProgressIndicator(color = Color.White, modifier = Modifier.size(18.dp))
                else Text("Save Grade")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}
