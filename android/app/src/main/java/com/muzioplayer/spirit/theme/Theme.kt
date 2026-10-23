package com.muzioplayer.spirit.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = GoldAccent,
    onPrimary = BgPrimary,
    secondary = GoldLight,
    background = BgPrimary,
    surface = BgSecondary,
    onBackground = TextPrimary,
    onSurface = TextPrimary
)

@Composable
fun MuzioSpiritTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        content = content
    )
}
