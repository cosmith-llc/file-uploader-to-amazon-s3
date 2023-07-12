/* eslint-disable no-console */
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
  TouchableWithoutFeedback,
  Image
} from 'react-native';
// eslint-disable-next-line import/no-unresolved
import Timer from '../Timer'
import Spinner from '../Spinner'
import { RNCamera } from 'react-native-camera';
import IconEntypo from 'react-native-vector-icons/Entypo'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import RNFS from 'react-native-fs';
import { launchImageLibrary } from 'react-native-image-picker';

import NativeImageWrapper from './NativeImageWrapper';
import RNFB from 'rn-fetch-blob';

const awsAPILink = 'http://ec2-100-24-118-157.compute-1.amazonaws.com/api/upload';
//
//
//
//RNCamera.Constants.VideoCodec['H264']
//RNCamera.Constants.VideoCodec['JPEG']
//RNCamera.Constants.VideoCodec['HVEC']


const contentTypes = {
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'jpg': 'image/jpg',
  'mp4': 'video/mp4',
  'avi': 'video/avi',
  'mov': 'video/quicktime'
};

const codecs = Platform.OS === 'android' ? 
  () => ({}) 
  : () => ({
    'H264': RNCamera.Constants.VideoCodec['H264'],
    'JPEG': RNCamera.Constants.VideoCodec['JPEG'],
    'HVEC': RNCamera.Constants.VideoCodec['HVEC']
  })

const flashModeOrder = {
  off: 'on',
  on: 'auto',
  auto: 'torch',
  torch: 'off',
};

const wbOrder = {
  auto: 'sunny',
  sunny: 'cloudy',
  cloudy: 'shadow',
  shadow: 'fluorescent',
  fluorescent: 'incandescent',
  incandescent: 'auto',
};

const re = /(?:\.([^.]+))?$/;
const getFilenameFromPath = path => path.substring(path.lastIndexOf('/') + 1);
const getExtensionFromFilename = fileName => re.exec(fileName)[1];
const isExtensionVideo = ext => ['avi', 'mov', 'mp4' ].includes(ext.toLowerCase());

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const getContentType = (stat, extension) => {
  if (!!stat.type) {
    return stat.type;
  } else if (!!extension) {
    const ext = extension || 'jpg';
    return contentTypes[ext];
  }
  return '';
};

export default class CameraScreen extends React.Component {
  state = {
    flash: 'off',
    zoom: 0,
    autoFocus: 'on',
    autoFocusPoint: {
      normalized: { x: 0.5, y: 0.5 }, // normalized values required for autoFocusPointOfInterest
      drawRectPosition: {
        x: Dimensions.get('window').width * 0.5 - 32,
        y: Dimensions.get('window').height * 0.5 - 32,
      },
    },
    depth: 0,
    type: this.props.cameraType,
    whiteBalance: 'auto',
    ratio: '16:9',
    recordOptions: {
      mute: false,
      quality: RNCamera.Constants.VideoQuality["1080p"],
      fps: 30,
      codec: Platform.OS === 'ios' ? RNCamera.Constants.VideoCodec['H264'] : null
    },
    isRecording: false,
    canDetectFaces: false,
    canDetectText: false,
    canDetectBarcode: false,
    recordedVideo: false,   // back to false
    isUploading: false,
    cameraState: 'photo'
  };

  toggleFacing() {
    this.setState({
      type: this.state.type === 'back' ? 'front' : 'back',
    });
  }

  toggleFlash() {
    this.setState({
      flash: flashModeOrder[this.state.flash],
    });
  }

  toggleWB() {
    this.setState({
      whiteBalance: wbOrder[this.state.whiteBalance],
    });
  }

  toggleFocus() {
    this.setState({
      autoFocus: this.state.autoFocus === 'on' ? 'off' : 'on',
    });
  }

