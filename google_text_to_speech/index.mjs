import RNFS from 'fs';
import fetch from 'cross-fetch';
import data from '../input/mr_environment/environment.json' assert {type: 'json'};

const createRequest = text => ({
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    input: {
      text: text,
    },
    // voice: {
    //   languageCode: 'en-US',
    //   name: 'en-US-Standard-A',
    //   ssmlGender: 'MALE',
    // },
    voice: {
      languageCode: 'en-US',
      name: 'en-US-Standard-C',
      ssmlGender: 'FEMALE',
    },
    audioConfig: {
      audioEncoding: 'MP3',
      pitch: 1,
      // speakingRate: 1.6,
      speakingRate: 1.3,
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

// speech(
//   'Two trees side by side with a digital appearance that is made by several virtual cubes',
//   './assets/center_tree_environment.mp3',
// );

// speech(
//   'A tree with a digital appearance that is made by several virtual cubes, and with some red cubes as decoration',
//   './assets/left_tree_environment.mp3',
// );

// speech(
//   'A tree with a digital appearance that is made by several virtual cubes',
//   './assets/right_tree_environment.mp3',
// );

// speech(
//   'Two trees side by side with a digital appearance that is made by several virtual cubes',
//   './assets/center_tree.mp3',
// );

// speech(
//   'A tree with a digital appearance that is made by several virtual cubes, and with some red cubes as decoration',
//   './assets/left_tree.mp3',
// );

// speech(
//   'A tree with a digital appearance that is made by several virtual cubes',
//   './assets/right_tree.mp3',
// );

// speech('Hayward street goes left', 'left.mp3');
// speech('Hayward street goes right', 'right.mp3');

speech('Someone was talking just now.', 'speech.mp3');
