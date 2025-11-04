import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

const CACHE_KEY = "url";
const APP_ID = 13
const REACT_APP_CONFIG_SERVER_URL = "https://panel.internow.com.mx/api"

export function useFetchAppSettings() {
  const [value, setValue] = useState<{ webUrl: string } | undefined>();

  const fetchUrlFromServer = useCallback(async () => {
    let value
    try {
      const cachedUrl = await AsyncStorage.getItem(CACHE_KEY);
      if (cachedUrl) {
        value = { webUrl: cachedUrl }
        setValue(value);
      }
    } catch { }

    const endpoint = REACT_APP_CONFIG_SERVER_URL + "/setting/" + APP_ID
    try {
      const response = await fetch(endpoint);
      const { data } = await response.json();
      AsyncStorage.setItem(CACHE_KEY, data.value);
      setValue({ webUrl: data.value });
    } catch (error) {
      if (!value) {
        Alert.alert("Error", "No se pudo obtener la URL.");
      }
      console.log("Fetch Settings", endpoint, error);
    }
  }, []);

  useEffect(() => {
    fetchUrlFromServer();
  }, [fetchUrlFromServer]);

  return { data: value };
}
