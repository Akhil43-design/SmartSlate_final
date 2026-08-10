package com.smartslate.connect.ui.components

import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.smartslate.connect.ui.theme.AccentTeal
import com.smartslate.connect.ui.theme.ErrorRed
import com.smartslate.connect.ui.theme.PrimaryIndigo
import com.smartslate.connect.ui.theme.SuccessGreen
import com.smartslate.connect.ui.theme.WarmAmber

@Composable
fun StatusChip(status: String) {
    val (bgColor, textColor) = when (status.lowercase()) {
        "present", "graded", "completed" -> Pair(SuccessGreen.copy(alpha = 0.15f), SuccessGreen)
        "absent", "expired", "high" -> Pair(ErrorRed.copy(alpha = 0.15f), ErrorRed)
        "late", "pending", "normal" -> Pair(WarmAmber.copy(alpha = 0.15f), WarmAmber)
        "submitted", "published" -> Pair(PrimaryIndigo.copy(alpha = 0.15f), PrimaryIndigo)
        "excused" -> Pair(AccentTeal.copy(alpha = 0.15f), AccentTeal)
        else -> Pair(Color.Gray.copy(alpha = 0.15f), Color.DarkGray)
    }

    Surface(
        shape = CircleShape,
        color = bgColor
    ) {
        Text(
            text = status.replaceFirstChar { it.uppercase() },
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            color = textColor,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
        )
    }
}
