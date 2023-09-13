import React from 'react';
import {
  StyleSheet,
  StatusBar,
  TouchableWithoutFeedback,
  View,
  Image,
  ImageBackground,
  Dimensions,
} from 'react-native';
import data from '../../input/data';
import Svg, {Circle, Polyline, Polygon} from 'react-native-svg';
import DoubleClick from './ClickHandler/DoubleClick';
import SpeechWrapper from '../utils/SpeechWrapper';
import BackgroundWrapper from '../utils/BackgroundWrapper';
import Tts from 'react-native-tts';
import audioBuffer from '../utils/audioBuffer';
// import * as Speech from 'expo-speech';

const speechWrapper = new SpeechWrapper();
const backgroundWrapper = new BackgroundWrapper();
const VRBackgroundWrapper = new BackgroundWrapper();

// threshold for overlapping with other bounding boxes, used in getting showList
const INTERSECT_THRESHOLD = 0.5;

class ImageLayer2 extends React.Component {
  constructor() {
    super();
    this.state = {
      background: false,
      vrBackground: false,
      speaking: false,
      previous: null,
      pan: 0.0,
      pointX: 0,
      pointY: 0,
      showGestureCircle: false,
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
    this.realWorld = true;

    // binding
    this.onFingerMove = this.onFingerMove.bind(this);
    this.getPolygon = this.getPolygon.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.getShowList = this.getShowList.bind(this);
    this.onDoubleClick = this.onDoubleClick.bind(this);
    this.getPointingObject = this.getPointingObject.bind(this);
  }

  componentDidMount() {
    StatusBar.setHidden(true);
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
      this.imageHeight -
      ((e.nativeEvent.pageX - (this.windowWidth - this.viewHeight) / 2) *
        this.imageHeight) /
        this.viewHeight;
    var x =
      ((e.nativeEvent.pageY - (this.windowHeight - this.viewWidth) / 2) *
        this.imageWidth) /
      this.viewWidth;

    this.setState({
      pointX: e.nativeEvent.pageY - (this.windowHeight - this.viewWidth) / 2,
      pointY:
        this.viewHeight -
        (e.nativeEvent.pageX - (this.windowWidth - this.viewHeight) / 2),
      pan: Math.min(-1 + (x / this.imageWidth) * 2, 1),
      showGestureCircle: true,
    });

    let intersectCountWorld = 0;
    let last =
      this.worldData.coordinates[0][this.worldData.coordinates[0].length - 1];
    for (let j = 0; j < this.worldData.coordinates[0].length; j++) {
      var x1 = this.worldData.coordinates[0][j][0];
      var y1 = this.worldData.coordinates[0][j][1];
      var x2 = last[0];
      var y2 = last[1];
      if (
        (x1 - x) * (x2 - x) < 0 &&
        (y1 - y2) * (x - x1) * (x1 - x2) > (y - y1) * (x1 - x2) ** 2
      ) {
        intersectCountWorld++;
      }
      last = this.worldData.coordinates[0][j];
    }
    if (intersectCountWorld % 2 == 1) this.realWorld = true;
    else this.realWorld = false;

    // background if out of bound
    if (x < 0 || x > this.imageWidth || y < 0 || y > this.imageHeight) {
      this.object = -1;
      this.realWorld = true;
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
          this.realWorld = this.denseData[index].world;
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
        this.state.pan,
        1.0,
        audioname => this.setState({previous: audioname}),
        isSpeaking => this.setState({speaking: isSpeaking}),
        true,
      );
    } else {
      if (this.state.speaking && this.state.previous) {
        audioBuffer[this.state.previous].stop();
        this.setState({previous: null, speaking: false});
      }
    }
    backgroundWrapper.speak(
      'ambience',
      this.state.background,
      this.state.pan,
      this.realWorld ? 1.0 : 0.0,
      isSpeaking => this.setState({background: isSpeaking}),
    );
    VRBackgroundWrapper.speak(
      'forest_ambience',
      this.state.vrBackground,
      this.state.pan,
      this.realWorld ? 0.0 : 1.0,
      isSpeaking => this.setState({vrBackground: isSpeaking}),
    );
  }

  onTouchEnd() {
    this.setState({
      showGestureCircle: false,
    });
    if (this.state.speaking && this.state.previous) {
      audioBuffer[this.state.previous].stop();
    }
    audioBuffer['ambience'].stop();
    audioBuffer['forest_ambience'].stop();
    this.setState({
      previous: null,
      speaking: false,
      background: false,
      vrBackground: false,
    });
  }

  // navigate back to first layer on double click
  onDoubleClick() {
    if (this.state.speaking && this.state.previous) {
      audioBuffer[this.state.previous].stop();
    } else {
      Tts.stop();
    }
    audioBuffer['ambience'].stop();
    audioBuffer['forest_ambience'].stop();
    this.setState({
      speaking: false,
      previous: null,
      background: false,
      vrBackground: false,
    });
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
        <Polyline
          key={i}
          points={points}
          stroke="#f8ffe5"
          strokeWidth={3.5}></Polyline>,
      );
    }

    return polygonList;
  }

  render() {
    // get data
    this.imageIndex = this.props.route.params.imageIndex;
    this.objectIndex = this.props.route.params.objectIndex;
    this.maskrcnnData =
      data.data[this.imageIndex].json.maskrcnn[this.objectIndex].coordinates[0];
    this.denseData = data.data[this.imageIndex].json.captions;
    this.worldData = data.data[this.imageIndex].json.world;

    // get image, its raw height and width, and height and width in the screen
    var fn = data.data[this.imageIndex].origin;
    const image = Image.resolveAssetSource(fn);
    this.imageHeight = image.height;
    this.imageWidth = image.width;
    this.viewHeight = this.windowWidth;
    this.viewWidth = (this.windowWidth * this.imageWidth) / this.imageHeight;

    // get show list
    this.getShowList();

    return (
      <View
        style={styles.container}
        onTouchStart={e => this.getPointingObject(e)}
        onTouchMove={e => this.onFingerMove(e)}
        onTouchEnd={e => this.onTouchEnd(e)}>
        <DoubleClick
          style={styles.container}
          timeout={300}
          onDoubleClick={this.onDoubleClick}>
          <TouchableWithoutFeedback>
            <View>
              <ImageBackground
                style={{
                  transform: [
                    {
                      rotate: '90deg',
                    },
                  ],
                  height: this.windowWidth,
                  width: undefined,
                  aspectRatio: this.imageWidth / this.imageHeight,
                }}
                resizeMode="contain"
                source={image}>
                <Svg>
                  {this.state.showGestureCircle && (
                    <Circle
                      cx={this.state.pointX}
                      cy={this.state.pointY}
                      r="8"
                      fill="pink"
                    />
                  )}
                  {this.getPolygon()}
                </Svg>
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
