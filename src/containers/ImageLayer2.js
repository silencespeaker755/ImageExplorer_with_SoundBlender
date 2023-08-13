import React from 'react';
import {
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  Image,
  ImageBackground,
  Dimensions,
} from 'react-native';
import data from '../../input/data';
import Svg, {Polyline, Polygon} from 'react-native-svg';
import DoubleClick from './ClickHandler/DoubleClick';
import SpeechWrapper from '../utils/SpeechWrapper';
import Tts from 'react-native-tts';
import audioBuffer from '../utils/audioBuffer';
// import * as Speech from 'expo-speech';

const speechWrapper = new SpeechWrapper();

// threshold for overlapping with other bounding boxes, used in getting showList
const INTERSECT_THRESHOLD = 0.5;

class ImageLayer2 extends React.Component {
  constructor() {
    super();
    this.state = {
      speaking: false,
      previous: null,
    };

    Tts.addEventListener('tts-start', event => {
      this.setState({speaking: true});
    });
    Tts.addEventListener('tts-finish', event => {
      if (!this.state.previous) this.setState({speaking: false});
    });

    // get window size
    this.windowWidth = Dimensions.get('window').width;
    this.windowHeight = Dimensions.get('window').height;

    // object pointed by finger
    this.object = null;

    // binding
    this.onFingerMove = this.onFingerMove.bind(this);
    this.getPolygon = this.getPolygon.bind(this);
    this.getShowList = this.getShowList.bind(this);
    this.onDoubleClick = this.onDoubleClick.bind(this);
    this.getPointingObject = this.getPointingObject.bind(this);
  }

  componentDidMount() {
    Tts.speak(
      'Exploring details of ' +
        data.data[this.imageIndex].json.maskrcnn[this.objectIndex].label,
    );
    Tts.speak(this.showList.length + ' items to explore');
  }

  // store index of pointing object in this.object, -1 if background
  getPointingObject(e) {
    // get current pointing coordinate with respect to image raw pixels
    var y =
      ((e.nativeEvent.pageY - (this.windowHeight - this.viewHeight) / 2) *
        this.imageHeight) /
      this.viewHeight;
    var x =
      ((e.nativeEvent.pageX - (this.windowWidth - this.viewWidth) / 2) *
        this.imageWidth) /
      this.viewWidth;

    // background if out of bound
    if (x < 0 || x > this.imageWidth || y < 0 || y > this.imageHeight) {
      this.object = -1;
    } else {
      // determine if coordinate is in rectangular bounding box
      this.object = -1;
      let start = this.object == -1 ? 0 : this.object;
      for (let i = 0; i < this.showList.length; i++) {
        // let index = this.showList[(i + start) % this.showList.length];
        let index = this.showList[i];
        let box = this.denseData[index].bounding_box;
        if (x > box[0] && x < box[2] && y > box[1] && y < box[3]) {
          this.object = index;
          break;
        }
      }
    }
  }

  // when moving finger, read object out aloud
  onFingerMove(e) {
    this.getPointingObject(e);
    if (this.object != -1) {
      speechWrapper.speak(
        this.denseData[this.object].label,
        this.state.speaking,
        this.object,
        3000,
        this.state.previous,
        this.denseData[this.object].pan,
        audioname => this.setState({previous: audioname}),
        isSpeaking => this.setState({speaking: isSpeaking}),
        true,
      );
    } else {
      speechWrapper.speak(
        'background',
        this.state.speaking,
        -1,
        500,
        this.state.previous,
      );
    }
  }

  // navigate back to first layer on double click
  onDoubleClick() {
    if (this.state.speaking && this.state.previous) {
      audioBuffer[this.state.previous].stop();
    } else {
      Tts.stop();
    }
    this.setState({speaking: false, previous: null});
    this.props.navigation.navigate('ImageLayer1', {changePosition: false});
  }

