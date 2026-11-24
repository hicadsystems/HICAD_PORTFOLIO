> **Version 1: logo takes the site colours.** The site keeps its teal and navy theme; the logo uses the site's button blue (`--brand` in `styles.css`) and reverses to white in dark mode.

# HICAD Systems Limited — Static Website

A lightweight company portfolio website built with plain HTML, CSS and vanilla JavaScript.

## Pages

- `/` — Home
- `/about/` — About HICAD
- `/services/` — Services
- `/our-works/` — Selected implementations

## Run locally

No Node.js, npm, framework or build step is required. Open `index.html` in a browser, or run a local static server from this directory:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## Deploy to cPanel / Apache

1. Extract the ZIP.
2. Upload the **contents** of this folder (including `.htaccess`) into the domain's `public_html` directory or the document root for the target subdomain.
3. `contact.php` must be uploaded with everything else (it needs PHP; see Contact form below). Ensure Apache `mod_headers` and `mod_expires` are enabled. The pages still work without the optional headers/cache rules; clean directory URLs are supported by Apache's normal directory index handling.
4. Visit `/`, `/about/`, `/services/` and `/our-works/`.

The site uses folder-based routes with an `index.html` in each route directory. `.htaccess` provides directory-index handling (no rewrite rules needed), a custom 404 page, basic security headers and asset caching.

## Updating content

- Company details and navigation are in the HTML files.
- Shared styles are in `styles.css`.
- Mobile navigation, active-page highlighting, the light/dark theme toggle, the condensing header and reading-progress line, scroll animations and the contact form behaviour are in `script.js`. All motion respects the visitor's reduced-motion setting.
- The logo (the word HICAD in a box, as on the company letterhead) is an inline SVG in each page, drawn from exact vector outlines so it never depends on installed fonts. It is the letterhead blue on light backgrounds and reversed to white on dark ones (`--brand` in `styles.css`). The full letterhead logo is kept at `assets/hicad-logo.svg` for later use.
- Theme colours are CSS variables at the top of `styles.css` (`:root` for light, `[data-theme="dark"]` for dark).

## Contact form

The enquiry form is in the teal band at the bottom of the home page (`/#contact`); every "Contact Us" button links there. Submissions go to **`contact.php`**, which emails them to `info@hicadsystemsltd.com` using the web server's own mail. No third-party service or account is involved.

**What `contact.php` does**

- Checks the fields, then sends one plain-text email: the subject is `Website enquiry: <topic> | <name>`, and **Reply-To is the visitor's address**, so pressing Reply in the mailbox answers them directly.
- Blocks spam: a hidden trap field, a minimum time on the page, a limit of 5 messages per visitor per hour, a limit on links, and it only accepts submissions that come from this website.
- Protects against email header injection and handles non-English names correctly.

**Settings** are at the top of `contact.php`: the recipient (`TO_EMAIL`), the "sent from" address (`FROM_EMAIL`, keep it on your own domain), and the spam limits.

**Requirements:** PHP 7.2 or newer on the hosting account (no extensions needed), and the `info@hicadsystemsltd.com` mailbox created in cPanel under **Email Accounts**. If the domain's email is hosted elsewhere (for example Google Workspace), the server may try to deliver locally and the message will not arrive; in that case change `TO_EMAIL` to a mailbox that exists on this cPanel account.

**Checking it after upload**

1. Open `https://www.hicadsystemsltd.com/contact.php` in a browser. You should see a short message saying the address only accepts the contact form. That means PHP is running. If the browser shows PHP code or offers a download, PHP is not enabled for the domain (cPanel > MultiPHP Manager).
2. Send a test message through the form on the home page and check the inbox (and the spam folder the first time).

Opened from a folder or a plain static server (no PHP), the form only previews the flow and nothing is sent. The service links (`/?topic=payroll#contact`) pre-select the topic.

## Link previews

`assets/og-image.png` (1200×630) is the image shown when the site is shared on WhatsApp, LinkedIn, X, etc. It is referenced by absolute URL in each page's `og:image` tag, so previews only work once the site is live at www.hicadsystemsltd.com.

## Confirmed company details used

HICAD Systems Limited · RC. 129908 · Computer & Communications Consultants

1st Floor, Ibu-Owo House, 39, Osolo Way, off International Airport Road, Ajao Estate, Lagos, Nigeria.

Phone: 08033325827  
Email: info@hicadsystemsltd.com  
Website: www.hicadsystemsltd.com

## Content notes

The service and project descriptions are based on the source website materials in the supplied ZIP. The portfolio intentionally avoids inventing client outcomes, project dates, leadership titles or unsupported company claims. The company document supplied the official header/contact details.

## SEO

Already built in, on every page:

- A unique title and description (kept inside the lengths Google shows), one main heading, and a canonical address.
- Structured data (JSON-LD) describing the company (name, address, phone, email, founding year, RC number, services), the website, and each page, with breadcrumbs on inner pages and the four services listed on the Services page.
- Social-sharing tags with the 1200 x 630 image, and a full set of icons (`favicon.ico`, PNG, SVG, touch icon, `site.webmanifest`).
- `sitemap.xml` with dates, and `robots.txt`. The contact script is marked "do not index".
- `.htaccess` sends everything to **https://www.hicadsystemsltd.com** (http to https, non-www to www, and `/index.html` to `/`), compresses files, and caches them for speed.

**Keep these up to date**

- If the address, phone or email changes: update the footer and contact section on each page, and the JSON-LD block in each page's `<head>` (search for `application/ld+json`).
- When a page's content changes, update its `<lastmod>` date in `sitemap.xml`.
- If the site moves to another domain: replace `www.hicadsystemsltd.com` in `.htaccess`, `sitemap.xml`, `robots.txt`, and the canonical, social and JSON-LD tags in every page.

**Outside the website files** (done on Google's side, not here): add the site to Google Search Console and submit `sitemap.xml`, and create a Google Business Profile for the Lagos office.
