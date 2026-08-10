package com.smartslate.connect.ui.parent

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Face
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.smartslate.connect.data.model.Student
import com.smartslate.connect.ui.components.StatusChip
import com.smartslate.connect.ui.theme.*

@Composable
fun ParentChildrenScreen(
    children: List<Student>,
    selectedChild: Student?,
    onSelectChild: (Student) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SlateBackground)
            .padding(16.dp)
    ) {
        Text("My Linked Children", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = SlateNavy)
        Text("Children explicitly registered under your parent account", fontSize = 12.sp, color = SlateGray)
        Spacer(modifier = Modifier.height(16.dp))

        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            items(children) { child ->
                val isSelected = child.id == selectedChild?.id
                Card(
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (isSelected) SurfaceLightCard else SurfaceLightCard.copy(alpha = 0.8f)
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = if (isSelected) 4.dp else 1.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onSelectChild(child) }
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
                                color = if (isSelected) PrimaryIndigo else PrimaryIndigo.copy(alpha = 0.15f),
                                modifier = Modifier.size(48.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        imageVector = Icons.Default.Face,
                                        contentDescription = null,
                                        tint = if (isSelected) Color.White else PrimaryIndigo
                                    )
                                }
                            }
                            Column {
                                Text(child.name, fontSize = 17.sp, fontWeight = FontWeight.Bold, color = SlateNavy)
                                Spacer(modifier = Modifier.height(2.dp))
                                Text("Class: ${child.className} • ID: ${child.studentCode}", fontSize = 13.sp, color = SlateGray)
                            }
                        }

                        if (isSelected) {
                            StatusChip(status = "Active View")
                        } else {
                            Icon(Icons.Default.ChevronRight, contentDescription = null, tint = SlateGray)
                        }
                    }
                }
            }
        }
    }
}
