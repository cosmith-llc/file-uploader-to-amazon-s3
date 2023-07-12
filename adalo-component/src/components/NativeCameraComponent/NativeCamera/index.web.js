import React from 'react'
import { Text, View, StyleSheet } from 'react-native'

const NativeCamera = (props) => {
	const { _height } = props;
	console.log('props', props);
	// return (<iframe src="https://podrobnosti.ua" width={"100%"} height={ "100%" }> </iframe>)
    return (
		<View style={styles.wrapper}>
			<Text>Native Video Camera doesn't support web ...</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	wrapper: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	}
})

export default NativeCamera;