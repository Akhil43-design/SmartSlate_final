package com.smartslate.connect

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.smartslate.connect.data.model.UserRole
import com.smartslate.connect.ui.auth.*
import com.smartslate.connect.ui.common.NotificationScreen
import com.smartslate.connect.ui.common.NotificationViewModel
import com.smartslate.connect.ui.common.ProfileScreen
import com.smartslate.connect.ui.components.NavItem
import com.smartslate.connect.ui.components.OfflineBanner
import com.smartslate.connect.ui.components.SmartSlateBottomNavBar
import com.smartslate.connect.ui.components.SmartSlateTopBar
import com.smartslate.connect.ui.parent.*
import com.smartslate.connect.ui.teacher.*
import com.smartslate.connect.ui.theme.SmartSlateTheme

class MainActivity : ComponentActivity() {

    private var isOffline by mutableStateOf(false)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate()
        registerNetworkCallback()

        setContent {
            SmartSlateTheme {
                SmartSlateAppMain(isOffline = isOffline)
            }
        }
    }

    private fun registerNetworkCallback() {
        val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val builder = NetworkRequest.Builder()
        connectivityManager.registerNetworkCallback(
            builder.build(),
            object : ConnectivityManager.NetworkCallback() {
                override fun onAvailable(network: Network) {
                    isOffline = false
                }
                override fun onLost(network: Network) {
                    isOffline = true
                }
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SmartSlateAppMain(
    isOffline: Boolean,
    authViewModel: AuthViewModel = viewModel(),
    teacherViewModel: TeacherViewModel = viewModel(),
    parentViewModel: ParentViewModel = viewModel(),
    notificationViewModel: NotificationViewModel = viewModel()
) {
    val navController = rememberNavController()
    val authState by authViewModel.uiState.collectAsState()
    val teacherState by teacherViewModel.uiState.collectAsState()
    val parentState by parentViewModel.uiState.collectAsState()
    val notifications by notificationViewModel.notifications.collectAsState()

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route ?: ""

    when (val state = authState) {
        is AuthUiState.Splash -> {
            SplashScreen()
        }
        is AuthUiState.LoggedOut, is AuthUiState.Error, AuthUiState.Loading -> {
            val errorMsg = (state as? AuthUiState.Error)?.message
            val isLoading = state is AuthUiState.Loading

            NavHost(navController = navController, startDestination = "login") {
                composable("login") {
                    LoginScreen(
                        onLoginClick = { email, pass -> authViewModel.login(email, pass) },
                        onForgotPasswordClick = { navController.navigate("forgot_password") },
                        isLoading = isLoading,
                        errorMessage = errorMsg
                    )
                }
                composable("forgot_password") {
                    ForgotPasswordScreen(
                        onSendResetClick = { email, callback -> authViewModel.resetPassword(email, callback) },
                        onBackToLogin = { navController.popBackStack() }
                    )
                }
            }
        }
        is AuthUiState.Authenticated -> {
            val user = state.user
            val role = state.role

            LaunchedEffect(user.uid, role) {
                notificationViewModel.loadNotifications(user.uid)
                if (role == UserRole.TEACHER) {
                    teacherViewModel.loadTeacherData(user.uid)
                } else if (role == UserRole.PARENT) {
                    parentViewModel.loadParentData(user.uid)
                }
            }

            val isBottomBarVisible = currentRoute in listOf(
                NavItem.TeacherDashboard.route,
                NavItem.TeacherClasses.route,
                NavItem.TeacherAssignments.route,
                NavItem.TeacherStudents.route,
                NavItem.TeacherProfile.route,
                NavItem.ParentHome.route,
                NavItem.ParentChild.route,
                NavItem.ParentAssignments.route,
                NavItem.ParentProgress.route,
                NavItem.ParentProfile.route
            )

            Scaffold(
                topBar = {
                    Column {
                        OfflineBanner(isOffline = isOffline)
                        SmartSlateTopBar(
                            title = "SmartSlate Connect",
                            roleName = role.name,
                            unreadNotifications = notifications.any { !it.read },
                            onNotificationClick = { navController.navigate("notifications") }
                        )
                    }
                },
                bottomBar = {
                    if (isBottomBarVisible) {
                        SmartSlateBottomNavBar(
                            role = role,
                            currentRoute = currentRoute,
                            onNavigate = { route -> navController.navigate(route) }
                        )
                    }
                }
            ) { innerPadding ->
                Box(modifier = Modifier.padding(innerPadding)) {
                    val startRoute = if (role == UserRole.TEACHER) NavItem.TeacherDashboard.route else NavItem.ParentHome.route

                    NavHost(navController = navController, startDestination = startRoute) {
                        // Notifications Screen
                        composable("notifications") {
                            NotificationScreen(
                                notifications = notifications,
                                onMarkAsRead = { id -> notificationViewModel.markAsRead(id) },
                                onBack = { navController.popBackStack() }
                            )
                        }

                        // TEACHER ROUTES
                        composable(NavItem.TeacherDashboard.route) {
                            TeacherDashboardScreen(
                                teacherName = user.name,
                                state = teacherState,
                                onNavigateToClasses = { navController.navigate(NavItem.TeacherClasses.route) },
                                onNavigateToStudents = { navController.navigate(NavItem.TeacherStudents.route) },
                                onNavigateToAssignments = { navController.navigate(NavItem.TeacherAssignments.route) },
                                onNavigateToCreateAssignment = { navController.navigate("teacher_create_assignment") },
                                onNavigateToAttendance = { navController.navigate("teacher_attendance") },
                                onNavigateToAnnouncement = { navController.navigate("teacher_create_announcement") },
                                onClassClick = { classItem ->
                                    teacherViewModel.selectClass(classItem)
                                    navController.navigate("teacher_class_detail")
                                }
                            )
                        }

                        composable(NavItem.TeacherClasses.route) {
                            TeacherClassesScreen(
                                classes = teacherState.classes,
                                onClassClick = { classItem ->
                                    teacherViewModel.selectClass(classItem)
                                    navController.navigate("teacher_class_detail")
                                }
                            )
                        }

                        composable("teacher_class_detail") {
                            teacherState.selectedClass?.let { selectedClass ->
                                TeacherClassDetailScreen(
                                    classItem = selectedClass,
                                    students = teacherState.students,
                                    onBack = { navController.popBackStack() }
                                )
                            }
                        }

                        composable(NavItem.TeacherStudents.route) {
                            TeacherStudentsScreen(
                                students = teacherState.students
                            )
                        }

                        composable(NavItem.TeacherAssignments.route) {
                            TeacherAssignmentsScreen(
                                assignments = teacherState.assignments,
                                onAssignmentClick = { assignment ->
                                    teacherViewModel.selectAssignment(assignment)
                                    navController.navigate("teacher_submissions")
                                },
                                onCreateAssignmentClick = { navController.navigate("teacher_create_assignment") }
                            )
                        }

                        composable("teacher_submissions") {
                            teacherState.selectedAssignment?.let { selectedAssignment ->
                                TeacherSubmissionsScreen(
                                    assignment = selectedAssignment,
                                    submissions = teacherState.submissions,
                                    onGradeSubmission = { subId, grade, feedback, callback ->
                                        teacherViewModel.gradeSubmission(subId, grade, feedback, callback)
                                    },
                                    onBack = { navController.popBackStack() }
                                )
                            }
                        }

                        composable("teacher_create_assignment") {
                            CreateAssignmentScreen(
                                classes = teacherState.classes,
                                teacherId = user.uid,
                                onCreate = { title, desc, subject, classId, className, dueDate, priority ->
                                    teacherViewModel.createAssignment(
                                        user.uid, title, desc, subject, classId, className, dueDate, priority
                                    ) { success ->
                                        if (success) navController.popBackStack()
                                    }
                                },
                                onBack = { navController.popBackStack() }
                            )
                        }

                        composable("teacher_attendance") {
                            TeacherAttendanceScreen(
                                classes = teacherState.classes,
                                students = teacherState.students,
                                teacherId = user.uid,
                                onSaveAttendance = { classId, className, teacherId, date, map, callback ->
                                    teacherViewModel.saveAttendance(classId, className, teacherId, date, map, callback)
                                },
                                onBack = { navController.popBackStack() }
                            )
                        }

                        composable("teacher_create_announcement") {
                            CreateAnnouncementScreen(
                                classes = teacherState.classes,
                                teacherId = user.uid,
                                teacherName = user.name,
                                onCreateAnnouncement = { tId, tName, cId, cName, title, msg, pr, callback ->
                                    teacherViewModel.createAnnouncement(tId, tName, cId, cName, title, msg, pr, callback)
                                },
                                onBack = { navController.popBackStack() }
                            )
                        }

                        composable(NavItem.TeacherProfile.route) {
                            ProfileScreen(
                                user = user,
                                role = role,
                                onLogoutClick = { authViewModel.logout() }
                            )
                        }

                        // PARENT ROUTES
                        composable(NavItem.ParentHome.route) {
                            ParentHomeScreen(
                                parentName = user.name,
                                state = parentState,
                                onChildSelect = { student -> parentViewModel.selectChild(student) },
                                onNavigateToAttendance = { navController.navigate(NavItem.ParentChild.route) },
                                onNavigateToAssignments = { navController.navigate(NavItem.ParentAssignments.route) },
                                onNavigateToProgress = { navController.navigate(NavItem.ParentProgress.route) },
                                onNavigateToAnnouncements = { navController.navigate("parent_announcements") }
                            )
                        }

                        composable(NavItem.ParentChild.route) {
                            ParentChildrenScreen(
                                children = parentState.children,
                                selectedChild = parentState.selectedChild,
                                onSelectChild = { student -> parentViewModel.selectChild(student) }
                            )
                        }

                        composable(NavItem.ParentAssignments.route) {
                            ParentAssignmentsScreen(
                                child = parentState.selectedChild,
                                submissions = parentState.submissionsList
                            )
                        }

                        composable(NavItem.ParentProgress.route) {
                            ParentProgressScreen(
                                child = parentState.selectedChild,
                                progress = parentState.progress
                            )
                        }

                        composable("parent_announcements") {
                            ParentAnnouncementsScreen(
                                announcements = parentState.announcements
                            )
                        }

                        composable(NavItem.ParentProfile.route) {
                            ProfileScreen(
                                user = user,
                                role = role,
                                onLogoutClick = { authViewModel.logout() }
                            )
                        }
                    }
                }
            }
        }
    }
}
