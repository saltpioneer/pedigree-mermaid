# Pedigree Chart AI Editor

A full-stack TypeScript application that converts natural language family relationship descriptions into interactive, editable pedigree charts using AI (OpenAI), Mermaid syntax parsing, and React Flow.

## Features

- **Natural Language Input**: Describe family relationships in plain text (e.g., "John and Mary have a daughter Sarah. Sarah married Tim. They have two sons, Alex and Ben.")
- **AI-Powered Conversion**: Uses OpenAI API to convert text to Mermaid flowchart syntax
- **Interactive Node Graph**: Editable React Flow visualization with drag-and-drop support
- **Node Editing**: Edit node names, delete nodes, duplicate nodes, add children
- **Auto Layout**: Automatic graph layout using Dagre
- **Export Options**: Export pedigree charts as JSON or PNG
- **Dark Mode**: Toggle between light and dark themes
- **Keyboard Shortcuts**: Delete key to remove selected nodes, Escape to deselect
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**:
  - Vite + React + TypeScript
  - TailwindCSS for styling
  - React Flow for graph visualization
  - Zustand for state management
  - html2canvas for PNG export

- **Backend**:
  - Express.js server
  - OpenAI API integration
  - Mermaid parser (@mermaid-js/parser)
  - Dagre for automatic layout

## Prerequisites

- Node.js 18+ and npm
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pedigree-mermaid
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

Alternatively, you can set the environment variable when running:
```bash
OPENAI_API_KEY=your_key npm run dev
```

## Running the Application

### Development Mode

The application runs both the frontend (Vite) and backend (Express) servers concurrently:

```bash
npm run dev
```

This will start:
- Frontend server on `http://localhost:5173`
- Backend API server on `http://localhost:3001`

The Vite dev server is configured to proxy `/api/*` requests to the Express server.

### Individual Servers

You can also run the servers separately:

```bash
# Terminal 1: Start backend server
npm run dev:server

# Terminal 2: Start frontend server
npm run dev:client
```

## Usage

1. **Input Family Tree Text**:
   - Enter a natural language description of family relationships in the left panel
   - Example: "John and Mary have a daughter Sarah. Sarah married Tim. They have two sons, Alex and Ben."

2. **Convert to Family Tree**:
   - Click the "Convert to Family Tree" button
   - The text is sent to OpenAI API, converted to Mermaid syntax, parsed, and displayed as an interactive graph

3. **Edit the Graph**:
   - Click on any node to select it
   - Use the sidebar (right panel) to edit node names, add children, duplicate, or delete nodes
   - Drag nodes to reposition them
   - Use the "Layout" button to automatically reorganize the graph

4. **Export**:
   - Click "Export JSON" to download the graph data as JSON
   - Click "Export PNG" to download a PNG image of the graph

5. **Keyboard Shortcuts**:
   - `Delete` or `Backspace`: Delete selected node
   - `Escape`: Deselect current node

## Project Structure

```
pedigree-mermaid/
├── src/
│   ├── components/          # React components
│   │   ├── InputPanel.tsx   # Text input and conversion UI
│   │   ├── FlowRenderer.tsx # React Flow graph visualization
│   │   └── NodeEditorSidebar.tsx # Node editing sidebar
│   ├── lib/                 # Utility functions
│   │   ├── llm.ts           # OpenAI API integration (client-side, unused)
│   │   ├── mermaidToReactFlow.ts # Mermaid to React Flow conversion
│   │   ├── layout.ts        # Dagre layout engine
│   │   └── parseFamilyPrompt.ts # Input validation and preprocessing
│   ├── state/               # State management
│   │   └── useFlowStore.ts  # Zustand store for nodes and edges
│   ├── server/              # Express backend
│   │   ├── index.ts         # Express server setup
│   │   └── api/
│   │       └── convert.ts   # /api/convert endpoint
│   ├── pages/               # Page components
│   │   └── Home.tsx         # Main application page
│   ├── App.tsx              # Root component
│   └── main.tsx             # Entry point
├── vite.config.ts           # Vite configuration with proxy
├── tailwind.config.js       # TailwindCSS configuration
├── package.json             # Dependencies and scripts
└── README.md                # This file
```

## Architecture

### Data Flow

1. **User Input** → InputPanel component
2. **API Request** → `/api/convert` endpoint (Express server)
3. **OpenAI API** → Converts text to Mermaid syntax
4. **Mermaid Parser** → Extracts nodes and edges from Mermaid code
5. **React Flow Conversion** → Converts to React Flow format
6. **Layout Engine** → Applies automatic layout with Dagre
7. **Zustand Store** → Updates application state
8. **UI Update** → FlowRenderer displays the graph

### Key Components

- **InputPanel**: Handles user input, API calls, and error display
- **FlowRenderer**: Renders the React Flow graph with controls, minimap, and layout button
- **NodeEditorSidebar**: Provides node editing capabilities (rename, delete, duplicate, add child)
- **Home**: Main layout component that coordinates all pieces

## Configuration

### Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `PORT`: Backend server port (default: 3001)

### Vite Proxy

The Vite dev server proxies `/api/*` requests to the Express server on port 3001. This is configured in `vite.config.ts`.

## Building for Production

```bash
npm run build
```

This will:
- Compile TypeScript
- Build the frontend with Vite
- Output to `dist/` directory

To preview the production build:

```bash
npm run preview
```

## Troubleshooting

### API Key Not Working

- Ensure your `.env` file is in the root directory
- Check that `OPENAI_API_KEY` is set correctly
- Restart the dev server after adding the API key

### Parser Errors

- The Mermaid parser includes fallback text parsing if AST parsing fails
- Check the browser console for detailed error messages
- Ensure the OpenAI API returns valid Mermaid syntax

### Port Conflicts

- If port 5173 or 3001 are in use, you can change them:
  - Frontend: Update `vite.config.ts` server port
  - Backend: Set `PORT` environment variable or update `src/server/index.ts`

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
