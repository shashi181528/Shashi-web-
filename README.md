# Netlify deployment

This site serves the HTML, CSS, and JavaScript files in the repository root directly. It does not require Jekyll or a generated `_site` directory.

`netlify.toml` sets the publish directory to `.` and uses an explicit no-op build command. Keep this command non-empty so any saved build command does not take effect again.

The saved Netlify build settings should also use `.` as the publish directory and `echo 'Static site ready; no build required'` as the build command.

The published directory contains `index.html`, the admin HTML pages, and their CSS and JavaScript assets. No dependency installation or site generation is required.
