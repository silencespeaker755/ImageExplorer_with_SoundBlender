import React from 'react';
import {TouchableWithoutFeedback, View} from 'react-native';

// construct a component that detects double click
// requires following props:
// style
// onDoubleClick: function to trigger on double click
// timeout: maximum time interval allowed between two clicks (in ms)
var clickCount = 0;
const DoubleClick = props => {
  return (
    <TouchableWithoutFeedback>
      <View
        style={props.style}
        onTouchStart={e => {
          console.log(clickCount);
          clickCount++;
          if (clickCount == 2) {
            clearTimeout(timer);
            props.onDoubleClick();
          } else {
            var timer = setTimeout(() => {
              clickCount = 0;
            }, props.timeout);
          }
        }}>
        {props.children}
      </View>
    </TouchableWithoutFeedback>
  );
};

export default DoubleClick;
