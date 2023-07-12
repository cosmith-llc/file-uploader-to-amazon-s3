import React from 'react'
import { Text, View, StyleSheet } from 'react-native'
import NativeCamera from './NativeCamera';
import Icon from 'react-native-vector-icons/MaterialIcons'

const NativeCameraComponent = (props) => {
	const { editor } = props;

	if (editor) {
		return (
			<View style={[styles.cameraEditorContainer, {
				backgroundColor:'#eaeaea',
				height: '100%',
				color: 'grey'
			}]}>
				<Icon style={ styles.iconCenter } name="videocam" size={64}></Icon>
			</View>
		);
	}

	// const maxUploadSize = 150 * 1024 * 1024;
	const { maxDuration, unlimitedDuration, showTimer, inverseTimer, videoQuality, fps, maxUploadSize, codec } = props.videoCamera;
	const { cameraType, onUploadSuccessAction, onUploadErrorAction, onCancelUploadAction, onContentReadyAction } = props;
	const { resizeMode } = props.photoCamera;

	
	return(
		<NativeCamera
			style={{
				    flex: 1,
				    justifyContent: 'space-between',
				}}
				androidCameraPermissionOptions={{
					title: 'Permission to use camera',
					message: 'We need your permission to use your camera',
					buttonPositive: 'Ok',
					buttonNegative: 'Cancel',
				}}
				onUploadSuccessAction = { onUploadSuccessAction } 
				onUploadErrorAction = { onUploadErrorAction } 
				onCancelUploadAction = { onCancelUploadAction }
				onContentReadyAction = { onContentReadyAction }
				maxDuration = { maxDuration }
				unlimitedDuration = { unlimitedDuration }
				showTimer = { showTimer }
				inverseTimer = { inverseTimer }
				videoQuality = { videoQuality }
				cameraType = { cameraType }
				fps = { fps }
				photoCameraResizeMode = { resizeMode }
				maxUploadSize = { maxUploadSize * 1024 * 1024 }
				codec = { codec }
		/>
	)
}

const styles = StyleSheet.create({
	wrapper: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	},
	cameraEditorContainer: {
		flex: 1,
		backgroundColor: 'grey',
		color: 'grey',
		alignItems: 'center',
		justifyContent: 'center'
	}
})

export default NativeCameraComponent;