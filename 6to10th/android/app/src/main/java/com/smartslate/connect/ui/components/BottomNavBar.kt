package com.smartslate.connect.ui.components

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.smartslate.connect.data.model.UserRole
import com.smartslate.connect.ui.theme.AccentTeal
import com.smartslate.connect.ui.theme.SlateNavy

sealed class NavItem(val route: String, val title: String, val icon: ImageVector) {
    // Teacher items
    object TeacherDashboard : NavItem("teacher_dashboard", "Dashboard", Icons.Default.Dashboard)
    object TeacherClasses : NavItem("teacher_classes", "Classes", Icons.Default.Class)
    object TeacherAssignments : NavItem("teacher_assignments", "Assignments", Icons.Default.Assignment)
    object TeacherStudents : NavItem("teacher_students", "Students", Icons.Default.People)
    object TeacherProfile : NavItem("teacher_profile", "Profile", Icons.Default.Person)

    // Parent items
    object ParentHome : NavItem("parent_home", "Home", Icons.Default.Home)
    object ParentChild : NavItem("parent_child", "Child", Icons.Default.ChildCare)
    object ParentAssignments : NavItem("parent_assignments", "Assignments", Icons.Default.Assignment)
    object ParentProgress : NavItem("parent_progress", "Progress", Icons.Default.TrendingUp)
    object ParentProfile : NavItem("parent_profile", "Profile", Icons.Default.Person)
}

@Composable
fun SmartSlateBottomNavBar(
    role: UserRole,
    currentRoute: String,
    onNavigate: (String) -> Unit
) {
    val items = if (role == UserRole.TEACHER) {
        listOf(
            NavItem.TeacherDashboard,
            NavItem.TeacherClasses,
            NavItem.TeacherAssignments,
            NavItem.TeacherStudents,
            NavItem.TeacherProfile
        )
    } else {
        listOf(
            NavItem.ParentHome,
            NavItem.ParentChild,
            NavItem.ParentAssignments,
            NavItem.ParentProgress,
            NavItem.ParentProfile
        )
    }

    NavigationBar(
        containerColor = SlateNavy,
        tonalElevation = 8.dp
    ) {
        items.forEach { item ->
            val isSelected = currentRoute == item.route
            NavigationBarItem(
                selected = isSelected,
                onClick = { if (!isSelected) onNavigate(item.route) },
                icon = {
                    Icon(
                        imageVector = item.icon,
                        contentDescription = item.title
                    )
                },
                label = { Text(item.title) },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = SlateNavy,
                    selectedTextColor = AccentTeal,
                    indicatorColor = AccentTeal,
                    unselectedIconColor = Color.White.copy(alpha = 0.6f),
                    unselectedTextColor = Color.White.copy(alpha = 0.6f)
                )
            )
        }
    }
}
