const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const WebSocket = require('ws');
const http = require('http');
const { spawn } = require('child_process');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const DB_HOST = process.env.DB_HOST || 'db';
const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'smartcam';

async function getPool(){
  return mysql.createPool({host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASSWORD, database: DB_NAME, waitForConnections: true, connectionLimit: 10});
}

app.get('/api/cameras', async (req, res) => {
  const pool = await getPool();
  const [rows] = await pool.query('SELECT id, Ip_address, Username, Password, Last_connexion, Status, Model FROM camera');
  res.json(rows);
});

app.post('/api/cameras', async (req, res) => {
  const { Ip_address, Username, Password, Status, Model } = req.body;
  const pool = await getPool();
  const [result] = await pool.query(
    'INSERT INTO camera (Ip_address, Username, Password, Last_connexion, Status, Model) VALUES (?, ?, ?, NOW(), ?, ?)',
    [Ip_address, Username, Password, Status || 'inactive', Model]
  );
  res.json({ ok: true, id: result.insertId });
});

app.put('/api/cameras/:id', async (req, res) => {
  const id = req.params.id;
  const { Ip_address, Username, Password, Status, Model } = req.body;
  const pool = await getPool();
  await pool.query(
    'UPDATE camera SET Ip_address=?, Username=?, Password=?, Status=?, Model=?, Last_connexion=NOW() WHERE id=?',
    [Ip_address, Username, Password, Status, Model, id]
  );
  res.json({ ok: true });
});

app.delete('/api/cameras/:id', async (req, res) => {
  const id = req.params.id;
  const pool = await getPool();
  await pool.query('DELETE FROM camera WHERE id=?', [id]);
  res.json({ ok: true });
});

app.get('/stream/:cameraId', async (req, res) => {
  const cameraId = req.params.cameraId;
  
  try {
    const pool = await getPool();
    const [rows] = await pool.query('SELECT * FROM camera WHERE id = ?', [cameraId]);
    
    if (rows.length === 0) {
      return res.status(404).send('Camera not found');
    }
    
    const camera = rows[0];
    const rtspUrl = `rtsp://${camera.Username}:${camera.Password}@${camera.Ip_address}/live0`;
    
    console.log(`Starting stream for camera ${cameraId}: ${rtspUrl}`);
    
    res.writeHead(200, {
      'Content-Type': 'multipart/x-mixed-replace; boundary=frame',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no'
    });
    
    let isStreaming = true;
    let frameBuffer = Buffer.alloc(0);
    
    const ffmpegArgs = [
      '-rtsp_transport', 'tcp',
      '-i', rtspUrl,
      '-f', 'mjpeg',
      '-q:v', '3',
      '-r', '10',
      '-s', '640x480',
      '-'
    ];
    
    console.log('Starting ffmpeg with args:', ffmpegArgs.join(' '));
    
    const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);
    
    ffmpegProcess.stdout.on('data', (chunk) => {
      if (!isStreaming || res.destroyed) return;
      
      frameBuffer = Buffer.concat([frameBuffer, chunk]);
      let startIndex = frameBuffer.indexOf(Buffer.from([0xFF, 0xD8]));
      let endIndex = frameBuffer.indexOf(Buffer.from([0xFF, 0xD9]), startIndex);
      
      while (startIndex !== -1 && endIndex !== -1) {
        const jpeg = frameBuffer.slice(startIndex, endIndex + 2);
        const headers = Buffer.from(
          `--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${jpeg.length}\r\n\r\n`
        );
        try {
          res.write(headers);
          res.write(jpeg);
          res.write("\r\n");
        } catch (writeError) {
          console.error('Write error:', writeError.message);
          isStreaming = false;
          break;
        }
        frameBuffer = frameBuffer.slice(endIndex + 2);
        startIndex = frameBuffer.indexOf(Buffer.from([0xFF, 0xD8]));
        endIndex = frameBuffer.indexOf(Buffer.from([0xFF, 0xD9]), startIndex);
      }
    });
    
    ffmpegProcess.stderr.on('data', (data) => {
      console.log('FFmpeg stderr:', data.toString());
    });
    
    ffmpegProcess.on('error', (err) => {
      console.error('FFmpeg process error:', err.message);
      isStreaming = false;
      if (!res.headersSent) {
        res.status(500).send('Stream error');
      } else {
        res.end();
      }
    });
    
    ffmpegProcess.on('close', (code) => {
      console.log('FFmpeg process closed with code:', code);
      isStreaming = false;
      res.end();
    });
    
    req.on('close', () => {
      console.log('Client disconnected from camera', cameraId);
      isStreaming = false;
      ffmpegProcess.kill();
    });
    
    req.on('aborted', () => {
      console.log('Client aborted connection for camera', cameraId);
      isStreaming = false;
      ffmpegProcess.kill();
    });
    
      
  } catch (error) {
    console.error('Stream error:', error);
    if (!res.headersSent) {
      res.status(500).send('Stream error');
    }
  }
});

