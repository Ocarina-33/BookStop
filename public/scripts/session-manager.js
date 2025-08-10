// Simple session management for multiple users
(function() {
    'use strict';
    
    // Helper function to set cookies
    function setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
    }
    
    // On login success, set the new session as current
    window.setCurrentSession = function(sessionId) {
        setCookie('currentSession', sessionId, 1);
    };
    
    // Simple session switching function
    window.switchToSession = function(sessionId) {
        setCookie('currentSession', sessionId, 1);
        window.location.reload();
    };

    // Update notification count in navbar
    function updateNotificationCount() {
        // Only run if user is logged in (check if notification badge exists)
        const badge = document.querySelector('#notification-badge');
        if (badge) {
            fetch('/My-section/notifications/unread-count')
            .then(response => response.json())
            .then(data => {
                if (data.count > 0) {
                    badge.textContent = data.count;
                    badge.style.display = 'inline-block';
                } else {
                    badge.style.display = 'none';
                }
            })
            .catch(error => console.error('Error loading notification count:', error));
        }
    }

    // Load notification count when page loads
    document.addEventListener('DOMContentLoaded', function() {
        updateNotificationCount();
    });

    // Expose function globally for other scripts to use
    window.updateNotificationCount = updateNotificationCount;
    
    console.log('Session manager loaded');
})();
