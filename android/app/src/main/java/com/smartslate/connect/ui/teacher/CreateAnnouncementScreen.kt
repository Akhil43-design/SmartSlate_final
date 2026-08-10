package com.smartslate.connect.ui.teacher

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.smartslate.connect.data.model.ClassItem
import com.smartslate.connect.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateAnnouncementScreen(
    classes: List<ClassItem>,
    teacherId: String,
    teacherName: String,
    onCreateAnnouncement: (teacherId: String, teacherName: String, classId: String, className: String, title: String, message: String, priority: String, onComplete: (Boolean) -> Unit) -> Unit,
    onBack: () -> Unit
) {
    var title by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }
    var selectedClass by remember { mutableStateOf(classes.firstOrNull()) }
    var priority by remember { mutableStateOf("normal") }
    var expandedClassMenu by remember { mutableStateOf(false) }
    var isPosting by remember { mutableStateOf(false) }
    var successMsg by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SlateBackground)
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = SlateNavy)
            }
            Text("Broadcast Announcement", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = SlateNavy)
        }

        Spacer(modifier = Modifier.height(16.dp))

        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceLightCard),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                if (successMsg) {
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = SuccessGreen.copy(alpha = 0.15f),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 14.dp)
                    ) {
                        Text("📢 Announcement posted successfully!", color = SuccessGreen, fontWeight = FontWeight.Bold, modifier = Modifier.padding(12.dp))
                    }
                }

                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Announcement Title") },
                    placeholder = { Text("e.g. Mid-Term Examination Schedule") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(modifier = Modifier.height(12.dp))

                ExposedDropdownMenuBox(
                    expanded = expandedClassMenu,
                    onExpandedChange = { expandedClassMenu = !expandedClassMenu }
                ) {
                    OutlinedTextField(
                        value = selectedClass?.name ?: "Select Target Class",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Target Classroom") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedClassMenu) },
                        modifier = Modifier
                            .menuAnchor()
                            .fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )
                    ExposedDropdownMenu(
                        expanded = expandedClassMenu,
                        onDismissRequest = { expandedClassMenu = false }
                    ) {
                        classes.forEach { c ->
                            DropdownMenuItem(
                                text = { Text(c.name) },
                                onClick = {
                                    selectedClass = c
                                    expandedClassMenu = false
                                }
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                Text("Priority Level:", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = SlateNavy)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(
                        selected = priority == "normal",
                        onClick = { priority = "normal" },
                        label = { Text("Normal Priority") }
                    )
                    FilterChip(
                        selected = priority == "high",
                        onClick = { priority = "high" },
                        label = { Text("High Priority") }
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = message,
                    onValueChange = { message = it },
                    label = { Text("Announcement Message") },
                    minLines = 4,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(modifier = Modifier.height(20.dp))

                Button(
                    onClick = {
                        if (title.isBlank() || message.isBlank() || selectedClass == null) return@Button
                        isPosting = true
                        onCreateAnnouncement(
                            teacherId,
                            teacherName,
                            selectedClass!!.id,
                            selectedClass!!.name,
                            title,
                            message,
                            priority
                        ) { success ->
                            isPosting = false
                            if (success) {
                                successMsg = true
                                title = ""
                                message = ""
                            }
                        }
                    },
                    enabled = !isPosting && selectedClass != null,
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp)
                ) {
                    if (isPosting) CircularProgressIndicator(color = Color.White, modifier = Modifier.size(22.dp))
                    else {
                        Icon(Icons.Default.Campaign, contentDescription = null, tint = Color.White)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Publish Announcement", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    }
                }
            }
        }
    }
}
