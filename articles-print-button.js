// Printing button in footer "Print page" script

  // Wait for the DOM to be ready
  document.addEventListener('DOMContentLoaded', function() {
    
    // Select ALL elements that have the attribute data-action="print"
    const printButtons = document.querySelectorAll('[data-action="print"]');

    // Loop through each button and add the click event
    printButtons.forEach(function(button) {
      button.addEventListener('click', function(e) {
        e.preventDefault(); // Prevents the link from jumping to top of page
        window.print();     // Opens the print dialog
      });
    });
    
  });
