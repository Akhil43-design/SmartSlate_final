package com.smartslate.connect.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartslate.connect.data.model.User
import com.smartslate.connect.data.model.UserRole
import com.smartslate.connect.data.repository.AuthRepository
import com.smartslate.connect.data.repository.AuthResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class AuthUiState {
    object Splash : AuthUiState()
    object LoggedOut : AuthUiState()
    object Loading : AuthUiState()
    data class Authenticated(val user: User, val role: UserRole) : AuthUiState()
    data class Error(val message: String) : AuthUiState()
}

class AuthViewModel(
    private val repository: AuthRepository = AuthRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow<AuthUiState>(AuthUiState.Splash)
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    private val _currentUser = MutableStateFlow<User?>(null)
    val currentUser: StateFlow<User?> = _currentUser.asStateFlow()

    init {
        checkAuthSession()
    }

    fun checkAuthSession() {
        viewModelScope.launch {
            _uiState.value = AuthUiState.Splash
            kotlinx.coroutines.delay(1200) // Professional splash duration

            val currentUid = repository.getCurrentUserUid()
            if (currentUid != null) {
                when (val result = repository.fetchUserData(currentUid)) {
                    is AuthResult.Success -> {
                        val user = result.data
                        _currentUser.value = user
                        val role = UserRole.fromString(user.role)
                        _uiState.value = AuthUiState.Authenticated(user, role)
                    }
                    else -> {
                        _uiState.value = AuthUiState.LoggedOut
                    }
                }
            } else {
                _uiState.value = AuthUiState.LoggedOut
            }
        }
    }

    fun login(email: String, pass: String) {
        if (email.isBlank() || pass.isBlank()) {
            _uiState.value = AuthUiState.Error("Please enter both email and password.")
            return
        }

        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            when (val result = repository.login(email.trim(), pass)) {
                is AuthResult.Success -> {
                    val user = result.data
                    _currentUser.value = user
                    val role = UserRole.fromString(user.role)
                    _uiState.value = AuthUiState.Authenticated(user, role)
                }
                is AuthResult.Error -> {
                    _uiState.value = AuthUiState.Error(result.message)
                }
                else -> {}
            }
        }
    }

    fun resetPassword(email: String, onResult: (Boolean, String) -> Unit) {
        if (email.isBlank()) {
            onResult(false, "Please enter your email address.")
            return
        }
        viewModelScope.launch {
            when (val res = repository.resetPassword(email.trim())) {
                is AuthResult.Success -> onResult(true, "Password reset link sent to $email")
                is AuthResult.Error -> onResult(false, res.message)
                else -> {}
            }
        }
    }

    fun logout() {
        repository.logout()
        _currentUser.value = null
        _uiState.value = AuthUiState.LoggedOut
    }
}
