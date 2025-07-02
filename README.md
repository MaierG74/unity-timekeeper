# Unity Timekeeper

Facial recognition time tracking application built with Electron, React, and Supabase.

## Features

- **Facial Recognition**: Clock in/out using facial recognition technology
- **Multiple Break Types**: Support for tea breaks, lunch breaks, and more
- **Staff Enrollment**: Simple process to enroll staff members for facial recognition
- **Secure Storage**: All data securely stored in Supabase database
- **Offline Support**: Continue functioning even with temporary internet outages

## Prerequisites

- Node.js >= 18
- npm >= 8
- Git
- Webcam-equipped computer
- Supabase account with properly configured database

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/unity-timekeeper.git
   cd unity-timekeeper
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the root directory (ignored by Git) with the following variables:
   ```bash
# .env (do NOT commit)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Download facial recognition models:
   Create a `public/models` directory and download the face-api.js models from:
   https://github.com/justadudewhohacks/face-api.js/tree/master/weights

## Development

Start the development server locally:

```bash
npm run dev
```

This will launch both the Vite dev server and Electron app in development mode.

## Building for Production

Build the application for production (static web):

```bash
npm run build
```

This will create distributable packages in the `dist-electron` directory.

## Database Schema

The application uses the following database tables:

1. `facial_profiles` - Stores facial recognition data for each staff member
2. `time_clock_events` - Records individual clock in/out events
3. `time_segments` - Tracks matched clock in/out pairs
4. `time_daily_summary` - Provides daily summaries of work hours

## License

[MIT](LICENSE)

## Deployment

This project is configured for continuous deployment to Netlify from the `main` branch.

### Workflow

1.  **Push to `main`**: Any commit pushed to the `main` branch on GitHub will automatically trigger a new build and deployment on Netlify.
2.  **Environment Variables**: Supabase keys (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`) are managed as environment variables in the Netlify site settings. They are not stored in the repository.
3.  **Build Settings**: The site is built using `npm run build` and the output directory is `dist`.
