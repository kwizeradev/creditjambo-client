import { View, Text } from 'react-native';
import { globalStyles } from '../../constants/styles';

export default function SignIn() {
  return (
    <View style={globalStyles.centered}>
      <Text style={globalStyles.title}>Sign In</Text>
      <Text>Coming next...</Text>
    </View>
  );
}