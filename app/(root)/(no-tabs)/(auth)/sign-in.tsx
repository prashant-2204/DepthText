import { View, Text, ScrollView, Image, Alert } from "react-native";
import React, { useCallback, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import InputField from "@/components/CustomInput";
import CustomButton from "@/components/CustomButton";
import { Link, Redirect, router } from "expo-router";
import { useSignIn, useUser } from "@clerk/clerk-expo";

const SignInScreen = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const onSignInPress = useCallback(async () => {
    if (!isLoaded) return;
    try {
      const signInAttempt = await signIn.create({
        identifier: form.email,
        password: form.password,
      });
      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/(root)/(tabs)/dashboard");
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (error: any) {
      console.error(JSON.stringify(error, null, 2));
      Alert.alert("Error", "Log in failed. Please try again.");
    }
  }, [isLoaded, form]);
  const { user } = useUser();
  if (user) {
    return <Redirect href={"/(root)/(tabs)/dashboard"} />;
  }
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView>
        <View>
          <View className="relative w-full h-[250px]">
            <Image
              source={require("@/assets/images/showcase.png")}
              className="z-0 w-full h-[200px]"
            />
            <Text className="text-2xl text-black font-rubik absolute bottom-5 left-5">
              Welcome 👋
            </Text>
          </View>
          <View className="p-5">
            <InputField
              label="Email"
              placeholder="Enter email"
              icon={require("@/assets/icons/email.png")}
              textContentType="emailAddress"
              value={form.email}
              onChangeText={(email) => {
                setForm({
                  ...form,
                  email: email,
                });
              }}
            />
            <InputField
              label="Password"
              placeholder="Enter password"
              icon={require("@/assets/icons/lock.png")}
              secureTextEntry={true}
              textContentType="password"
              value={form.password}
              onChangeText={(password) => {
                setForm({ ...form, password });
              }}
            />
            <CustomButton
              title="Sign In"
              onPress={onSignInPress}
              className="mt-6"
            />
            <Link
              href={"/sign-up"}
              className="text-lg text-center text-gray-400 mt-10"
            >
              <Text>
                Don't have an account?{" "}
                <Text className="text-primary-200 underline font-rubik-medium">
                  Sign Up
                </Text>
              </Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignInScreen;
