import { View, Text, Image } from "react-native";
import React from "react";

const CustomState = ({
  title,
  description,
  image,
}: {
  title: string;
  description: string;
  image: any;
}) => {
  return (
    <View className="mx-5 my-5 flex items-center justify-center">
      <Image source={image} className="w-[210px] h-[210px]" />
      <Text className="font-rubik-medium text-black">{title}</Text>
      <Text className="text-base text-gray-400">{description}</Text>
    </View>
  );
};

export default CustomState;
