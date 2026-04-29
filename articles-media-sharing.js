document.addEventListener('DOMContentLoaded', () => {
    // 1. Properly encode the URL and Title to prevent broken links
    const currentUrl = encodeURIComponent(window.location.href);
    const currentTitle = encodeURIComponent(document.title);

    // Helper function to safely set attributes
    const setLinkAttributes = (button, href) => {
        button.setAttribute('target', '_blank');
        button.setAttribute('rel', 'noopener noreferrer'); // Security best practice
        button.setAttribute('href', href);
    };

    // LinkedIn sharing (Modern endpoint: share-offsite)
    document.querySelectorAll('[data-linkedin-button]').forEach(button => {
        setLinkAttributes(
            button, 
            `https://www.linkedin.com/sharing/share-offsite/?url=${currentUrl}`
        );
    });

    // X sharing (Modern endpoint: intent/tweet)
    document.querySelectorAll('[data-x-button]').forEach(button => {
        setLinkAttributes(
            button, 
            `https://x.com/intent/tweet?url=${currentUrl}&text=${currentTitle}`
        );
    });

    // Facebook sharing
    document.querySelectorAll('[data-facebook-button]').forEach(button => {
        setLinkAttributes(
            button, 
            `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`
        );
    });

    // Copy URL to clipboard
    document.querySelectorAll('[data-copy-url-button]').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default button/link behavior
            
            // Check if Clipboard API is supported (requires HTTPS)
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(window.location.href).then(() => {
                    // Tip: In modern apps, replace 'alert' with a nice UI toast notification
                    alert('URL copied to clipboard'); 
                }).catch(err => {
                    console.error('Failed to copy URL: ', err);
                });
            } else {
                console.warn('Clipboard API not available. Ensure you are on HTTPS.');
            }
        });
    });
});