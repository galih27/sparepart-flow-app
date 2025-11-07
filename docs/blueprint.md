# **App Name**: Sparepart Flow

## Core Features:

- Login/Registration: Secure login and registration functionality using data from the 'tb_users' Google Sheet.
- Dashboard: Landing page after login displaying a welcome message personalized with the user's name.
- Report Stock Management: View, search, import, export and edit spare part inventory data sourced from the 'tb_inventory' Google Sheet, including real-time updates.
- Daily Bon Management: Create, filter, and manage daily spare part transactions using data from the 'tb_dailybon' Google Sheet. Parts descriptions are autocompleted with data sourced from tb_inventory. Provides pagination.
- Bon PDS Management: Manage spare part transfers to different sites/branches using data from the 'tb_bonpds' Google Sheet. Provides pagination.
- MSK Management: Track incoming spare part transactions from different sites/branches and the head office using data from the 'tb_msk' Google Sheet. Provides pagination.
- User Role Management: Manage user roles and permissions to control access to different menu options, based on data in the 'tb_users' Google Sheet.

## Style Guidelines:

- Primary color: Strong blue (#29ABE2), offering both pleasantness and signaling authority.
- Background color: Light grayish blue (#E0F7FA), subtly desaturated to keep the focus on the data.
- Accent color: Muted teal (#26A69A) for interactive elements and highlights.
- Body and headline font: 'PT Sans', sans-serif font offering a mix of modern precision and approachability.
- Clean and consistent icons from a Bootstrap 5-compatible library (e.g., Bootstrap Icons) to represent actions and categories.
- Fluid layout with a responsive design, expandable sidebar, top search bar, and user dropdown menu.
- Subtle transitions and animations for menu expansions, modal appearances, and data updates.