import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path, { dirname } from 'path';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { AppState } from './types';
import { fileURLToPath } from 'url';
import fs from 'fs'; // Import fs module

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3003;

// Helper function for deep merging objects
function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const output = { ...target };

  if (target && typeof target === 'object' && source && typeof source === 'object') {
    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) &&
          target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
        output[key] = deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    });
  }
  return output;
}

// Path to metadata.json
const METADATA_FILE_PATH = path.join(__dirname, '..', 'metadata.json');

// INITIAL_STATE will we take from App.tsx and put it here or in a separate file
const INITIAL_STATE: AppState = {
  blue: {
    name: 'MANSABA A',
    logo: '',
    picks: ['', '', '', '', ''],
    pNames: ['PLAYER 1', 'PLAYER 2', 'PLAYER 3', 'PLAYER 4', 'PLAYER 5'],
    bans: ['', '', '', '', '']
  },
  red: {
    name: 'MANSABA B',
    logo: '',
    picks: ['', '', '', '', ''],
    pNames: ['PLAYER 1', 'PLAYER 2', 'PLAYER 3', 'PLAYER 4', 'PLAYER 5'],
    bans: ['', '', '', '', '']
  },
  game: {
    phase: 'BANNING',
    timer: 30,
    turn: 'blue',
    isIntroActive: false,
    isGameControlEnabled: true
  },
  ads: ['AD 1', 'AD 2', 'AD 3'],
  adConfig: {
    type: 'images',
    effect: 'scroll',
    text: 'WELCOME TO THE TOURNAMENT! ENJOY THE MATCH!',
    speed: 25
  },
  assets: {
    union1: '',
    union2: '',
    logo: '',
    gradient: ''
  }
};

let appState: AppState = { ...INITIAL_STATE };

// Load metadata.json and merge with INITIAL_STATE
try {
  if (fs.existsSync(METADATA_FILE_PATH)) {
    const metadataContent = fs.readFileSync(METADATA_FILE_PATH, 'utf8');
    const metadata = JSON.parse(metadataContent);
    appState = deepMerge(INITIAL_STATE, metadata) as AppState;
    console.log('metadata.json loaded and merged with initial state.');
  }
} catch (error) {
  console.error('Error loading or parsing metadata.json:', error);
}

app.use(cors());

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'public', 'upload'));
  },
  filename: (req, file, cb) => {
    const newFilename = Date.now() + '-' + file.originalname;
    cb(null, newFilename);
  }
});

const upload = multer({ storage: storage });

// Endpoint to reset state
app.post('/reset', (req, res) => {
  console.log('State has been reset');
  appState = { ...INITIAL_STATE };
  // Broadcast new state after reset
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(appState));
    }
  });
  res.status(200).send({ message: 'State reset successfully.' });
});


// Create the upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  
  const filePath = `/upload/${req.file.filename}`;

  // Update appState with the new file path
  // This is an example, you should adjust it to your state structure
  const { field, team, index } = req.body;
  
  if (field === 'logo' && (team === 'blue' || team === 'red')) {
      appState[team].logo = filePath;
  } else if (field === 'asset_logo') {
      appState.assets.logo = filePath;
  }
  // Add other logic if needed, eg for banners, etc.

  // Broadcast the updated state to all clients
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(appState));
    }
  });

  res.send({
    message: 'File uploaded and state updated.',
    filePath: filePath
  });
});

// Serve the uploaded files
app.use('/upload', express.static(path.join(__dirname, '..', 'public', 'upload')));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Send current state to newly connected client
  ws.send(JSON.stringify(appState));

  ws.on('message', (message) => {
    try {
      const receivedState = JSON.parse(message.toString());
      // Update server state
      appState = receivedState;
      
      // Broadcast new state to all clients except sender
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(appState));
        }
      });
    } catch (e) {
      console.error('Failed to parse message or broadcast:', e);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});


server.listen(port, () => {
  console.log(`Server with WebSocket is running on http://localhost:${port}`);
});
