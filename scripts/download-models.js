const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const MODELS_DIR = path.join(__dirname, '..', 'public', 'models');
const MODELS_REPO = 'https://github.com/justadudewhohacks/face-api.js/raw/master/weights';

// Models to download
const MODELS = [
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model-shard1',
  'ssd_mobilenetv1_model-shard2',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2'
];

// Create models directory if it doesn't exist
if (!fs.existsSync(MODELS_DIR)) {
  console.log(`Creating models directory: ${MODELS_DIR}`);
  fs.mkdirSync(MODELS_DIR, { recursive: true });
}

// Download a file
const downloadFile = (file, dest) => {
  return new Promise((resolve, reject) => {
    const url = `${MODELS_REPO}/${file}`;
    const filePath = path.join(dest, file);
    
    console.log(`Downloading ${url} to ${filePath}`);
    
    const fileStream = fs.createWriteStream(filePath);
    
    const request = https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const newUrl = response.headers.location;
        console.log(`Redirected to ${newUrl}`);
        
        // Follow the redirect
        https.get(newUrl, (redirectResponse) => {
          if (redirectResponse.statusCode !== 200) {
            reject(new Error(`Failed to download ${url} (redirected): ${redirectResponse.statusCode}`));
            return;
          }
          
          redirectResponse.pipe(fileStream);
          
          fileStream.on('finish', () => {
            fileStream.close();
            resolve();
          });
        }).on('error', (err) => {
          fs.unlink(filePath, () => {});
          reject(err);
        });
        
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {});
      reject(err);
    });
  });
};

// Alternative: Create placeholder model files
const createPlaceholderModels = () => {
  console.log('Creating placeholder model files...');
  
  MODELS.forEach(file => {
    const filePath = path.join(MODELS_DIR, file);
    fs.writeFileSync(filePath, '{}');
    console.log(`Created placeholder file: ${filePath}`);
  });
  
  console.log('Placeholder model files created. Replace with actual models before using in production.');
};

// Main function to download all models
const downloadModels = async () => {
  console.log('Starting download of face-api.js models...');
  
  try {
    const downloadPromises = MODELS.map(model => downloadFile(model, MODELS_DIR));
    await Promise.all(downloadPromises);
    
    console.log('All models downloaded successfully!');
  } catch (error) {
    console.error('Error downloading models:', error);
    console.log('Creating placeholder files instead...');
    createPlaceholderModels();
  }
};

// Run the download
downloadModels(); 