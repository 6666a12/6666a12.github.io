# AGENTS.md - Project Documentation for AI Coding Agents

## Project Overview

This is a **personal portfolio website** hosted on GitHub Pages at `6666a12.github.io`. It's a static website built with pure HTML, CSS, and vanilla JavaScript as a learning project for web development.

The website features a custom audio player, hash-based client-side routing for SPA-like navigation, and responsive UI with glass morphism effects. The content is primarily in Chinese, targeting a Chinese-speaking audience interested in anime, games, and creative works.

## Technology Stack

| Category | Technology |
|----------|------------|
| Frontend | HTML5, CSS3, JavaScript (ES6+) |
| External Libraries | jQuery 4.0.0 (CDN), Supabase JS Client v2 (CDN), BroadcastChannel API |
| Build Tools | None - pure static site |
| Package Manager | npm (package-lock.json exists but empty) |
| Hosting | GitHub Pages |

**Note:** This is a zero-build project. No compilation, bundling, or preprocessing is required.

## Project Structure

```
6666a12.github.io/
├── index.html              # Main entry point / homepage
├── README.md               # Brief project description (minimal)
├── AUTH_SETUP.md          # Authentication system setup guide
├── DATABASE_SETUP.md      # Supabase database setup SQL
├── package-lock.json       # Empty npm lockfile (no dependencies)
├── .vscode/settings.json   # VS Code: default preview path
├── audio/                  # MP3 music files for the player
│   ├── Dachs - Holy Night, Silent Night.mp3
│   ├── DJ TOTTO - 童話回廊.mp3
│   ├── Feryquitous - 愚か者の賢人論.mp3
│   ├── Mother Earth (Original Mix) - Dachs.mp3
│   └── polysha - Where The Spirits Go on.mp3
├── components/             # JavaScript modules
│   ├── auth.js            # Global authentication module
│   ├── Hash.js            # HashRouter class for client-side routing
│   └── sc.js              # Clock component (digital clock display)
├── css/                    # Stylesheets
│   ├── admin.css          # Admin/auth page styles (admin.html)
│   ├── audio.css          # Audio player component styles
│   ├── auth.css           # Global authentication status styles
│   ├── log-in.css         # Legacy login form styles
│   ├── main.css           # Main stylesheet (global styles)
│   └── minecraft.css      # Minecraft/hobbies page styles
├── pic/                    # Image assets
│   ├── bg.jpg             # Background image
│   ├── Dynamix_logo.webp  # Game logo (Dynamix)
│   ├── lemon.jpg          # Personal avatar image
│   ├── stream-pig.gif     # Animated pig GIF for navigation
│   ├── trakov-logo.webp   # Escape from Tarkov logo
│   └── yz.jpg             # Background for login page
└── src/                    # Additional HTML pages
    ├── admin.html         # Login/registration page (SPA with Supabase)
    ├── articles.html      # Art appreciation section (hash router)
    ├── arrange.html       # Empty placeholder file
    ├── charts.html        # Empty placeholder file
    ├── home.html          # About page / website introduction
    ├── minecraft.html     # Hobby/projects showcase (hash router)
    └── update.html        # Changelog page
```

## Architecture Details

### Navigation Structure

The website uses a shared top navigation menu across all pages:

1. **主页 (Home)** - `index.html` - Landing page with audio player
2. **网站简介 (About)** - `src/home.html` - Website introduction
3. **艺术鉴赏 (Art)** - `src/articles.html` - Art/anime appreciation section
4. **爱好制作 (Hobbies)** - `src/minecraft.html` - Projects showcase
5. **随如🖊 (Blog)** - `#blog` - Placeholder (marked "没做好" - not done)
6. **投喂 (Donation)** - `#donation` - Placeholder (marked "没做好" - not done)

### Global Authentication System

The website features a complete authentication system using Supabase Auth, with global state synchronization across all pages.

**Components:**
- `components/auth.js` - Global authentication module
- `src/admin.html` - Authentication SPA (login/register/user center)
- Global auth status indicator on all pages

**Features:**
- Email/password login and registration
- Session persistence across page refreshes
- Cross-tab synchronization via BroadcastChannel + localStorage
- Real-time auth status display on all pages
- Automatic redirects based on auth state

**Usage in pages:**
```javascript
// Subscribe to auth state changes
Auth.subscribe((user) => {
    if (user) {
        console.log('Logged in as:', user.email);
    } else {
        console.log('Not logged in');
    }
});

// Perform auth actions
await Auth.login(email, password);
await Auth.logout();
```

### Client-Side Routing

Some pages (`admin.html`, `articles.html`, `minecraft.html`) use a custom `HashRouter` class defined in `components/Hash.js`:

```javascript
// Usage pattern found in pages
let routes = {
    '/path' : () => RenderPage('template-id'),
    '*' : () => RenderPage('page-404')  // Catch-all
}
let router = new HashRouter(routes);
router.push('/path');
```

