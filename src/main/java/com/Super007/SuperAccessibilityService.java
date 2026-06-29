// android/app/src/main/java/com/super007/SuperAccessibilityService.java
package com.super007;

import android.accessibilityservice.AccessibilityService;
import android.view.accessibility.AccessibilityEvent;

public class SuperAccessibilityService extends AccessibilityService {
    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        // Silently listen for UI changes to trigger the Reflex layer
        // We pass this back to the WebView via the native bridge
    }

    @Override
    public void onInterrupt() {}

    @Override
    public void onServiceConnected() {
        // Inject this service instance into MainActivity
        MainActivity activity = (MainActivity) getApplicationContext();
        if (activity != null) {
            activity.setAccessibilityService(this);
        }
    }
}
