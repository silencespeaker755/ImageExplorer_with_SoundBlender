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
import Svg, {Polyline} from 'react-native-svg';
import DoubleClick from './ClickHandler/DoubleClick';
import Tts from 'react-native-tts';
import SpeechWrapper from '../utils/SpeechWrapper';
import audioBuffer from '../utils/audioBuffer';
// import * as Speech from 'expo-speech';

const speechWrapper = new SpeechWrapper();

class ImageLayer1 extends React.Component {
  constructor() {
    super();
    this.state = {
      speaking: false,
      previous: null,
      pan: 0.0,
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

    // binding
    this.onFingerMove = this.onFingerMove.bind(this);
    this.getPolygon = this.getPolygon.bind(this);
    this.onDoubleClick = this.onDoubleClick.bind(this);
    this.getPointingObject = this.getPointingObject.bind(this);
  }

  componentDidMount() {
    Tts.speak(data.data[this.index].json.output);
    if (this.props.route.params.changePosition) {
      Tts.speak('Charge port to the right');
    }
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

    this.setState({pan: Math.min(-1 + (x / this.imageWidth) * 2, 1)});

    // background if out of bound
    if (x < 0 || x > this.imageWidth || y < 0 || y > this.imageHeight) {
      this.object = -1;
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
        this.maskrcnnData[this.object].label,
        this.state.speaking,
        this.object,
        3000,
        this.state.previous,
        this.state.pan,
        audioname => this.setState({previous: audioname}),
        isSpeaking => this.setState({speaking: isSpeaking}),
        true,
      );
    } else {
      speechWrapper.speak(
        'background',
        this.state.speaking,
        this.object,
        500,
        this.state.previous,
        this.state.pan,
        audioname => this.setState({previous: audioname}),
        isSpeaking => this.setState({speaking: isSpeaking}),
        true,
      );
      // speechWrapper.speak(
      //   'background',
      //   this.state.speaking,
      //   -1,
      //   500,
      //   this.state.previous,
      // );
    }
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
    this.setState({speaking: false, previous: null});
    if (this.object != -1) {
      console.log('navigating');
      this.props.navigation.navigate('ImageLayer2', {
        imageIndex: this.index,
        objectIndex: this.object,
      });
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
        <Polyline key={i} points={points} stroke="white"></Polyline>,
      );
    }

    return <Svg>{polygonList}</Svg>;
  }

  render() {
    this.index = this.props.route.params.index;
    this.maskrcnnData = data.data[this.index].json.maskrcnn;

    // get image, its raw height and width, and height and width in the screen
    var fn = data.data[this.index].origin;
    const image = Image.resolveAssetSource(fn);
    this.imageHeight = image.height;
    this.imageWidth = image.width;
    this.viewHeight = (this.windowWidth * this.imageHeight) / this.imageWidth;
    this.viewWidth = this.windowWidth;

    return (
      <View
        style={styles.container}
        onTouchStart={e => this.getPointingObject(e)} // get object on touch to support double click
        onTouchMove={e => this.onFingerMove(e)}>
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

export default ImageLayer1;
