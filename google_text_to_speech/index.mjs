import RNFS from 'fs';
import fetch from 'cross-fetch';
import data from '../input/mr_table/table.json' assert {type: 'json'};

const createRequest = text => ({
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    input: {
      text: text,
    },
    voice: {
      languageCode: 'en-US',
      name: 'en-US-Standard-A',
      ssmlGender: 'MALE',
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 1.5,
    },
  }),
  method: 'POST',
});

const createFile = (path, data) => {
  try {
    return RNFS.writeFileSync(path, data, 'base64');
  } catch (err) {
    console.warn(err);
  }

  return null;
};

const speech = async (text, path = `./voiceUPUPUP.mp3`) => {
  // TODO: Store key in background config files
  const key = 'AIzaSyBIy0SAXuXjbGpz9B2lZu-4wC_7ShSl7Ak';
  const address = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`;
  const payload = createRequest(text);
  try {
    const response = await fetch(`${address}`, payload);
    const result = await response.json();
    createFile(path, result.audioContent);
  } catch (err) {
    console.warn(err);
  }
};

// data.captions.forEach(async element => {
//   console.log(element.label);
//   await speech(element.caption, `./assets/${element.label}.mp3`);
// });

// data.maskrcnn.forEach(async element => {
//   console.log(element.label);
//   await speech(element.caption, `./assets/${element.label}.mp3`);
// });

speech('background', './assets/background.mp3');
