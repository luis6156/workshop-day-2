# Frontend Application

React + TypeScript frontend for the Cloud Native Demo application.

## Features

- ✅ Real-time WebSocket communication
- ✅ Server-Sent Events (SSE) streaming
- ✅ Notification management
- ✅ Beautiful, responsive UI
- ✅ TypeScript for type safety
- ✅ Vite for fast development

## Tech Stack

- **React 18**: UI library
- **TypeScript**: Type safety
- **Vite**: Build tool
- **Socket.io Client**: WebSocket communication
- **Axios**: HTTP client
- **React Toastify**: Toast notifications

## Installation

```bash
npm install
```

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will be available at http://localhost:3000

## Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:3001
```

## Features Overview

### 1. Create Notifications
- Send notifications with different types (info, success, warning, error)
- Notifications are broadcasted via WebSocket and SSE

### 2. WebSocket Demo
- Real-time bidirectional communication
- Send messages and receive responses
- Ping/pong functionality
- Connection status indicator

### 3. Server-Sent Events (SSE)
- One-way streaming from server to client
- Auto-scrolling event list
- Connect/disconnect controls
- Event history

### 4. Notification History
- View all past notifications (cached in Redis)
- Filterable and refreshable
- Metadata inspection

## Project Structure

```
src/
├── components/         # React components
│   ├── NotificationForm.tsx
│   ├── NotificationList.tsx
│   ├── SSEDemo.tsx
│   ├── StatusIndicator.tsx
│   └── WebSocketDemo.tsx
├── App.tsx            # Main application
├── main.tsx           # Entry point
└── index.css          # Global styles
```

## Building for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

## Docker

```bash
# Build image
docker build -t demo-frontend .

# Run container
docker run -p 3000:80 demo-frontend
```

## License

MIT
