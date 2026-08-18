package com.smartslate.connect.ui.teacher

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.HowToReg
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.smartslate.connect.data.model.ClassItem
import com.smartslate.connect.data.model.Student
import com.smartslate.connect.ui.theme.*
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TeacherAttendanceScreen(
    classes: List<ClassItem>,
    students: List<Student>,
    teacherId: String,
    onSaveAttendance: (classId: String, className: String, teacherId: String, date: String, attendanceMap: Map<String, String>, onComplete: (Boolean) -> Unit) -> Unit,
    onBack: () -> Unit
) {
    var selectedClass by remember { mutableStateOf(classes.firstOrNull()) }
    var expandedClassMenu by remember { mutableStateOf(false) }
    val currentDate = remember { SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date()) }
    var dateString by remember { mutableStateOf(currentDate) }

    // Map studentId -> status ("present", "absent", "late", "excused")
    val attendanceState = remember { mutableStateMapOf<String, String>() }

    LaunchedEffect(students) {
        students.forEach { s ->
            if (!attendanceState.containsKey(s.id)) {
                attendanceState[s.id] = "present"
            }
        }
    }

    var isSaving by remember { mutableStateOf(false) }
    var showSuccessBanner by remember { mutableStateOf(false) }

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
            Text("Mark Attendance", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = SlateNavy)
        }

        Spacer(modifier = Modifier.height(14.dp))

        Card(
            shape = RoundedCornerShape(18.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceLightCard),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    // Class Dropdown
                    ExposedDropdownMenuBox(
                        expanded = expandedClassMenu,
                        onExpandedChange = { expandedClassMenu = !expandedClassMenu },
                        modifier = Modifier.weight(1f)
                    ) {
                        OutlinedTextField(
                            value = selectedClass?.name ?: "Select Class",
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Class") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedClassMenu) },
                            modifier = Modifier.menuAnchor(),
                            shape = RoundedCornerShape(10.dp)
                        )
                        ExposedDropdownMenu(
                            expanded = expandedClassMenu,
                            onDismissRequest = { expandedClassMenu = false }
                        ) {
                            classes.forEach { classItem ->
                                DropdownMenuItem(
                                    text = { Text(classItem.name) },
                                    onClick = {
                                        selectedClass = classItem
                                        expandedClassMenu = false
                                    }
                                )
                            }
                        }
                    }

                    // Date Input
                    OutlinedTextField(
                        value = dateString,
                        onValueChange = { dateString = it },
                        label = { Text("Date") },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        if (showSuccessBanner) {
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = SuccessGreen.copy(alpha = 0.15f),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp)
            ) {
                Text(
                    text = "✅ Attendance successfully recorded for $dateString!",
                    color = SuccessGreen,
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                    modifier = Modifier.padding(12.dp)
                )
            }
        }

        Text("Student Roster", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = SlateNavy)
        Spacer(modifier = Modifier.height(10.dp))

        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(students) { student ->
                val currentStatus = attendanceState[student.id] ?: "present"
                Card(
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceLightCard),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
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
                                    Icon(Icons.Default.Person, contentDescription = null, tint = PrimaryIndigo)
                                }
                            }
                            Text(student.name, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = SlateNavy)
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            val options = listOf("present" to "Present", "absent" to "Absent", "late" to "Late", "excused" to "Excused")
                            options.forEach { (code, label) ->
                                val isSelected = currentStatus == code
                                FilterChip(
                                    selected = isSelected,
                                    onClick = { attendanceState[student.id] = code },
                                    label = { Text(label, fontSize = 11.sp, fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal) },
                                    colors = FilterChipDefaults.filterChipColors(
                                        selectedContainerColor = when (code) {
                                            "present" -> SuccessGreen
                                            "absent" -> ErrorRed
                                            "late" -> WarmAmber
                                            else -> AccentTeal
                                        },
                                        selectedLabelColor = Color.White
                                    ),
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        Button(
            onClick = {
                if (selectedClass == null) return@Button
                isSaving = true
                showSuccessBanner = false
                onSaveAttendance(
                    selectedClass!!.id,
                    selectedClass!!.name,
                    teacherId,
                    dateString,
                    attendanceState
                ) { success ->
                    isSaving = false
                    if (success) showSuccessBanner = true
                }
            },
            enabled = !isSaving && selectedClass != null,
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo),
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp)
        ) {
            if (isSaving) {
                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(22.dp))
            } else {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.HowToReg, contentDescription = null, tint = Color.White)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Save Attendance Matrix", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
                }
            }
        }
    }
}
