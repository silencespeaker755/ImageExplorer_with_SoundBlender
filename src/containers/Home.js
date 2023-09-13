import {FlatList, StyleSheet, StatusBar, Text, View} from 'react-native';
import React from 'react';
import data from '../../input/data.js';
import GestureRecognizer, {swipeDirections} from 'react-native-swipe-gestures';
import Sound from 'react-native-sound';
import DoubleClick from './ClickHandler/DoubleClick';
import Tts from 'react-native-tts';
import audioBuffer from '../utils/audioBuffer.js';
// import * as Speech from 'expo-speech';

// border for selected object
const hasBorder = {
  borderStyle: 'dotted',
  borderWidth: 1,
  borderRadius: 1,
};

// border for not selected object
const noBorder = {
  borderStyle: 'dotted',
  borderWidth: 0,
  borderRadius: 0,
};

class Home extends React.Component {
  constructor() {
    super();
    this.state = {
      selectedId: -1,
      itemList: [
        {
          id: -1,
          name: '(Choose a image)',
        },
      ],
    };
    Tts.setDefaultLanguage('en-US');
    Tts.setDefaultRate(0.54);
    Tts.addEventListener('tts-start', event => {
      // this.setState({speaking: true});
    });
    Tts.addEventListener('tts-finish', event => {
      // this.setState({speaking: false});
    });

    // construct list of images from data
    for (var i in data.data) {
      this.state.itemList.push({
        id: i,
        name: data.data[i].name,
      });
    }

    // binding
    this.renderItem = this.renderItem.bind(this);
    this.onSwipe = this.onSwipe.bind(this);
    this.onDoubleClick = this.onDoubleClick.bind(this);
  }

  async componentDidMount() {
    StatusBar.setHidden(true);
    // const availableVoices = await Speech.getAvailableVoicesAsync();
    // console.log(availableVoices);
    Sound.setCategory('Playback');
    audioBuffer['forest_ambience'] = new Sound(
      'forest_ambience.mp3',
      Sound.MAIN_BUNDLE,
      error => {
        if (error) {
          console.log('failed to load the sound', error);
          return;
        }
      },
    );
    audioBuffer['ambience'] = new Sound(
      'ambience.mp3',
      Sound.MAIN_BUNDLE,
      error => {
        if (error) {
          console.log('failed to load the sound', error);
          return;
        }
      },
    );
    // console.log('announcement' + ' pan: ' + this.hello.getNumberOfChannels());
    data.data[0].json.maskrcnn.forEach(element => {
      audioBuffer[element.label] = new Sound(
        `${element.label}.mp3`,
        Sound.MAIN_BUNDLE,
        error => {
          if (error) {
            console.log('failed to load the sound', error);
            return;
          }
        },
      );
      // audioBuffer[element.label].setPan(element.pan);
    });
    data.data[0].json.captions.forEach(element => {
      audioBuffer[element.label] = new Sound(
        `${element.label}.mp3`,
        Sound.MAIN_BUNDLE,
        error => {
          if (error) {
            console.log('failed to load the sound', error);
            return;
          }
        },
      );
      // audioBuffer[element.label].setPan(element.pan);
    });
    // Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    // setInterval(() => {
    //   console.log("testing");
    //   Speech.speak(`I am a test`);
    // }, 2000);
  }

  // increment or decrement selected index on swiping
  onSwipe(direction) {
    const {SWIPE_UP, SWIPE_DOWN, SWIPE_LEFT, SWIPE_RIGHT} = swipeDirections;
    switch (direction) {
      case SWIPE_LEFT:
        if (this.state.selectedId > -1) {
          this.setState({selectedId: this.state.selectedId - 1});
        }
        break;
      case SWIPE_RIGHT:
        if (this.state.selectedId < data.data.length - 1) {
          this.setState({selectedId: this.state.selectedId + 1});
        } else {
          // at the end of the list
          Tts.speak('end of the list');
          // audioBuffer['bottle'].setPan(-1).play(success => {
          //   if (success) {
          //     console.log('In play() function callback');
          //   } else {
          //     console.log('Sound did not play');
          //   }
          // });
        }
        break;
    }
  }

  // navigate to first layer
  onDoubleClick() {
    console.log('double click');
    if (this.state.selectedId != -1) {
      this.props.navigation.navigate('ImageLayer1', {
        index: this.state.selectedId,
        changePosition: true,
      });
    }
  }

  // render item in the list
  renderItem(item) {
    // if this item is selected, give it a border
    const border = item.item.id == this.state.selectedId ? hasBorder : noBorder;

    return (
      <View style={[styles.item, border]}>
        <Text style={styles.title}>{item.item.name}</Text>
      </View>
    );
  }

  render() {
    Tts.speak(this.state.itemList[this.state.selectedId + 1].name);

    // config for swiping
    const config = {
      velocityThreshold: 0.3,
      directionalOffsetThreshold: 80,
    };

    return (
      <View style={styles.container}>
        <GestureRecognizer
          onSwipe={(direction, state) => this.onSwipe(direction)}
          config={config}>
          <DoubleClick
            style={styles.container}
            timeout={300}
            onDoubleClick={this.onDoubleClick}>
            <FlatList
              data={this.state.itemList}
              renderItem={this.renderItem}
              keyExtractor={item => item.id}
              extraData={this.state.selectedId}
              contentContainerStyle={styles.container}
            />
          </DoubleClick>
        </GestureRecognizer>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  item: {
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 16,
    color: 'black',
  },
});

export default Home;
