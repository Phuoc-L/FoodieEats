import { Button, ScrollView, Text, View } from 'react-native';

export default function ProfileScreen(props) {
    return (
        <View>
            <View>
                <Text>Profile Image</Text>
                <Text>Followers</Text>
                <Text>Following</Text>
            </View>
            <View>
                <Button title="Holder"/>
            </View>
            <ScrollView>
                <Text>Images of our review postings</Text>
            </ScrollView>
        </View>
    )
}