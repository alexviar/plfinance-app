import { Linking, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native"

type Props = {
  onRetry(): void
}

export const WebViewError = ({ onRetry }: Props) => (
  <View style={[StyleSheet.absoluteFill, styles.errorContainer]}>
    <StatusBar backgroundColor="#F8F9FA" barStyle="dark-content" />

    {/* Icono ilustrativo */}
    {/* <View style={styles.errorIcon}>
      <Icon name="wifi-off" size={60} color="#dc3545" />
    </View> */}

    {/* Mensaje de error */}
    <Text style={styles.errorTitle}>¡Ups! Algo salió mal</Text>
    <Text style={styles.errorDescription}>
      No pudimos conectar con el servidor. Por favor verifica:
    </Text>

    {/* Lista de soluciones */}
    <View style={styles.suggestionsContainer}>
      <Text style={styles.suggestion}>• Tu conexión a internet</Text>
      <Text style={styles.suggestion}>• La configuración de red</Text>
    </View>

    {/* Botones de acción */}
    <View style={styles.buttonsContainer}>
      <TouchableOpacity
        style={[styles.button, styles.primaryButton]}
        onPress={onRetry}
      >
        <Text style={styles.buttonText}>Reintentar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={() => Linking.sendIntent('android.settings.WIFI_SETTINGS')}
      >
        <Text style={[styles.buttonText, styles.secondaryButtonText]}>
          Seleccionar otra red
        </Text>
      </TouchableOpacity>
    </View>
  </View>
)

const styles = StyleSheet.create({
  errorContainer: {
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#343A40',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorDescription: {
    fontSize: 16,
    color: '#6C757D',
    marginBottom: 20,
    textAlign: 'center',
  },
  suggestionsContainer: {
    marginBottom: 30,
  },
  suggestion: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 24,
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 300,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    // elevation: 2,
  },
  primaryButton: {
    backgroundColor: '#dc3545',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  secondaryButtonText: {
    color: '#dc3545',
  },
})