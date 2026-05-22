/* ========================================
   Portfolio Scripts — Shared across all pages
   ======================================== */

document.addEventListener('DOMContentLoaded', function () {
  /* Mobile menu toggle */
  const menuIcon = document.querySelector('.mobile-menu-icon');
  const navLinks = document.querySelector('.nav-links');

  if (menuIcon && navLinks) {
    menuIcon.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });
  }
});
