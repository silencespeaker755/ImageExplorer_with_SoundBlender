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
import Svg, {Circle, Polyline} from 'react-native-svg';
import DoubleClick from './ClickHandler/DoubleClick';
import Tts from 'react-native-tts';
import SpeechWrapper from '../utils/SpeechWrapper';
import BackgroundWrapper from '../utils/BackgroundWrapper';
import audioBuffer from '../utils/audioBuffer';
// import * as Speech from 'expo-speech';

const speechWrapper = new SpeechWrapper();
const backgroundWrapper = new BackgroundWrapper();
const VRBackgroundWrapper = new BackgroundWrapper();

class ImageLayer1 extends React.Component {
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
    Tts.addEventListener('tts-cancel', event => {
      this.setState({speaking: false});
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
    this.onDoubleClick = this.onDoubleClick.bind(this);
    this.getPointingObject = this.getPointingObject.bind(this);
  }

  componentDidMount() {
    StatusBar.setHidden(true);
    Tts.speak(data.data[this.index].json.output);
    if (this.props.route.params.changePosition) {
      Tts.speak('Charge port to the right');
    }
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
      // use ray casting algorithm to determine if a point is in polygon
      // details: https://en.wikipedia.org/wiki/Point_in_polygon#:~:text=One%20simple%20way%20of%20finding,an%20even%20number%20of%20times.

      this.object = -1;

      // round x and y to avoid overlapping lines
      (x = Math.round(x) + 0.5), (y = Math.round(y) + 0.5);

      // starting linear search from the previous index
      let start = this.object == -1 ? 0 : this.object;
      for (let i = 0; i < this.maskrcnnData.length; i++) {
        let intersectCount = 0;
        let index = (i + start) % this.maskrcnnData.length;
        let last =
          this.maskrcnnData[index].coordinates[0][
            this.maskrcnnData[index].coordinates[0].length - 1
          ];
        for (
          let j = 0;
          j < this.maskrcnnData[index].coordinates[0].length;
          j++
        ) {
          var x1 = this.maskrcnnData[index].coordinates[0][j][0];
          var y1 = this.maskrcnnData[index].coordinates[0][j][1];
          var x2 = last[0];
          var y2 = last[1];
          if (
            (x1 - x) * (x2 - x) < 0 &&
            (y1 - y2) * (x - x1) * (x1 - x2) > (y - y1) * (x1 - x2) ** 2
          ) {
            intersectCount++;
          }
          last = this.maskrcnnData[index].coordinates[0][j];
        }
        if (intersectCount % 2 == 1) {
          if (this.object != index) {
            this.object = index;
          }
          this.realWorld = this.maskrcnnData[index].world;
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
        `${this.index}_${this.maskrcnnData[this.object].label}`,
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
        console.log('break');
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

  // navigate to second layer if double clicking on an object
  // if double clicking on background, go back to home
  onDoubleClick() {
    console.log('Double click');
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
    if (this.object != -1) {
      // console.log('navigating');
      // this.props.navigation.navigate('ImageLayer2', {
      //   imageIndex: this.index,
      //   objectIndex: this.object,
      // });
    } else {
      this.props.navigation.navigate('Home', {changePort: true});
    }
  }

  // draw polygon on image according to the coordinates in data file
  getPolygon() {
    let polygonList = [];
    for (let i = 0; i < this.maskrcnnData.length; i++) {
      let points = [];
      for (let j = 0; j < this.maskrcnnData[i].coordinates[0].length; j++) {
        // get coordinates with respect to whole screen
        points.push([
          (this.maskrcnnData[i].coordinates[0][j][0] * this.viewWidth) /
            this.imageWidth,
          (this.maskrcnnData[i].coordinates[0][j][1] * this.viewHeight) /
            this.imageHeight,
        ]);
      }

      // push first coordinate into the list to connect first and last
      points.push([
        (this.maskrcnnData[i].coordinates[0][0][0] * this.viewWidth) /
          this.imageWidth,
        (this.maskrcnnData[i].coordinates[0][0][1] * this.viewHeight) /
          this.imageHeight,
      ]);
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
    this.index = this.props.route.params.index;
    this.maskrcnnData = data.data[this.index].json.maskrcnn;
    this.worldData = data.data[this.index].json.world;

    // get image, its raw height and width, and height and width in the screen
    var fn = data.data[this.index].origin;
    const image = Image.resolveAssetSource(fn);
    this.imageHeight = image.height;
    this.imageWidth = image.width;
    this.viewHeight = this.windowWidth;
    this.viewWidth = (this.windowWidth * this.imageWidth) / this.imageHeight;

    return (
      <View
        style={styles.container}
        onTouchStart={e => this.getPointingObject(e)} // get object on touch to support double click
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

export default ImageLayer1;
