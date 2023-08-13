// import * as Speech from 'expo-speech';
import Tts from 'react-native-tts';
import audioBuffer from './audioBuffer';

// wrapper class of using expo-speech
class SpeechWrapper {
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
    requester = -1,
    repeatTime = 500,
    previousAudio = null,
    pan = 0,
    setAudio = () => {},
    setSpeaking = () => {},
    isFile = false,
  ) => {
    // let speaking = await Speech.isSpeakingAsync();
    if (requester != this.requester) {
      clearTimeout(this.timer);
      this.requester = requester;
      this.canRepeat = false;
      this.timer = setTimeout(() => {
        this.canRepeat = true;
      }, repeatTime);
      if (isFile) {
        if (speaking && previousAudio) {
          audioBuffer[previousAudio].stop(() => {
            setSpeaking(true);
            setAudio(label);
            audioBuffer[label].setPan(pan).play(success => {
              if (success) {
                setAudio(null);
                setSpeaking(false);
              } else {
                console.log('Sound did not play');
              }
            });
          });
        } else {
          Tts.stop();
          setAudio(label);
          audioBuffer[label].setPan(pan).play(success => {
            if (success) {
              setAudio(null);
              setSpeaking(false);
            } else {
              console.log('Sound did not play');
            }
          });
        }
      } else {
        if (previousAudio) {
          audioBuffer[previousAudio].stop(() => {
            setAudio(null);
            setSpeaking(true);
            Tts.speak(label);
          });
        } else {
          Tts.stop();
          setSpeaking(true);
          Tts.speak(label);
        }
      }
    } else if (!speaking && this.canRepeat) {
      clearTimeout(this.timer);
      this.canRepeat = false;
      this.timer = setTimeout(() => {
        this.canRepeat = true;
      }, repeatTime);
      if (isFile) {
        setSpeaking(true);
        setAudio(label);
        audioBuffer[label].setPan(pan).play(success => {
          if (success) {
            setAudio(null);
            setSpeaking(false);
          } else {
            console.log('Sound did not play');
          }
        });
      } else {
        setAudio(null);
        Tts.speak(label);
      }
    }
  };
}

export default SpeechWrapper;
