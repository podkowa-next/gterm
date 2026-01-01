// Document "back" navigation to the most recent page in history
document.addEventListener("DOMContentLoaded", function() {
    const backLinks = document.querySelectorAll('[data-back-link]');
    backLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        if (history.length > 1) {
          history.back();
        } else {
          window.location.href = "/skp"; // fallback URL
        }
      });
    });
  });

// Document root color scheme applied from article CMS field (from element with "data-scheme" data attribute)
document.addEventListener('DOMContentLoaded', function () {
    // Get the hidden div that carries the CMS-bound data attribute
    const root = document.querySelector('[data-scheme]');
    if (!root) return;

    // Read CMS value (e.g. "color-scheme-2")
    const scheme = root.dataset.scheme?.trim();

    // Fallback to default color scheme if CMS field is empty or undefined
    const finalScheme = scheme || 'color-scheme-0';

    // Remove any existing color-scheme-* classes from <body>
    document.body.classList.forEach(cls => {
        if (cls.startsWith('color-scheme-')) {
            document.body.classList.remove(cls);
        }
    });

    // Apply the new scheme
    document.body.classList.add(finalScheme);
});