# GitHub-Repo-Analyzer

A simple front-end web application that consumes the GitHub public API to analyze a user's repositories and profile. Features include:

- Initial landing page with a centered GitHub username search (dashboard appears after search)
- Search for any GitHub username
- Display profile information: followers, following, repositories, total stars
- Show recent repositories with language, stars, and last-updated date
- Generate a language usage graph and stars-per-language bar chart
- Responsive layout using CSS

## Getting Started

1. Clone this repository or download the files.
2. Open `index.html` in your browser (no server required).
3. Enter a GitHub username in the search box and hit **Search**.

> ⚠️ Because the app uses the public API, it is subject to GitHub's unauthenticated rate limits (60 requests per hour). For heavier usage, consider adding an OAuth token in `app.js` fetch headers.

## Project Structure

```
/ (root)
├── index.html      # main page with dashboard layout
├── css
│   └── style.css   # styling including sidebar, topbar, cards
└── js
    └── app.js      # application logic and API calls
```

The UI now resembles a material dashboard with a sidebar menu and top navigation bar. Sidebar items are clickable and will show a placeholder alert when selected; you can extend each link to load real content. The sidebar logo text has been changed to **Teja** to reflect the desired homepage name. Profile includes a row of stat cards (followers, following, repo count, total stars). Charts section now shows two side‑by‑side graphs: a pie of top languages and a bar chart of stars per language. Repository list includes language and last-updated date per repo, with responsive presentation on mobile devices. Charts include both top languages and stars-per-language, matching the wireframe layout.
## Development Tips

- You can host the files locally with `npx serve` or any static server to avoid CORS issues.
- Chart.js is loaded from CDN for displaying language usage.

**project link " https://teja80138.github.io/GitHub-Repo-Analyzer/ "**

Enjoy exploring GitHub repositories!
