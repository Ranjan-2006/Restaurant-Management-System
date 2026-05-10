function navigateTo(panel) {
    console.log("System Request: Navigation to " + panel);
    
    // Smooth transition effect
    document.body.style.opacity = '0.7';
    
    setTimeout(() => {
        // In a deployed environment, use proper routing:
        // window.location.href = '/' + panel + '-panel.html';
        
        alert("System Navigation: Accessing " + panel.toUpperCase() + " Panel...");
        document.body.style.opacity = '1';
    }, 300);
}

// Log system ready status
document.addEventListener('DOMContentLoaded', () => {
    console.log("Resturant Management Interface: Online");
});