  touchToFocus(event) {
    const { pageX, pageY } = event.nativeEvent;
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    const isPortrait = screenHeight > screenWidth;

    let x = pageX / screenWidth;
    let y = pageY / screenHeight;
    // Coordinate transform for portrait. See autoFocusPointOfInterest in docs for more info
    if (isPortrait) {
      x = pageY / screenHeight;
      y = -(pageX / screenWidth) + 1;
    }

    this.setState({
      autoFocusPoint: {
        normalized: { x, y },
        drawRectPosition: { x: pageX, y: pageY },
      },
    });
  }

  zoomOut() {
    this.setState({
      zoom: this.state.zoom - 0.1 < 0 ? 0 : this.state.zoom - 0.1,
    });
  }

  zoomIn() {
    this.setState({
      zoom: this.state.zoom + 0.1 > 1 ? 1 : this.state.zoom + 0.1,
    });
  }

  setFocusDepth(depth) {
    this.setState({
      depth,
    });
  }

  uploadFileRequest = async (localUri) => {
    try {
      let requestFilename = getFilenameFromPath(localUri).toLowerCase();
      const fileNameWithoutExtension = requestFilename.substr(0, requestFilename.lastIndexOf("."));
      const extension = getExtensionFromFilename(localUri);
    
      if (Platform.OS === 'android' && (!extension || extension === '' )) {
        requestFilename = 'android_long_name_' + requestFilename + '.mp4'
      }

      //TODO: Check mimeType for iOS
      const mimeType = 'video/mp4';
      this.setState({ uploadParameter: 0 })
      const uri = Platform.OS === 'ios' ? localUri.replace("file://", "") : localUri;
      const response = await RNFB.fetch('POST', awsAPILink, {
        'Content-Type' : 'multipart/form-data',
      }, [
        { name : fileNameWithoutExtension, filename : requestFilename, type: mimeType, data: RNFB.wrap(uri)},
      ])
      .uploadProgress((written, total) => {
        console.log("uploaded:", written / total);
        this.setState({
          uploadParameter: Math.round(written * 100 / total)
        })
      });
      return response;
    } catch (e) {
      Alert.alert('Error', 'Error during video upload!' + e);
      throw e;
    }
  }

  uploadVideo = async (localUri) => {
    const { onUploadSuccessAction, onUploadErrorAction } = this.props;

    if (!localUri || localUri === '') { 
      return null;
    }

    try {
      this.setState({ isUploading: true });
    
      const { data } = await this.uploadFileRequest(localUri);

      if (onUploadSuccessAction) {
        const result = JSON.parse(data);
        await onUploadSuccessAction(result.s3_bucket_retrieval_link, 'video');
      }

      this.setState({ isUploading: false, recordedVideoUri: '', recordedVideo: false, cameraState: 'video' });
    } catch(error) {
      if (onUploadErrorAction) {
        onUploadErrorAction(error, 'video');
      }
    } finally {
      this.setState({ isUploading: false });
    }
  };

  takePicture = async () => {
    if (this.camera) {
      const data = await this.camera.takePictureAsync();
      
      const contentType = Platform.OS === 'android' ? 'image/jpeg' : 'image/heic';

      this.setState({
        cameraState: 'previewPhoto',
        fileUri: data.uri,
        contentType
      });

      const { onContentReadyAction } = this.props;
      if (onContentReadyAction) {
        onContentReadyAction(data.uri, 'photo');
      }
    } else {
      console.log('no camera');
    }
  };

