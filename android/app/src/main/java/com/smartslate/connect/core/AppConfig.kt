package com.smartslate.connect.core

object AppConfig {
    /**
     * Configurable Student Server URL:
     * - DEVELOPMENT (Android Emulator to local PC): "http://10.0.2.2:3002"
     * - DEVELOPMENT (Physical Phone to local PC Wi-Fi): "http://<YOUR_PC_IP>:3002"
     * - PRODUCTION (Raspberry Pi 2 W StudentOS): "http://10.42.0.1:3002"
     */
    var STUDENT_SERVER_URL: String = "http://10.0.2.2:3002"
}
