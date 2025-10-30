import { View, Text } from 'react-native';
import { globalStyles } from '../../constants/styles';

export default function DevicePending() {
  return (
    <View style={globalStyles.centered}>
      <Text style={globalStyles.title}>Device Pending</Text>
      <Text>Coming next...</Text>
    </View>
  );
}