import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert, Dimensions } from 'react-native'
import { Icon, Avatar, Image, Input, Button } from 'react-native-elements';
import * as Permissions from 'expo-permissions';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView from 'react-native-maps';
import Modal from '../Modal';

const widthScreen = Dimensions.get('window').width;

const styles = StyleSheet.create({
    viewImage: {
        flexDirection: 'row',
        marginLeft: 20,
        marginRight: 20,
        marginTop: 30
    },
    containerIcon: {
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
        height: 70,
        width: 70,
        backgroundColor: '#e3e3e3'
    },
    miniature: {
        height: 70,
        width: 70,
        marginRight: 10
    },
    viewPhoto: {
        alignItems: 'center',
        height: 200,
        marginBottom: 20
    },
    viewForm: {
        marginLeft: 10,
        marginRight: 10
    },
    input: {
        marginBottom: 10
    },
    textArea: {
        height: 100,
        width: '100%',
        padding: 0,
        margin: 0
    },
    mapStyle: {
        width: '100%',
        height: 550
    },
    viewMapBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10
    },
    viewMapBtnContainerSave: {
        paddingRight: 5
    },
    viewMapBtnSave: {
        backgroundColor: '#00a680'
    },
    viewMapBtnContainerCancel: {
        paddingLeft: 5
    },
    viewMapBtnCancel: {
        backgroundColor: '#a60d0d'
    }
});

const UploadImage = ({ imagesSelected, setImagesSelected, toastRef }) => {

    const imageSelect = async () => {
        const resultPermissions = await Permissions.askAsync(Permissions.CAMERA_ROLL);
        const resultPermissionsCamera = resultPermissions.permissions.cameraRoll.status;
        if (resultPermissionsCamera === 'denied') {
            toastRef.current.show('Es necesario aceptar los permisos de la galeria', 2000);
        } else {
            const result = await ImagePicker.launchImageLibraryAsync({
                allowsEditing: true,
                aspect: [4, 3]
            });
            if (result.cancelled) {
                toastRef.current.show('Has cerrado la galeria sin seleccionar ninguna imagen', 2000);
            } else {
                setImagesSelected([...imagesSelected, result.uri]);
            }
        }
    }

    const removeImage = image => {
        const arrayImages = imagesSelected;
        Alert.alert(
            'Eliminar Imagen',
            '¿Estás seguro de eliminar la imagen?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Eliminar', onPress: () => setImagesSelected(arrayImages.filter(element => element !== image)) }
            ],
            { cancelable: false }
        );
    }

    return (
        <View style={styles.viewImage}>
            {imagesSelected.length < 4 && (
                <Icon
                    type="material-community"
                    name="camera"
                    color="#7a7a7a"
                    containerStyle={styles.containerIcon}
                    onPress={imageSelect}
                />
            )}
            {imagesSelected.map((element, index) => (
                <Avatar
                    key={index}
                    style={styles.miniature}
                    source={{ uri: element }}
                    onPress={() => removeImage(element)}
                />
            ))}
        </View>
    );

}

const RestaurantImage = ({ imagesSelected }) => (
    <View style={styles.viewPhoto}>
        {imagesSelected ?
            <Image source={{ uri: imagesSelected }} style={{ width: widthScreen, height: 200 }} />
            :
            <Image source={require('../../../assets/img/no-image.png')} style={{ width: widthScreen, height: 200 }} />
        }
    </View>
);

const Form = ({ setRestaurantName, setRestaurantAddress, setRestaurantDescription, setMapIsVisible, locationRestaurant }) => {
    return (
        <View style={styles.viewForm}>
            <Input
                containerStyle={styles.input}
                placeholder="Nombre del restaurante"
                onChange={event => setRestaurantName(event.nativeEvent.text)}
            />
            <Input
                containerStyle={styles.input}
                placeholder="Dirección del restaurante"
                rightIcon={{
                    type: 'material-community',
                    name: 'google-maps',
                    color: locationRestaurant ? '#00a680' : '#c2c2c2',
                    onPress: () => setMapIsVisible(true)
                }}
                onChange={event => setRestaurantAddress(event.nativeEvent.text)}
            />
            <Input
                inputContainerStyle={styles.textArea}
                placeholder="Descripción del restaurante"
                multiline={true}
                onChange={event => setRestaurantDescription(event.nativeEvent.text)}
            />
        </View>
    );
}

const Map = ({ mapIsVisible, setMapIsVisible, setLocationRestaurant, toastRef }) => {

    const [location, setLocation] = useState(null);

    useEffect(() => {
        (async () => {
            const resultPermissions = await Permissions.askAsync(Permissions.LOCATION);
            const { status } = resultPermissions.permissions.location;
            if (status !== 'granted') {
                toastRef.current.show('Debe aceptar los permisos de localización para continuar', 2000);
            } else {
                const currentLocation = await Location.getCurrentPositionAsync({});
                setLocation({
                    latitude: currentLocation.coords.latitude,
                    longitude: currentLocation.coords.longitude,
                    latitudeDelta: 0.001,
                    longitudeDelta: 0.001
                });
            }
        })();
    }, [])

    const confirmLocation = () => {
        setLocationRestaurant(location);
        toastRef.current.show('Localización guardada correctamente', 2000);
        setMapIsVisible(false);
    }

    return (
        <Modal isVisible={mapIsVisible} setIsVisible={setMapIsVisible}>
            <View>
                {location && (
                    <MapView
                        style={styles.mapStyle}
                        initialRegion={location}
                        showsUserLocation={true}
                        onRegionChange={region => setLocation(region)}
                    >
                        <MapView.Marker
                            coordinate={{
                                latitude: location.latitude,
                                longitude: location.longitude
                            }}
                            draggable
                        />
                    </MapView>
                )}
                <View style={styles.viewMapBtn}>
                    <Button
                        containerStyle={styles.viewMapBtnContainerSave}
                        buttonStyle={styles.viewMapBtnSave}
                        title="Guardar ubicación"
                        onPress={confirmLocation}
                    />
                    <Button
                        containerStyle={styles.viewMapBtnContainerCancel}
                        buttonStyle={styles.viewMapBtnCancel}
                        title="Cancelar ubicación"
                        onPress={() => setMapIsVisible(false)}
                    />
                </View>
            </View>
        </Modal>
    );

}

const AddRestaurantForm = ({ toastRef, setIsLoading, navigation }) => {

    const [imagesSelected, setImagesSelected] = useState([]);
    const [restaurantName, setRestaurantName] = useState('');
    const [restaurantAddress, setRestaurantAddress] = useState('');
    const [restaurantDescription, setRestaurantDescription] = useState('');
    const [mapIsVisible, setMapIsVisible] = useState(false);
    const [locationRestaurant, setLocationRestaurant] = useState(null);

    return (
        <ScrollView>
            <RestaurantImage
                imagesSelected={imagesSelected[0]}
            />
            <Form
                setRestaurantName={setRestaurantName}
                setRestaurantAddress={setRestaurantAddress}
                setRestaurantDescription={setRestaurantDescription}
                setMapIsVisible={setMapIsVisible}
                locationRestaurant={locationRestaurant}
            />
            <UploadImage
                imagesSelected={imagesSelected}
                setImagesSelected={setImagesSelected}
                toastRef={toastRef}
            />
            <Map
                mapIsVisible={mapIsVisible}
                setMapIsVisible={setMapIsVisible}
                setLocationRestaurant={setLocationRestaurant}
                toastRef={toastRef}
            />
        </ScrollView>
    );

}

export default AddRestaurantForm;