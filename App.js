import * as React from 'react';
import Home from './src/containers/Home';
import ImageLayer1 from './src/containers/ImageLayer1';
import ImageLayer2 from './src/containers/ImageLayer2';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

const App = () => {
  console.log('reder app');
  return <Navigation />;
};

// create navigation stack
const Stack = createNativeStackNavigator();

// navigation of all screens
const Navigation = () => {
  console.log('navigation');
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={Home} options={{title: 'Home'}} />
        <Stack.Screen
          name="ImageLayer1"
          component={ImageLayer1}
          options={{headerShown: false}}
          initialParams={{index: 0, changePosition: true}}
        />
        <Stack.Screen
          name="ImageLayer2"
          component={ImageLayer2}
          options={{headerShown: false}}
          initialParams={{
            imageIndex: 0,
            objectIndex: 0,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
