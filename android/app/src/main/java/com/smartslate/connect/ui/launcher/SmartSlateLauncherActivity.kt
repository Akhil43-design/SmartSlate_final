package com.smartslate.connect.ui.launcher

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.webkit.*
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material.icons.filled.WifiOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.smartslate.connect.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL

/**
 * SmartSlate Dedicated Kiosk Launcher Activity
 * Supports Student Tablet Kiosk (Port 3000) & Parent/Teacher Mobile (Port 3001)
 * Hardware-accelerated WebView with full Stylus, Touch, Offline Wi-Fi Auto-Reconnect, and File Chooser support.
 */
class SmartSlateLauncherActivity : ComponentActivity() {

    private var webView: WebView? = null
    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null

    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val data = result.data
            val results: Array<Uri>? = when {
                data?.dataString != null -> arrayOf(Uri.parse(data.dataString))
                data?.clipData != null -> {
                    val clip = data.clipData!!
                    Array(clip.itemCount) { i -> clip.getItemAt(i).uri }
                }
                else -> null
            }
            fileUploadCallback?.onReceiveValue(results)
        } else {
            fileUploadCallback?.onReceiveValue(null)
        }
        fileUploadCallback = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Read configuration from BuildConfig
        val targetUrl = try {
            BuildConfig::class.java.getField("PORTAL_URL").get(null) as? String
                ?: "http://10.42.0.1:3000/"
        } catch (e: Exception) {
            "http://10.42.0.1:3000/"
        }

        val appTitle = try {
            BuildConfig::class.java.getField("APP_NAME_LABEL").get(null) as? String
                ?: "SmartSlate Educational Appliance"
        } catch (e: Exception) {
            "SmartSlate Educational Appliance"
        }

        val appRole = try {
            BuildConfig::class.java.getField("APP_ROLE").get(null) as? String
                ?: "student"
        } catch (e: Exception) {
            "student"
        }

        setContent {
            MaterialTheme {
                SmartSlateLauncherScreen(
                    targetUrl = targetUrl,
                    appTitle = appTitle,
                    appRole = appRole,
                    onInitWebView = { wv ->
                        this.webView = wv
                        setupWebView(wv)
                    },
                    onOpenFileChooser = { callback, intent ->
                        this.fileUploadCallback = callback
                        fileChooserLauncher.launch(intent)
                    }
                )
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView(wv: WebView) {
        wv.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            loadWithOverviewMode = true
            useWideViewPort = true
            setSupportZoom(true)
            builtInZoomControls = false
            displayZoomControls = false
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            cacheMode = WebSettings.LOAD_DEFAULT
            mediaPlaybackRequiresUserGesture = false
        }

        wv.isFocusable = true
        wv.isFocusableInTouchMode = true
        wv.isClickable = true

        // Ensure stylus pen pressure and pointer events pass cleanly to digital notebook
        wv.setOnTouchListener { v, event ->
            v.requestFocus()
            false
        }
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView?.canGoBack() == true) {
            webView?.goBack()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onDestroy() {
        webView?.destroy()
        webView = null
        super.onDestroy()
    }
}

@Composable
fun SmartSlateLauncherScreen(
    targetUrl: String,
    appTitle: String,
    appRole: String,
    onInitWebView: (WebView) -> Unit,
    onOpenFileChooser: (ValueCallback<Array<Uri>>, Intent) -> Unit
) {
    var isConnected by remember { mutableStateOf(false) }
    var isChecking by remember { mutableStateOf(true) }
    var loadProgress by remember { mutableStateOf(0) }
    var activeWebView by remember { mutableStateOf<WebView?>(null) }
    var lastErrorMessage by remember { mutableStateOf<String?>(null) }

    val coroutineScope = rememberCoroutineScope()

    // Health check function
    suspend fun probePiHotspot(): Boolean {
        return withContext(Dispatchers.IO) {
            try {
                val checkUrl = if (targetUrl.endsWith("/")) "${targetUrl}api/health" else "$targetUrl/api/health"
                val url = URL(checkUrl)
                val conn = url.openConnection() as HttpURLConnection
                conn.connectTimeout = 2000
                conn.readTimeout = 2000
                conn.requestMethod = "GET"
                val code = conn.responseCode
                conn.disconnect()
                code in 200..399
            } catch (e: Exception) {
                // Fallback: try probing the root url
                try {
                    val url = URL(targetUrl)
                    val conn = url.openConnection() as HttpURLConnection
                    conn.connectTimeout = 2000
                    conn.readTimeout = 2000
                    conn.requestMethod = "GET"
                    val code = conn.responseCode
                    conn.disconnect()
                    code in 200..399
                } catch (e2: Exception) {
                    false
                }
            }
        }
    }

    fun triggerReconnect() {
        coroutineScope.launch {
            isChecking = true
            val reachable = probePiHotspot()
            isConnected = reachable
            isChecking = false
            if (reachable) {
                activeWebView?.loadUrl(targetUrl)
            }
        }
    }

    // Auto-probe loop when disconnected
    LaunchedEffect(Unit) {
        while (true) {
            if (!isConnected) {
                val reachable = probePiHotspot()
                if (reachable) {
                    isConnected = true
                    isChecking = false
                    withContext(Dispatchers.Main) {
                        activeWebView?.loadUrl(targetUrl)
                    }
                } else {
                    isChecking = false
                }
            }
            delay(3000)
        }
    }

    Box(modifier = Modifier.fillMaxSize().background(Color(0xFF0F172A))) {

        // Embedded Hardware-Accelerated WebView
        AndroidView(
            factory = { context ->
                WebView(context).apply {
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )

                    onInitWebView(this)
                    activeWebView = this

                    webViewClient = object : WebViewClient() {
                        override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                            lastErrorMessage = null
                        }

                        override fun onPageFinished(view: WebView?, url: String?) {
                            isConnected = true
                            isChecking = false
                        }

                        override fun onReceivedError(
                            view: WebView?,
                            errorCode: Int,
                            description: String?,
                            failingUrl: String?
                        ) {
                            if (failingUrl == targetUrl || failingUrl?.startsWith("http://10.42.0.1") == true) {
                                isConnected = false
                                lastErrorMessage = description
                            }
                        }

                        override fun onReceivedHttpError(
                            view: WebView?,
                            request: WebResourceRequest?,
                            errorResponse: WebResourceResponse?
                        ) {
                            if (request?.isForMainFrame == true && (errorResponse?.statusCode ?: 200) >= 500) {
                                isConnected = false
                            }
                        }
                    }

                    webChromeClient = object : WebChromeClient() {
                        override fun onProgressChanged(view: WebView?, newProgress: Int) {
                            loadProgress = newProgress
                        }

                        override fun onShowFileChooser(
                            webView: WebView?,
                            filePathCallback: ValueCallback<Array<Uri>>?,
                            fileChooserParams: FileChooserParams?
                        ): Boolean {
                            if (filePathCallback != null) {
                                val intent = fileChooserParams?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                                    type = "*/*"
                                    addCategory(Intent.CATEGORY_OPENABLE)
                                }
                                onOpenFileChooser(filePathCallback, intent)
                                return true
                            }
                            return false
                        }

                        override fun onJsAlert(
                            view: WebView?,
                            url: String?,
                            message: String?,
                            result: JsResult?
                        ): Boolean {
                            return super.onJsAlert(view, url, message, result)
                        }
                    }

                    // Initial URL load
                    loadUrl(targetUrl)
                }
            },
            modifier = Modifier.fillMaxSize()
        )

        // Loading Progress Bar
        if (loadProgress in 1..99 && isConnected) {
            LinearProgressIndicator(
                progress = { loadProgress / 100f },
                modifier = Modifier.fillMaxWidth().height(3.dp).align(Alignment.TopCenter),
                color = Color(0xFF6366F1),
                trackColor = Color.Transparent
            )
        }

        // Offline Hotspot Connection Overlay
        AnimatedVisibility(
            visible = !isConnected,
            enter = fadeIn(),
            exit = fadeOut()
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(Color(0xFF0F172A), Color(0xFF1E1B4B))
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth(0.90f)
                        .padding(20.dp),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                    elevation = CardDefaults.cardElevation(defaultElevation = 16.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(28.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        // Wi-Fi Icon Badge
                        Box(
                            modifier = Modifier
                                .size(72.dp)
                                .clip(CircleShape)
                                .background(Color(0xFF312E81)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = if (isChecking) Icons.Default.Wifi else Icons.Default.WifiOff,
                                contentDescription = "Wi-Fi Status",
                                tint = if (isChecking) Color(0xFF818CF8) else Color(0xFFF87171),
                                modifier = Modifier.size(36.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(18.dp))

                        Text(
                            text = appTitle,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.White,
                            textAlign = TextAlign.Center
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = "Connect to SmartSlate Wi-Fi Hotspot",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFFA5B4FC),
                            textAlign = TextAlign.Center
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        // Hotspot Credential Details Card
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = Color(0xFF0F172A),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text("Wi-Fi SSID:", fontSize = 12.sp, color = Color(0xFF94A3B8))
                                    Text("SmartSlate-Pi", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF38BDF8))
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text("Appliance IP:", fontSize = 12.sp, color = Color(0xFF94A3B8))
                                    Text(targetUrl, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF4ADE80))
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(20.dp))

                        // Auto-reconnect status / spinner
                        if (isChecking) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.Center
                            ) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(18.dp),
                                    color = Color(0xFF818CF8),
                                    strokeWidth = 2.dp
                                )
                                Spacer(modifier = Modifier.width(10.dp))
                                Text(
                                    "Checking appliance connection...",
                                    fontSize = 13.sp,
                                    color = Color(0xFF94A3B8)
                                )
                            }
                        } else {
                            Text(
                                "Waiting for Wi-Fi connection...",
                                fontSize = 13.sp,
                                color = Color(0xFF94A3B8)
                            )
                        }

                        Spacer(modifier = Modifier.height(20.dp))

                        Button(
                            onClick = { triggerReconnect() },
                            modifier = Modifier.fillMaxWidth().height(48.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4F46E5))
                        ) {
                            Icon(Icons.Default.Refresh, contentDescription = "Retry", modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Retry Connection", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}