Key features:
- Hash-based routing (`#/path`)
- Template-based rendering using `<template>` elements
- Fade-in/fade-out transitions (200ms)
- Dirty state detection with confirmation dialogs

### Audio Player

A custom audio player is embedded in `index.html` with:
- Playlist support (5 tracks)
- Play/pause, previous/next controls
- Progress slider with time display
- Scrolling track info animation

### Clock Component

`components/sc.js` provides a real-time digital clock displayed in the navigation bar, updating every second using `requestAnimationFrame`.

## Development Guidelines

### File Organization

- **HTML Pages**: Main page in root (`index.html`), subpages in `src/`
- **CSS**: Modular approach - `main.css` for global styles, specific files for components
- **JavaScript**: Reusable components in `components/`, page-specific scripts inline
- **Assets**: Audio in `audio/`, images in `pic/`

### Path Conventions

- Use relative paths: `../css/main.css` from `src/` files
- Root-level files reference: `pic/bg.jpg` (no leading slash)
- Always use forward slashes for cross-platform compatibility

### CSS Conventions

- ID selectors use camelCase or descriptive names: `#audiom`, `#trackinfo`
- Class selectors use kebab-case: `.topmenu`, `.bottom-bar`
- Animations defined with `@keyframes`, applied via utility classes
- Common utility classes:
  - `.highlight` - Dodger blue background for active nav items
  - `.breathe` - Pulsing opacity animation
  - `.flipInY`, `.flipInX` - 3D flip animations
  - `.undo` - Aquamarine color for incomplete features

### Known Issues

1. **Bug in `src/articles.html` line 39**: Stray character `c` before `<script>` tag
2. **Broken image paths in `src/update.html`**: Missing `../` prefix for pic references
3. **Empty placeholder files**: `arrange.html` and `charts.html` are blank
4. **Supabase config required**: Authentication requires manual configuration of Supabase credentials in `src/admin.html`

## Testing Instructions

Since this is a static website, testing is manual:

1. **Local Testing**: Open `index.html` directly in a browser
2. **VS Code Live Preview**: Extension configured to preview `/src/articles.html`
3. **No automated tests**: The project has no test framework configured

### Recommended Testing Checklist

- [ ] Navigation links work between all pages
- [ ] Audio player functions (play, pause, skip, seek)
- [ ] Clock displays correct time
- [ ] Hash routing works on SPA pages (admin, articles, minecraft)
- [ ] Responsive layout at different screen sizes
- [ ] All images load correctly
- [ ] **Authentication system:**
  - [ ] Login form displays correctly in `src/admin.html`
  - [ ] User can log in with email/password
  - [ ] User can register new account
  - [ ] Auth status shows on all pages when logged in
  - [ ] Logout works and updates all open tabs
  - [ ] Session persists after page refresh

## Deployment Process

This site is deployed via **GitHub Pages**:

1. Push changes to `main` branch
2. GitHub Pages automatically publishes the site
3. Live URL: `https://6666a12.github.io`

**No build step required** - files are served as static assets.

## Security Considerations

1. **Supabase Authentication**: Full authentication flow using Supabase Auth (email/password)
2. **Session Management**: Uses Supabase's secure session handling with automatic token refresh
3. **Row Level Security (RLS)**: Database tables should have RLS policies configured
4. **HTTPS**: Site is served over HTTPS via GitHub Pages

### Authentication Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Login Page │────▶│  Supabase    │────▶│ User Center │
│  #/login    │     │  Auth API    │     │  #/user     │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Session    │
                    │   Cookie     │
                    └──────────────┘
```

### Configuration Required

To enable authentication, update the following in `src/admin.html`:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

See `AUTH_SETUP.md` for detailed setup instructions.

## Code Style

- **Language**: Comments and UI text in Chinese; variable names in English
- **Indentation**: 4 spaces
- **Quotes**: Mixed single and double quotes (inconsistent)
- **Semicolons**: Optional, mostly omitted
- **Naming**: camelCase for variables/functions, PascalCase for classes

## External Dependencies (CDN)

These are loaded via CDN in specific pages:

```html
<!-- jQuery 4.0.0 -->
<script src="https://code.jquery.com/jquery-4.0.0.min.js"></script>

<!-- Supabase JavaScript Client -->
<script src="https://unpkg.com/@supabase/supabase-js@2"></script>
```

## Future Development Notes

- "随如🖊" (Blog) and "投喂" (Donation) sections are marked incomplete
- Authentication could be extended with:
  - Password reset functionality
  - OAuth providers (Google, GitHub)
  - User profile editing
  - Role-based access control
- Hash router could be extracted to a separate library
- Consider adding service worker for offline support
- Mobile responsiveness could be improved
