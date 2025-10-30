import { View, Text } from 'react-native';
import { globalStyles } from '../../constants/styles';

export default function Dashboard() {
  return (
    <View style={globalStyles.centered}>
      <Text style={globalStyles.title}>Dashboard</Text>
      <Text>Coming next...</Text>
    </View>
  );
}