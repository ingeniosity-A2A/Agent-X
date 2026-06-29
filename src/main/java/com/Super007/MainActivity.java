// android/app/src/main/java/com/super007/MainActivity.java
package com.super007;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityService;
import android.accessibilityservice.GestureDescription;
import android.graphics.Path;
import android.graphics.Bitmap;
import android.graphics.PixelFormat;
import android.hardware.display.DisplayManager;
import android.hardware.display.VirtualDisplay;
import android.media.Image;
import android.media.ImageReader;
import android.media.projection.MediaProjection;
import android.media.projection.MediaProjectionManager;
import android.util.Base64;
import android.util.DisplayMetrics;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.webkit.WebChromeClient;
import android.webkit.WebViewClient;
import android.content.Intent;
import android.content.Context;

import androidx.appcompat.app.AppCompatActivity;

import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private MediaProjection mediaProjection;
    private VirtualDisplay virtualDisplay;
    private ImageReader imageReader;
    private AccessibilityService accessibilityService; // Injected via system binding
    private Handler mainHandler = new Handler(Looper.getMainLooper());

    // ------------------------------------------------------------------------
    // 1. ZERO-LATENCY SCREEN CAPTURE (No Capacitor)
    // ------------------------------------------------------------------------
    private void startScreenCapture(int resultCode, Intent data) {
        MediaProjectionManager projectionManager = (MediaProjectionManager) getSystemService(Context.MEDIA_PROJECTION_SERVICE);
        mediaProjection = projectionManager.getMediaProjection(resultCode, data);
        
        DisplayMetrics metrics = getResources().getDisplayMetrics();
        int width = metrics.widthPixels;
        int height = metrics.heightPixels;
        int density = metrics.densityDpi;

        // ImageReader for raw pixel access
        imageReader = ImageReader.newInstance(width, height, PixelFormat.RGBA_8888, 2);
        imageReader.setOnImageAvailableListener(reader -> {
            Image image = reader.acquireLatestImage();
            if (image != null) {
                // Send raw bytes directly to JS (Zero-copy via Base64 or ArrayBuffer)
                Image.Plane[] planes = image.getPlanes();
                ByteBuffer buffer = planes[0].getBuffer();
                byte[] bytes = new byte[buffer.remaining()];
                buffer.get(bytes);
                String base64Frame = Base64.encodeToString(bytes, Base64.NO_WRAP);
                
                // Inject directly into JavaScript global function (NO PLUGIN BRIDGE)
                webView.evaluateJavascript(
                    "window.__onScreenCapture('" + base64Frame + "', " + width + ", " + height + ");",
                    null
                );
                image.close();
            }
        }, mainHandler);

        virtualDisplay = mediaProjection.createVirtualDisplay(
            "ScreenCapture",
            width, height, density,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            imageReader.getSurface(),
            null, null
        );
    }

    // ------------------------------------------------------------------------
    // 2. ZERO-LATENCY ACTION EXECUTION (Direct InputManager/Accessibility)
    // ------------------------------------------------------------------------
    private void performTap(int x, int y) {
        if (accessibilityService == null) return;
        
        Path clickPath = new Path();
        clickPath.moveTo(x, y);
        GestureDescription.Builder gestureBuilder = new GestureDescription.Builder();
        gestureBuilder.addStroke(new GestureDescription.StrokeDescription(clickPath, 0, 50));
        accessibilityService.dispatchGesture(gestureBuilder.build(), null, null);
    }

    private void performSwipe(int startX, int startY, int endX, int endY, int duration) {
        if (accessibilityService == null) return;
        
        Path swipePath = new Path();
        swipePath.moveTo(startX, startY);
        swipePath.lineTo(endX, endY);
        GestureDescription.Builder gestureBuilder = new GestureDescription.Builder();
        gestureBuilder.addStroke(new GestureDescription.StrokeDescription(swipePath, 0, duration));
        accessibilityService.dispatchGesture(gestureBuilder.build(), null, null);
    }

    // ------------------------------------------------------------------------
    // 3. THE NATIVE BRIDGE (Exposed to JavaScript)
    // ------------------------------------------------------------------------
    public class NativeBridge {
        @JavascriptInterface
        public void requestScreenCapture() {
            // Triggers the Android permission flow
            MediaProjectionManager projectionManager = (MediaProjectionManager) getSystemService(Context.MEDIA_PROJECTION_SERVICE);
            startActivityForResult(projectionManager.createScreenCaptureIntent(), 1001);
        }

        @JavascriptInterface
        public void tap(float x, float y) {
            // Direct OS call from JS
            mainHandler.post(() -> performTap((int)x, (int)y));
        }

        @JavascriptInterface
        public void swipe(float startX, float startY, float endX, float endY, int duration) {
            mainHandler.post(() -> performSwipe((int)startX, (int)startY, (int)endX, (int)endY, duration));
        }

        @JavascriptInterface
        public void typeText(String text) {
            mainHandler.post(() -> {
                // Send text via AccessibilityService (simulates keyboard)
                if (accessibilityService != null) {
                    android.view.accessibility.AccessibilityNodeInfo focused = accessibilityService.getRootInActiveWindow();
                    if (focused != null) {
                        Bundle args = new Bundle();
                        args.putCharSequence(android.view.accessibility.AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text);
                        focused.performAction(android.view.accessibility.AccessibilityNodeInfo.ACTION_SET_TEXT, args);
                    }
                }
            });
        }

        @JavascriptInterface
        public void logToNative(String message) {
            android.util.Log.d("007-Harness", message);
        }

        @JavascriptInterface
        public String getDeviceId() {
            // For hardware fingerprinting (if needed)
            return android.provider.Settings.Secure.getString(getContentResolver(), android.provider.Settings.Secure.ANDROID_ID);
        }
    }

    // ------------------------------------------------------------------------
    // Activity Lifecycle
    // ------------------------------------------------------------------------
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Inflate WebView directly (NO CAPACITOR LAYER)
        webView = new WebView(this);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setAllowFileAccess(true);
        webView.getSettings().setAllowContentAccess(true);
        
        // Critical: Disable remote debugging to avoid detection
        WebView.setWebContentsDebuggingEnabled(false);

        // Attach the native bridge
        webView.addJavascriptInterface(new NativeBridge(), "AndroidOS");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                // Signal to JS that native bridge is ready
                view.evaluateJavascript("if(window.__onNativeReady) window.__onNativeReady();", null);
            }
        });

        webView.loadUrl("file:///android_asset/index.html");
        setContentView(webView);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == 1001 && resultCode == RESULT_OK) {
            startScreenCapture(resultCode, data);
        }
    }

    // Setter for AccessibilityService (called from the service itself)
    public void setAccessibilityService(AccessibilityService service) {
        this.accessibilityService = service;
    }
}
