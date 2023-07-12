/* eslint-disable no-console */
import React from 'react';
import { Text, StyleSheet } from 'react-native';
  
  const secondInMinute = 60;
  
  class Timer  extends React.Component {
    constructor() {
      super();
      this.state = { secondsElapsed: 0 }
    }
  
    tick() {
      this.setState({secondsElapsed: this.state.secondsElapsed + 1});
    }
  
    componentDidMount() {
      this.interval = setInterval(() => this.tick(), 1000);
    }
  
    componentWillUnmount() {
      clearInterval(this.interval);
    }
  
    calcCountDown (maxDuration, secondsElapsed) {
      const result = maxDuration - secondsElapsed;
      return result > 0 ? result : 0;
    }
  
    formatTime (totalSeconds) {
      if (totalSeconds <= 0) return { minutes: '0', seconds: '00' };
      
      let minutes = 0;
  
      if (totalSeconds >= secondInMinute) {
        minutes = Math.floor(totalSeconds / secondInMinute).toString();
      }
  
      const seconds = totalSeconds % secondInMinute;
  
      return {
        minutes, 
        seconds: seconds > 9 ? seconds.toString() : ('0' + seconds.toString())
      }
    }
  
    calcTime (maxDuration, secondsElapsed) {
      return secondsElapsed < maxDuration ? secondsElapsed : maxDuration;
    }
  
    render() {
      const { secondsElapsed } = this.state;
      const { inverseTimer, maxDuration } = this.props;
      const totalSeconds = inverseTimer ? this.calcCountDown(maxDuration, secondsElapsed) : this.calcTime(maxDuration, secondsElapsed);
      const formatedTime = this.formatTime(totalSeconds)
      return (
        <Text style={ styles.timer }> { formatedTime.minutes } : { formatedTime.seconds } </Text>
      );
    }
}

const styles = StyleSheet.create({
    timer: {
      color: '#444',
      fontWeight: "bold",
      fontSize: 20,
      backgroundColor:'rgba(255,255,255,0.3)',
      alignSelf:'center'
    }
  });
  
export default Timer;  