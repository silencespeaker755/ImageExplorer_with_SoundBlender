import {
  Image,
  StyleSheet,
  StatusBar,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import MasonryList from '@react-native-seoul/masonry-list';
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
      itemList: [],
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
        url: data.data[i].origin,
      });
    }

    // binding
    this.renderItem = this.renderItem.bind(this);
    this.handleImagePress = this.handleImagePress.bind(this);
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
    for (var i in data.data) {
      // console.log('announcement' + ' pan: ' + this.hello.getNumberOfChannels());
      data.data[i].json.maskrcnn.forEach(element => {
        audioBuffer[`${i}_${element.label}`] = new Sound(
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
      data.data[i].json.captions.forEach(element => {
        audioBuffer[`${i}_${element.label}`] = new Sound(
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
    }
    // Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    // setInterval(() => {
    //   console.log("testing");
    //   Speech.speak(`I am a test`);
    // }, 2000);
  }

  // navigate to first layer
  handleImagePress(id) {
    this.props.navigation.navigate('ImageLayer1', {
      index: id,
      changePosition: true,
    });
  }

  // render item in the list
  renderItem({item}) {
    // if this item is selected, give it a border
    // const border = item.id == this.state.selectedId ? hasBorder : noBorder;

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => this.handleImagePress(item.id)}>
        <Image
          source={item.url}
          style={{width: 300, height: 200, borderRadius: 10}}
        />
      </TouchableOpacity>
    );
  }

  render() {
    // Tts.speak(this.state.itemList[this.state.selectedId + 1].name);

    // config for swiping
    // const config = {
    //   velocityThreshold: 0.3,
    //   directionalOffsetThreshold: 80,
    // };

    return (
      <View style={styles.container}>
        <MasonryList
          data={this.state.itemList}
          keyExtractor={item => item.id}
          renderItem={this.renderItem}
          numColumns={1}
          onRefresh={() => refetch({first: ITEM_CNT})}
          style={styles.scrollview}
        />
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
  scrollview: {
    justifyContent: 'center',
  },
  item: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    marginTop: 8,
    // marginHorizontal: 16,
  },
  title: {
    fontSize: 16,
    color: 'black',
  },
});

export default Home;