  // get index of detailed object to display
  // display detailed objects that have overlapping with maskrcnn object
  // but has little overlapping with other objects already in the list
  getShowList() {
    this.showList = [];
    for (let i = 0; i < this.denseData.length; i++) {
      // first, get rid of boxed that overlap a lot with boxes already in showList
      // let intersection = false;
      // for (let j = 0; j < this.showList.length; j++) {
      //   let box1 = this.denseData[i].bounding_box;
      //   let box2 = this.denseData[this.showList[j]].bounding_box;

      //   let x1 = Math.max(box1[0], box2[0]);
      //   let y1 = Math.max(box1[1], box2[1]);
      //   let x2 = Math.min(box1[0] + box1[2], box2[0] + box2[2]);
      //   let y2 = Math.min(box1[1] + box1[3], box2[1] + box2[3]);
      //   if (x1 < x2 && y1 < y2) {
      //     // calculate intersection area
      //     let intersectionArea = (x2 - x1) * (y2 - y1);
      //     if (
      //       intersectionArea > box1[2] * box1[3] * INTERSECT_THRESHOLD ||
      //       intersectionArea > box2[2] * box2[3] * INTERSECT_THRESHOLD
      //     ) {
      //       intersection = true;
      //       break;
      //     }
      //   }
      // }
      // if (intersection) {
      //   continue;
      // }

      // second, find boxes that has overlapping with the object we want to get more details (in maskrcnn)
      let box = this.denseData[i].bounding_box;
      for (let j = 0; j < this.maskrcnnData.length; j++) {
        let x = this.maskrcnnData[j][0];
        let y = this.maskrcnnData[j][1];
        if (x > box[0] && x < box[2] && y > box[1] && y < box[3]) {
          this.showList.push(i);
          break;
        }
      }
    }
    this.showList.sort((index1, index2) => {
      let box1 = this.denseData[index1].bounding_box;
      let box2 = this.denseData[index2].bounding_box;
      return (
        (box1[2] - box1[0]) * (box1[3] - box1[1]) -
        (box2[2] - box2[0]) * (box2[3] - box2[1])
      );
    });
  }

  // draw polygon on image according to the coordinates in data file
  getPolygon() {
    let polygonList = [];
    for (let i = 0; i < this.showList.length; i++) {
      let box = this.denseData[this.showList[i]].bounding_box;
      let x = (box[0] * this.viewWidth) / this.imageWidth;
      let y = (box[1] * this.viewHeight) / this.imageHeight;
      let x2 = (box[2] * this.viewWidth) / this.imageWidth;
      let y2 = (box[3] * this.viewHeight) / this.imageHeight;
      let points = [
        [x, y],
        [x2, y],
        [x2, y2],
        [x, y2],
        [x, y],
      ];
      polygonList.push(
        <Polyline key={i} points={points} stroke="white"></Polyline>,
      );
    }

    return <Svg>{polygonList}</Svg>;
  }

  render() {
    // get data
    this.imageIndex = this.props.route.params.imageIndex;
    this.objectIndex = this.props.route.params.objectIndex;
    this.maskrcnnData =
      data.data[this.imageIndex].json.maskrcnn[this.objectIndex].coordinates[0];
    this.denseData = data.data[this.imageIndex].json.captions;

    // get image, its raw height and width, and height and width in the screen
    var fn = data.data[this.imageIndex].origin;
    const image = Image.resolveAssetSource(fn);
    this.imageHeight = image.height;
    this.imageWidth = image.width;
    this.viewHeight = (this.windowWidth * this.imageHeight) / this.imageWidth;
    this.viewWidth = this.windowWidth;

    // get show list
    this.getShowList();

    return (
      <View style={styles.container} onTouchMove={e => this.onFingerMove(e)}>
        <DoubleClick
          style={styles.container}
          timeout={300}
          onDoubleClick={this.onDoubleClick}>
          <TouchableWithoutFeedback>
            <View>
              <ImageBackground
                style={{
                  // transform: [
                  //   {
                  //     rotate: '90deg',
                  //   },
                  // ],
                  height: this.viewHeight,
                  width: undefined,
                  aspectRatio: this.imageWidth / this.imageHeight,
                }}
                resizeMode="contain"
                source={image}>
                {this.getPolygon()}
              </ImageBackground>
            </View>
          </TouchableWithoutFeedback>
        </DoubleClick>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
});

export default ImageLayer2;
