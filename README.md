# Kiran Ragavender Shankar · Portfolio

Live site: https://kiran-ragavender.github.io/

Personal portfolio and resume: a single-page, black cyberpunk design with a full-page stardust animation, scroll-reveal sections, a working contact form, and a printable black & white resume.

## Files
- `index.html`: page content. Look for `EDIT:` comments to update text, links, and projects. The printable resume is the `.print-resume` block at the bottom.
- `css/styles.css`: palette, design tokens (dark + light), component styles, and the print layout, in numbered sections.
- `js/stardust.js`: the animated starfield. Tweak density, speed, and parallax in `CONFIG`.
- `js/main.js`: theme toggle, nav, scroll reveals, contact form, and print buttons.

## Contact form
By default the form opens the visitor's email app with the message pre-filled. To receive messages directly, create a free form at [formspree.io](https://formspree.io) and paste its URL into `CONTACT.endpoint` at the top of `js/main.js`.

## Hidden links
Any link with `href="#"` (Live Demo buttons, the X profile) is hidden automatically. Replace `#` with a real URL and it appears.
