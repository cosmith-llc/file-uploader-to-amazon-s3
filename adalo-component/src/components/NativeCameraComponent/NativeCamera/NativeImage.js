import React, { Component } from 'react'
import { Image } from 'react-native'
import { View, StyleSheet, Text } from 'react-native'

class NativeImage extends Component { 
    constructor() {
        super();

        this.state = { content: '' }
    
        this.setContentInner = this.setContentInner.bind(this);
    }

    setContentInner (content) {
        this.setState({ content });
    }

    render () {
        const { resizeMode, isTopPositionCalculated } = this.props;

        if (this.state.content === '') {
            return (
                <View style={styles.wrapper}>
                    <Text>Uploaded data</Text>
                </View>
            );
        }
           
        return (
            <Image 
                source={{ uri: this.state.content }} 
                style={ [styles.image, isTopPositionCalculated ? { marginTop : 10 } : {} ]}
                resizeMode={ resizeMode }>
            </Image>
        )
    }
}

const styles = StyleSheet.create({
	image: {
		flex: 1,
        height: null,
        width: null
	},
    wrapper: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	}
});

export default NativeImage