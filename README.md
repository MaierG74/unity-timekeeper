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
   Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Download facial recognition models:
   Create a `public/models` directory and download the face-api.js models from:
   https://github.com/justadudewhohacks/face-api.js/tree/master/weights

## Development

Start the development server:

```
npm run electron:dev
```

This will launch both the Vite dev server and Electron app in development mode.

## Building for Production

Build the application for production:

```
npm run electron:build
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