  takeVideo = async () => {
    const { isRecording, recordOptions } = this.state;
    const { startRecordingAction, maxDuration, unlimitedDuration } = this.props;
    const { onContentReadyAction } = this.props;
    const { videoQuality, fps, maxUploadSize, codec } = this.props;

    if (this.camera && !isRecording) {
      try {
        const options = { ...recordOptions };
        if (!unlimitedDuration) {
          options.maxDuration = maxDuration;
        }
        options.quality = videoQuality;
        options.fps = fps;
        options.codec = codecs()[codec];

        const promise = this.camera.recordAsync({ ...options });

        if (promise) {
          this.setState({ isRecording: true });

          if (startRecordingAction) {
            await startRecordingAction();
          }

          const data = await promise;
          
          this.setState({ isRecording: false });

          if (await RNFS.exists(data.uri)) {

            if (onContentReadyAction) {
              await onContentReadyAction(data.uri);
            }

            const statResult = await RNFS.stat(data.uri);

            if (statResult.size < maxUploadSize) {  
              const contentType = Platform.OS === 'android' ? 'video/mp4' : 'video/quicktime';
              this.setState({ recordedVideoUri: data.uri, recordedVideoSize: statResult.size, recordedVideo:true, cameraState: 'previewVideo', contentType  });
            } else {
              Alert.alert('Error', `Selected file is greater then ${formatBytes(maxUploadSize)}`);
            }
          } 
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  toggle = value => () => this.setState(prevState => ({ [value]: !prevState[value] }));

  renderSwitcher = () => {
    const { isRecording } = this.state;
    const color = !isRecording ? 'white' : 'grey';
    const swithToVideo = () => this.setState({cameraState: 'video' });
    const swithToPhoto = () => this.setState({cameraState: 'photo' });

    return (
      <View style={ { 
        flexDirection:'row',
        justifyContent: 'center',
        flex:1
      }}>
        {
        this.state.cameraState === 'video' ?
        (<View style= {styles.switchBtnView}>
          <Text></Text>
        </View>) : (<></>)
        }
        <View style= {styles.switchBtnView}> 
          <TouchableOpacity onPress={ () => swithToVideo() }>
              <Text style={ [ styles.switchBtn, {color: this.state.cameraState !== 'video' ? 'white' : 'yellow' } ]}>VIDEO</Text>
            </TouchableOpacity>
          </View>
        <View style= {styles.switchBtnView}>
            {
              !isRecording ? 
              (<TouchableOpacity onPress={ () => !isRecording ? swithToPhoto() : _=>{} }>
                <Text style={ [ styles.switchBtn, { color: this.state.cameraState === 'video' ? color : 'yellow' } ]}>PHOTO</Text>
              </TouchableOpacity>) : (
                <Text style={ [ styles.switchBtn, { color: this.state.cameraState === 'video' ? color : 'yellow' } ]}>PHOTO</Text>
              )
            }
        </View>
          {
          this.state.cameraState === 'photo' ?
          (<View style= {styles.switchBtnView}>
            <Text></Text>
          </View>) : (<></>)
          }
      </View>
    );
  }

  renderRecording = () => {
    const { isRecording } = this.state;
    const color = !isRecording ? 'white' : 'darkred';
    const action = this.state.cameraState === 'photo' ? 
          this.takePicture : isRecording ? this.stopVideo : this.takeVideo;

    return (
      <TouchableOpacity
        style={ [ styles.flipButton ]}
        onPress={ () => action() }
      >
        <Icon style={ { color } } name="circle" size={ 64 }></Icon>
      </TouchableOpacity>
    );
  };

  renderCameraFlipBtn = () => {
    const { type } = this.state;
    const iconName = type === 'back' ? 'camera-rear' : 'camera-front';
    return (
        <Icon style={ styles.iconBtn } name={ iconName } size={ 40 } onPress={ () => this.toggleFacing() } ></Icon>
    );
  }

  renderUploadFromGalleryBtn = () => {
    const { cameraState } = this.state;
    const iconName = cameraState === 'photo' ? 'folder-images' : 'folder-video';
    return (
      <IconEntypo style={ styles.iconBtn } name={ iconName } size={ 40 } onPress={ () => this.uploadFile() } ></IconEntypo>
    );
  }

  renderQuestionInfo = () => {
    const { recordedVideoSize, recordedVideoUri } = this.state;
    const calcSize = formatBytes(recordedVideoSize);
    const uplaodText = `Upload video (${calcSize})?`;

    const previewVideo = () => {

      if (Platform.OS === 'android') {
        RNFB.android.actionViewIntent(recordedVideoUri.replace("file:///", "///"), 'video/mp4');
      } else {
        RNFB.ios.openDocument(recordedVideoUri);
      }
    }

    return (<View>
        <Text style={[styles.faceText, { color:'white'}]}>{ uplaodText }</Text>
        <Text style={[styles.faceText, { color:'white'}]} onPress={ e => previewVideo() }>Preview</Text>
      </View>
    )
  }
  
  processLibrarySelection = async (response) => {
    const { onContentReadyAction } = this.props;

      if (response.errorCode) {
        console.error('error:', response)
        if (response.errorCode === 'permission') {
          const { title, body } = getLocalizedText(cameraPermissionsMessages)
          return Alert.alert(title, body)
        } else {
          return Alert.alert('Error', response.errorMessage)
        }
      }

      if (!response.uri) {
        return
      }
      const previewURI = decodeURIComponent(response.uri);
      let filename = ''

      if (response.fileName) {
        filename = response.fileName
      } else if (response.filename) {
        filename = response.filename
      } else {
        // eslint-disable-next-line prefer-destructuring
        filename = previewURI.split('/').slice(-1)[0]
      }

      const statCalc = async (statResult) => {
        const { maxUploadSize } = this.props;
        if (statResult.size < maxUploadSize) {
          const extension = Platform.OS === 'android' ? getExtensionFromFilename(filename) || 'mp4' : getExtensionFromFilename(filename);
          const contentType = getContentType (response, extension);
          console.log(contentType, 'contentType');
          if (isExtensionVideo(extension)) {
            const uri = Platform.OS === 'android' ? statResult.originalFilepath : previewURI;
            this.setState({ recordedVideoUri: uri, recordedVideoSize: statResult.size, recordedVideo:true, cameraState: 'previewVideo', contentType });
          }  else { 
            this.setState({ fileUri: previewURI, cameraState: 'previewPhoto', contentType });
          }
          if (onContentReadyAction) {
            onContentReadyAction(previewURI, 'local');
          }
        } else {
          Alert.alert('Error', `Selected file is greater then ${formatBytes(maxUploadSize)}`);
        }
      } 
      console.warn('previewURI', previewURI);
      if (await RNFS.exists(previewURI) || (previewURI && previewURI.startsWith('content://'))) {
        const statResult = await RNFS.stat(previewURI);
        statCalc(statResult);
      } else {
        Alert.alert('Error', `Can't access to the file ${previewURI}`);
      }
  }

  uploadFile = async () => {
    const { cameraState } = this.state;
    await launchImageLibrary({ 
      mediaType: cameraState === 'photo' ? 'photo' : 'video',  
      noData: false,
      saveToPhotos: false,
      storageOptions: { cameraRoll: false} 
    }, this.processLibrarySelection );
  }

  cancelUpload =  async() => {
    const { onCancelUploadAction } = this.props;
    this.setState({ recordedVideoUri:'', recordedVideo: false, cameraState: 'video'   });
    if (onCancelUploadAction) {
      await onCancelUploadAction();
    }
  }

  renderCloseBtn = () => {
    return (
      <TouchableWithoutFeedback onPress={ () => this.cancelUpload() }>
        <Image style={[ styles.imagestyle, styles.imagestyleLeft ]} source={require('./images/close-button-white.png')}/>
      </TouchableWithoutFeedback>
    );
  }

  renderUploadBtn = () => {
    const { recordedVideoUri } = this.state;
    return (
      <TouchableWithoutFeedback onPress={ () => this.uploadVideo(recordedVideoUri) } >
        <Image style={[ styles.imagestyle, styles.imagestyleRight ]} source={require('./images/right-arrow-button-white.png')}/>
      </TouchableWithoutFeedback>
    )
  }

  stopVideo = async () => {
    await this.camera.stopRecording();
    this.setState({ isRecording: false });
  };

  renderTimer () {
    const { maxDuration, inverseTimer, unlimitedDuration } = this.props;

    let maxDurationValue = !unlimitedDuration ? maxDuration : 9999;
    let inverseTimerValue = !unlimitedDuration ? inverseTimer : false;
    
    return (<Timer maxDuration = { maxDurationValue } inverseTimer = { inverseTimerValue }  />);
  }

  renderQuestionControl () {
    return (
      <View style={{ 
        bottom: 0, 
        flexDirection:'row',
        justifyContent: 'space-between' }}>
        { this.renderCloseBtn() }
        { this.renderQuestionInfo() }
        { this.renderUploadBtn()}
      </View>
    );
  }

  renderCameraControls () {
    return (
      <>
        <View
          style={{
            flex:1,
            flexDirection:'row',
            alignItems:'center',
            justifyContent:'center'
          }}
        >
          { this.renderSwitcher() }
        </View>
        <View
          style={{
            flex:1,
            flexDirection:'row',
            justifyContent: 'space-between'
          }}
        >
          { this.renderUploadFromGalleryBtn() } 
          { this.renderRecording() }
          { this.renderCameraFlipBtn() } 
        </View>
      </>);
  }

  renderCamera() {
    const { uploadParameter } = this.state;

    return (
      <RNCamera
        ref={ref => {
          this.camera = ref;
        }}
        style={{
          flex: 1,
          justifyContent: 'space-between',
          overflow:'hidden'
        }}
        type={this.state.type}
        flashMode={this.state.flash}
        autoFocus={this.state.autoFocus}
        autoFocusPointOfInterest={this.state.autoFocusPoint.normalized}
        zoom={this.state.zoom}
        whiteBalance={this.state.whiteBalance}
        ratio={this.state.ratio}
        focusDepth={this.state.depth}
        androidCameraPermissionOptions={{
          title: 'Permission to use camera',
          message: 'We need your permission to use your camera',
          buttonPositive: 'Ok',
          buttonNegative: 'Cancel',
        }}
      >
        <View style={{ top: 0 }}>
          { (this.state.isRecording && !this.state.recordedVideo) && this.renderTimer() }
        </View>
        <View
          style={{
            flex: 0.5,
            height: 72,
            flexDirection: 'row',
            justifyContent: 'space-around',
          }}
        >       
          <View
            style={{
              backgroundColor: 'transparent',
              flexDirection: 'row',
              justifyContent: 'flex-end',
            }}
          >
          </View>
          <View
            style={{
              backgroundColor: 'transparent',
              flexDirection: 'row',
              justifyContent: 'space-around',
            }}
          >
          </View>
        </View>
        <View style={{ bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', height:140 }}>
           { this.state.recordedVideo ? this.renderQuestionControl() : this.renderCameraControls() }
        </View>
        {this.state.isUploading && (<Spinner/>)}
        {this.state.isUploading && (<Text style={{color:"white", textAlign:"center", textAlignVertical:"center", paddingBottom:"100%"}}>{ uploadParameter + "%" }</Text>)}
      </RNCamera>
    );
  }

  render() {
    const { cameraState, fileUri, contentType }  = this.state;
    const { onUploadSuccessAction, onUploadErrorAction, photoCameraResizeMode } = this.props;

    if (cameraState === 'previewPhoto') {
      return (
        <View style={[ styles.container, {}]}>
          <NativeImageWrapper 
            uri={ fileUri }
            onUploadSuccessAction = { onUploadSuccessAction }
            onUploadErrorAction = { onUploadErrorAction }
            hidePreview = { () => this.setState({cameraState: 'photo' } ) }
            resizeMode = { photoCameraResizeMode }
            contentType = { contentType }
          >
          </NativeImageWrapper>
        </View>
      );
    }
    return (
      <View style={styles.container}>{this.renderCamera()}</View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
    backgroundColor: '#000',
  },
  flipButton: {
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent'
  },
  imagestyle: {
    marginTop:20,
    width:  64,
    height: 64,
  },
  imagestyleLeft: {
      alignContent: "flex-start"
  },
  imagestyleRight: {
      alignContent: "flex-end"
  },
  faceText: {
    maxWidth:180,
    marginTop:20,
    alignContent:'center',
    textAlign:'center'
  },
  iconBtn: {
    color: 'white', 
    paddingLeft: 10, 
    paddingRight: 10
  },
  switchBtn :{
    paddingBottom:10,
    textAlign:"center"
  },
  switchBtnView: {
    ...Platform.select({
      ios: {
        width: 76,
      },
      android: {
        width: 64,
      }
    })
  }
});