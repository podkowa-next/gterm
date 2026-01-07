// CMS collection driven "active" combo class added into the accordion (current class name .layout351_accordion)

document.addEventListener('DOMContentLoaded', function() {
    // Select all accordion items
    const items = document.querySelectorAll('.layout351_accordion');
    
    // Safety check
    if(items.length === 0) return;

    // 1. Set the first item as active by default
    items[0].classList.add('active');

    // 2. Add click listeners to all items
    items.forEach(item => {
        item.addEventListener('click', function() {
            // If this item is already active, do nothing (optional)
            if(this.classList.contains('active')) return;

            // Remove 'active' class from ALL items
            items.forEach(el => el.classList.remove('active'));

            // Add 'active' class to the CLICKED item
            this.classList.add('active');
        });
    });
});