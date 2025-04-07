import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import CustomButton from "@/components/CustomButton";
import { router } from "expo-router";
import { StripeProvider } from "@stripe/stripe-react-native";
import Payment from "@/components/Payment";
import { useUser } from "@clerk/clerk-expo";
const SubScribe = () => {
  const { user } = useUser();
  const tableData = [
    {
      tier: "Free",
      generations: "5/month",
      save: "3/month",
      fonts: "5",
      ads: "True",
    },
    {
      tier: "Pro",
      generations: "Unlimited",
      save: "Unlimited",
      fonts: "Access full fonts",
      ads: "False",
    },
  ];

  const columns = [
    { title: "Generations", key: "generations", width: 120 },
    { title: "Save Generations", key: "save", width: 140 },
    { title: "Fonts Access", key: "fonts", width: 120 },
    { title: "Ads", key: "ads", width: 80 },
  ];

  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
      merchantIdentifier="merchant.uber.com"
      urlScheme="behindImageAI"
    >
      <SafeAreaView className="flex-1 bg-white">
        <ScrollView>
          <View className="mx-5">
            <View className="flex flex-row items-center justify-between w-full">
              <Text className="font-rubik-medium text-3xl text-center w-full">
                Subscribe to us!
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(root)/(tabs)/dashboard")}
                className="absolute right-0 bg-gray-50 p-[10px]"
              >
                <X color={"black"} size={25} />
              </TouchableOpacity>
            </View>
            <View>
              <Image
                source={require("@/assets/images/subscribe-to-us.png")}
                className="w-full"
                resizeMode="contain"
              />
            </View>
            <Text className="text-center font-rubik-bold text-2xl">
              Benefits ⚡
            </Text>
            <Text className="font-rubik text-base text-center w-full text-gray-400">
              Subscribe and unlock every pro feature! 👑
            </Text>
            <View className=" border border-gray-100 rounded-lg overflow-x-auto">
              {/* Table Container */}
              <View className="flex-row">
                {/* Fixed Tier Column */}
                <View className="bg-blue-100">
                  <View className="w-24 p-3 border-r border-b border-gray-100">
                    <Text className="font-rubik-medium">Tier</Text>
                  </View>
                  {tableData.map((row, index) => (
                    <View
                      key={index}
                      className={`w-24 p-3 border-r border-gray-100 ${
                        index === tableData.length - 1 ? "" : "border-b"
                      }`}
                    >
                      <Text className="font-rubik">{row.tier}</Text>
                    </View>
                  ))}
                </View>

                {/* Scrollable Columns */}
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                  <View>
                    {/* Table Headers */}
                    <View className="flex-row border-b border-gray-100">
                      {columns.map((col, index) => (
                        <View
                          key={index}
                          className="p-3 bg-white"
                          style={{ width: col.width }}
                        >
                          <Text className="font-rubik-medium">{col.title}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Table Rows */}
                    {tableData.map((row, rowIndex) => (
                      <View
                        key={rowIndex}
                        className={`flex-row ${
                          rowIndex === tableData.length - 1 ? "" : "border-b"
                        } border-gray-100`}
                      >
                        {columns.map((col, colIndex) => (
                          <View
                            key={colIndex}
                            className="p-3 bg-white"
                            style={{ width: col.width }}
                          >
                            <Text className="font-rubik">{row[col.key]}</Text>
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
            <Payment
              fullName={user?.fullName}
              email={user?.emailAddresses[0]?.emailAddress}
              amount={"10"}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </StripeProvider>
  );
};

export default SubScribe;
