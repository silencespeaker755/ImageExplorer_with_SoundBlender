// import * as Speech from 'expo-speech';
import Tts from 'react-native-tts';
import audioBuffer from './audioBuffer';

// wrapper class of using expo-speech
class BackgroundWrapper {
  constructor() {
    this.requester = -1;
    this.canRepeat = true;
    this.timer = null;
  }

  // speak out content
  // if requester changes, speak immediately
  // if requester remains the same, only repeat after repeatTime
  speak = async (
    label,
    speaking,
    pan = 0,
    volume = 1,
    setSpeaking = () => {},
  ) => {
    // let speaking = await Speech.isSpeakingAsync();
    if (speaking) {
      audioBuffer[label].setVolume(volume);
      audioBuffer[label].setPan(pan);
    } else if (!speaking && this.canRepeat) {
      setSpeaking(true);
      audioBuffer[label]
        .setVolume(volume)
        .setPan(pan)
        .play(success => {
          if (success) {
            setSpeaking(false);
          } else {
            console.log('Sound did not play');
          }
        });
    }
  };
}

export default BackgroundWrapper;
