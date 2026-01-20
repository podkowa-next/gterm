
// LinkedIn, X and Facebook post sharing functionality script and additionally copy URL functionality (requires data attributes to be set on buttons

   // LinkedIn sharing
   document.querySelectorAll('[data-linkedin-button]').forEach(button => {
       button.setAttribute('target', '_blank');
       button.setAttribute(
           'href',
           `https://www.linkedin.com/shareArticle?mini=true&url=${window.location.href}&title=${document.title}`
       );
   });

   // X sharing
   document.querySelectorAll('[data-x-button]').forEach(button => {
       button.setAttribute('target', '_blank');
       button.setAttribute(
           'href',
           `https://x.com/share?url=${window.location.href}&text=${document.title}`
       );
   });

   // Facebook sharing
   document.querySelectorAll('[data-facebook-button]').forEach(button => {
       button.setAttribute('target', '_blank');
       button.setAttribute(
           'href',
           `https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`
       );
   });

   // Copy URL to clipboard
   document.querySelectorAll('[data-copy-url-button]').forEach(button => {
       button.addEventListener('click', () => {
           navigator.clipboard.writeText(window.location.href).then(() => {
               alert('URL copied to clipboard');
           }).catch(err => {
               console.error('Failed to copy URL: ', err);
           });
       });
   });