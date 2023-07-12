import React, { Component, createRef } from 'react'
import { StyleSheet, TouchableWithoutFeedback, Image, View, Alert } from 'react-native'
import RNFS from 'react-native-fs';
import Spinner from '../Spinner';
import NativeImage from './NativeImage';
import RNFB from 'rn-fetch-blob';

// Secured version
const awsAPILink = 'http://platybase.site/api/upload'

// No Secured Version
//const awsAPILink = 'http://ec2-100-24-118-157.compute-1.amazonaws.com/api/upload';

const re = /(?:\.([^.]+))?$/;
const getFilenameFromPath = path => path.substring(path.lastIndexOf('/') + 1);
const getExtensionFromFilename = fileName => re.exec(fileName)[1];

const delteFile = async (filepath) => {
    try {
        let exists = await RNFS.exists(filepath);
        if (exists) {
            // exists call delete
            await RNFS.unlink(filepath);
            console.log("File Deleted");
        } else {
            console.log("File Not Available")
        }
    } catch (e) {
        alert(e);
    }
}

const storeImage = async (localUri, contentType) => {
    let requestFilename = getFilenameFromPath(localUri).toLowerCase();
    const extension = getExtensionFromFilename(localUri);
   
    if (Platform.OS === 'android' && (!extension || extension === '' )) {
       requestFilename = 'android_long_name_' + requestFilename + '.jpg'
    }

    const uri = Platform.OS === 'ios' ? localUri.replace("file://", "") : localUri;
    const { data } = await RNFB.fetch('POST', awsAPILink, {
        'Content-Type' : 'multipart/form-data',
      }, [
        { name : requestFilename, filename : requestFilename, type: contentType || 'image/jpg', data: RNFB.wrap(uri)},
      ])
    
    const result = JSON.parse(data);
    return result.s3_bucket_retrieval_link;
};

const getPureDataByUri = async (uri) => {
    if (!uri || uri === '') { 
        return null;
    }
    return await RNFS.readFile(uri, 'base64');
};

const getDataByUri = async (uri) =>  {
    if (!uri || uri === '') { 
        return null;
    }

    const fileName = getFilenameFromPath(uri);
    const extention = getExtensionFromFilename(fileName) || 'jpg';
    const response = await RNFS.readFile(uri, 'base64');

    return `data:image/${extention};base64,${response}`;
};

const loadFile = async (uri, _this) => {
    if (_this.nativeImage.current == null) return;
    const data = await getDataByUri(uri);

    if (_this.nativeImage && _this.nativeImage.current) {
        _this.nativeImage.current.setContentInner(data);
    }
    return data;
};

class NativeImageWrapper extends Component { 
    constructor() {
        super();
        this.nativeImage = createRef();
        this.state = {
            isStoring: false
        }
    }

    render () { 
        const { uri, resizeMode, onUploadSuccessAction, onUploadErrorAction, hidePreview, isTopPositionCalculated, deleteFileAfterUplaod, contentType } = this.props;

        const filePath = uri;

        const storeImageOnClick = async () => { 
            this.setState({isStoring: true});
            try { 
                const url = await storeImage(filePath, contentType);

                if (onUploadSuccessAction) {
                    await onUploadSuccessAction(url, 'photo');
                }

                if (deleteFileAfterUplaod) {
                    await delteFile(filePath);
                }
            } catch (error) {
                console.log(error)
                Alert.alert('Error during upload photo', 'Error during photo upload!' + error);
                if (onUploadErrorAction) {
                    onUploadErrorAction(error);
                }
            } finally {
                this.setState({isStoring: false});
                hidePreview();
            }
        };

        const cancelImageOnClick = async () => {           
            if (hidePreview) {
                hidePreview();
            }
        };

        const updateImage = async () => {
            await loadFile(filePath, this);
        };

        setTimeout(() => updateImage(), 10);

        return (<>
                    <NativeImage 
                        style={{zIndex:10}}
                        resizeMode = { resizeMode }
                        ref={ this.nativeImage }
                        isTopPositionCalculated = {isTopPositionCalculated}>
                             
                    </NativeImage>
                    <View style={{ position:"absolute", bottom:0, left:0, width:"100%", backgroundColor: 'rgba(0,0,0,0.5)', height:140, alignContent:"flex-start"}}>
                        <TouchableWithoutFeedback onPress={ () => cancelImageOnClick() }>
                            <Image style={[ styles.imagestyle, styles.imagestyleLeft ]} source={require('./images/close-button-white.png')}/>
                        </TouchableWithoutFeedback>
                        <TouchableWithoutFeedback onPress={ () => storeImageOnClick() } >
                            <Image style={[ styles.imagestyle, styles.imagestyleRight ]} source={require('./images/right-arrow-button-white.png')}/>
                        </TouchableWithoutFeedback>
                    </View>
                    {this.state.isStoring && <Spinner/>}
                </>
        );
    }
}

const styles = StyleSheet.create({
    imagestyle: {
        width:  64,
        height: 64,
        position:"absolute"
    },
    imagestyleLeft: {
        left:     10,
        bottom:   40,
    },
    imagestyleRight: {
        right:    20,
        bottom:   40,
    }
});

export default NativeImageWrapper