app.get('/api/alerts', async (req, res) => {
  const pool = await getPool();
  const [rows] = await pool.query('SELECT ra.id, ra.fk_image, ra.fk_analyse, ra.result, ra.human_verification, ra.is_resolved, ra.date, i.URI FROM resultat_analyse ra JOIN image i ON ra.fk_image=i.id ORDER BY ra.date DESC LIMIT 200');
  res.json(rows);
});

app.post('/api/alerts/:id/verify', async (req, res) => {
  const id = req.params.id;
  const { human_verification, is_resolved } = req.body;
  const pool = await getPool();
  await pool.query('UPDATE resultat_analyse SET human_verification=?, is_resolved=? WHERE id=?', [human_verification ? 1:0, is_resolved ? 1:0, id]);
  res.json({ok: true});
});

app.use('/', express.static(path.join(__dirname, 'static')));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'start_stream' && data.cameraId) {
        const cameraId = data.cameraId;
        
        const pool = await getPool();
        const [rows] = await pool.query('SELECT * FROM camera WHERE id = ?', [cameraId]);
        
        if (rows.length === 0) {
          ws.send(JSON.stringify({ type: 'error', message: 'Camera not found' }));
          return;
        }
        
        const camera = rows[0];
        const rtspUrl = `rtsp://${camera.Username}:${camera.Password}@${camera.Ip_address}/live0`;
        
        console.log(`WebSocket stream started for camera ${cameraId}: ${rtspUrl}`);
        const ffmpegProcess = ffmpeg(rtspUrl)
          .inputOptions([
            '-rtsp_transport', 'tcp',
            '-rtsp_flags', 'prefer_tcp',
            '-rw_timeout', '5000000'
          ])
          .outputOptions([
            '-f', 'mjpeg',
            '-q:v', '5',
            '-r', '15',
            '-s', '640x480',
            '-bufsize', '32k'
          ])
          .format('mjpeg')
          .on('start', (commandLine) => {
            console.log('WebSocket FFmpeg started:', commandLine);
          })
          .on('error', (err) => {
            console.error('WebSocket FFmpeg error:', err.message);
            ws.send(JSON.stringify({ type: 'error', message: 'Stream error' }));
          });
        
        let frameBuffer = Buffer.alloc(0);
        
        ffmpegProcess.on('data', (chunk) => {
          if (ws.readyState === WebSocket.OPEN) {
            frameBuffer = Buffer.concat([frameBuffer, chunk]);
            
            let startIndex = frameBuffer.indexOf(Buffer.from([0xFF, 0xD8]));
            let endIndex = frameBuffer.indexOf(Buffer.from([0xFF, 0xD9]), startIndex);
            
            while (startIndex !== -1 && endIndex !== -1) {
              const jpegFrame = frameBuffer.slice(startIndex, endIndex + 2);
              
              ws.send(JSON.stringify({
                type: 'frame',
                data: jpegFrame.toString('base64'),
                timestamp: Date.now()
              }));
              
              frameBuffer = frameBuffer.slice(endIndex + 2);
              startIndex = frameBuffer.indexOf(Buffer.from([0xFF, 0xD8]));
              endIndex = frameBuffer.indexOf(Buffer.from([0xFF, 0xD9]), startIndex);
            }
          }
        });
        
        ws.ffmpegProcess = ffmpegProcess;
        ws.send(JSON.stringify({ type: 'stream_started', cameraId }));
        ffmpegProcess.stream();
      }
      
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket connection closed');
    if (ws.ffmpegProcess) {
      ws.ffmpegProcess.kill('SIGTERM');
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    if (ws.ffmpegProcess) {
      ws.ffmpegProcess.kill('SIGTERM');
    }
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => console.log('Server listening on', port));
