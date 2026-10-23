package com.muzioplayer.spirit.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.muzioplayer.spirit.theme.*

data class NavItem(val id: String, val label: String, val icon: ImageVector)

@Composable
fun BottomNavBar(
    activeTab: String,
    onTabSelected: (String) -> Unit
) {
    val items = listOf(
        NavItem("home", "Home", Icons.Default.Home),
        NavItem("library", "Library", Icons.Default.LibraryMusic),
        NavItem("youtube", "YouTube", Icons.Default.PlayCircleFilled),
        NavItem("ai", "AI Music", Icons.Default.AutoAwesome),
        NavItem("settings", "EQ", Icons.Default.Tune)
    )

    NavigationBar(
        modifier = Modifier
            .fillMaxWidth()
            .navigationBarsPadding(),
        containerColor = BgSecondary,
        tonalElevation = 8.dp
    ) {
        items.forEach { item ->
            val isSelected = activeTab == item.id
            NavigationBarItem(
                selected = isSelected,
                onClick = { onTabSelected(item.id) },
                icon = {
                    Icon(
                        imageVector = item.icon,
                        contentDescription = item.label,
                        modifier = Modifier.size(24.dp)
                    )
                },
                label = {
                    Text(
                        text = item.label,
                        fontSize = 11.sp
                    )
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = GoldAccent,
                    selectedTextColor = GoldAccent,
                    indicatorColor = Color(0x33E5A93C),
                    unselectedIconColor = TextMuted,
                    unselectedTextColor = TextMuted
                )
            )
        }
    }
}
