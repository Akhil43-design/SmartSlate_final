package com.smartslate.connect.ui.teacher

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Class
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.smartslate.connect.data.model.ClassItem
import com.smartslate.connect.ui.theme.*

@Composable
fun TeacherClassesScreen(
    classes: List<ClassItem>,
    onClassClick: (ClassItem) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SlateBackground)
            .padding(16.dp)
    ) {
        Text("Your Assigned Classes", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = SlateNavy)
        Text("Manage classroom rosters, assignments, and attendance", fontSize = 12.sp, color = SlateGray)
        Spacer(modifier = Modifier.height(16.dp))

        if (classes.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("No classes assigned.", color = SlateGray)
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(classes) { classItem ->
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = SurfaceLightCard),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onClassClick(classItem) }
                    ) {
                        Row(
                            modifier = Modifier
                                .padding(18.dp)
                                .fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(14.dp)
                            ) {
                                Surface(
                                    shape = CircleShape,
                                    color = PrimaryIndigo.copy(alpha = 0.12f),
                                    modifier = Modifier.size(46.dp)
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Icon(Icons.Default.Class, contentDescription = null, tint = PrimaryIndigo)
                                    }
                                }
                                Column {
                                    Text(classItem.name, fontSize = 17.sp, fontWeight = FontWeight.Bold, color = SlateNavy)
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text("Subject: ${classItem.subject} • Year ${classItem.academicYear}", fontSize = 13.sp, color = SlateGray)
                                }
                            }
                            Icon(Icons.Default.ChevronRight, contentDescription = "Open", tint = SlateGray)
                        }
                    }
                }
            }
        }
    }
}
