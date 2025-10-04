# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio and presentation website for Paciurcă Andrei-Alexandru, built with Jekyll and hosted on GitHub Pages at https://andreipaciurca.github.io.

## Technology Stack

- **Static Site Generator**: Jekyll with Liquid templating
- **CSS Framework**: Bootstrap
- **JavaScript Libraries**: jQuery, Bootstrap.js, Grayscale theme
- **Icons**: Font Awesome
- **Additional Features**: Lightbox2 for portfolio images, one-page scroll navigation

## Site Architecture

### Main Site Structure

The main site (`index.html`) uses Jekyll's layout system with a default layout (`_layouts/default.html`) that includes modular HTML partials:

- `_includes/head.html` - Meta tags, stylesheets, fonts
- `_includes/nav.html` - Navigation bar
- `_includes/header.html` - Hero section
- `_includes/about.html` - About section
- `_includes/download.html` - Download/action section
- `_includes/contact.html` - Contact section
- `_includes/footer.html` - Footer
- `_includes/js.html` - JavaScript includes

### Additional Pages

- `/portfolio/portfolio.html` - Standalone portfolio page with services showcase and image gallery
- `/resume/resume.html` - Resume page that embeds a PDF

### Configuration

Site configuration is in `_config.yml` with settings for:
- Site metadata (title, email, description)
- Color scheme (primary-dark, links colors)
- Social network links
- Jekyll build settings (markdown: kramdown, permalink: pretty)

## Development Commands

### Local Development
```bash
# Install Jekyll and dependencies (if not already installed)
gem install jekyll bundler

# Serve the site locally
jekyll serve

# Build the site
jekyll build
```

### Deployment

This site is hosted on GitHub Pages and automatically deploys when changes are pushed to the master branch. No manual deployment needed.

## CSS Architecture

Main site styling uses two approaches:
- **Main Site**: CSS embedded in `_includes/css/` (bootstrap.min.css, grayscale.css) loaded via `_includes/head.html`
- **Portfolio Page**: External vendor CSS from `portfolio/vendor/` directories (Bootstrap, Lightbox2, Owl Carousel, etc.)
- **Custom Styles**: `portfolio/css/custom.css` and `portfolio/css/style.default.css`

## Working with Content

### Updating Main Site Sections

Edit the corresponding HTML files in `_includes/`:
- About content: `_includes/about.html`
- Contact information: `_includes/contact.html`
- Header/hero: `_includes/header.html`

### Updating Portfolio

Edit `portfolio/portfolio.html` directly. Portfolio images are referenced from `portfolio/img/portfolio-*.jpg`.

### Site Configuration Changes

Modify `_config.yml` for:
- Site title, email, description
- Social media links
- Color scheme changes

## File Organization

- `/_includes/` - Reusable HTML components for main site
- `/_layouts/` - Page templates
- `/css/` - Stylesheets for main site
- `/js/` - JavaScript files for main site
- `/portfolio/` - Standalone portfolio page with its own assets and vendors
- `/resume/` - Resume page and PDF
- `/img/` - Main site images
