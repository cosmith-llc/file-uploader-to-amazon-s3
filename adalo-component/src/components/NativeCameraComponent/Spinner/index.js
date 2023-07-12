import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

class Spinner extends React.Component {
    render() {
      return (
        <View style={spinnerStyles.containerSpinner}>
          <ActivityIndicator size="large" color="#0000ff"/>
        </View>
      );
    }
};

const spinnerStyles = StyleSheet.create({
    containerSpinner: {
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        opacity: 1,
        backgroundColor: "black",
        justifyContent: "center",
        alignItems: "center",
    }
});

export default Spinner;