import { View, Text, ActivityIndicator } from "react-native";
import React from "react";
import { ReactNativeModal } from "react-native-modal";

const CustomLoader = ({ loading }: { loading: boolean }) => {
  return (
    <ReactNativeModal isVisible={loading}>
      <View className="bg-white p-7 py-9 min-h-[50px] flex flex-row gap-[10px] items-center">
        <ActivityIndicator size={"large"} color={"#7E60BF"} />
        <Text className="text-2xl">Loading...</Text>
      </View>
    </ReactNativeModal>
  );
};

export default CustomLoader;
