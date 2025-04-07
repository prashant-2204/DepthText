import { View, Text, ScrollView, Image, Alert } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import InputField from "@/components/CustomInput";
import CustomButton from "@/components/CustomButton";
import { Link, router } from "expo-router";
import { useSignUp } from "@clerk/clerk-expo";
import { ReactNativeModal } from "react-native-modal";
import { fetchAPI } from "@/lib/fetch";

const SignUpScreen = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [form, setForm] = useState({
    email: "",
    name: "",
    password: "",
  });
  const [verification, setVerification] = useState({
    state: "default",
    error: "",
    code: "",
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const onSignUpPress = async () => {
    if (!isLoaded) return;
    try {
      await signUp.create({
        emailAddress: form.email,
        password: form.password,
        username: form.name,
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerification({
        ...verification,
        state: "pending",
      });
    } catch (error: any) {
      console.log(JSON.stringify(error, null, 2));
      Alert.alert("Error", error.errors[0].longMessage);
    }
  };
  const onPressVerify = async () => {
    if (!isLoaded) return;
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verification.code,
      });
      if (completeSignUp.status === "complete") {
        await fetchAPI("/(api)/user", {
          method: "POST",
          body: JSON.stringify({
            username: form.name,
            email: form.email,
            clerkId: completeSignUp.createdUserId,
            provider: "credentials",
          }),
        });
        await setActive({ session: completeSignUp.createdSessionId });
        setVerification({
          ...verification,
          state: "success",
        });
        setShowSuccessModal(true);
      } else {
        setVerification({
          ...verification,
          error: "Verification failed. Please try again.",
          state: "failed",
        });
      }
    } catch (error: any) {
      console.log("Verification error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "An unexpected error occured";
      setVerification({
        ...verification,
        error: errorMessage,
        state: "failed",
      });
    }
  };
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
              Create your account
            </Text>
          </View>
          <View className="p-5">
            <InputField
              label="Name"
              placeholder="Enter name"
              icon={require("@/assets/icons/person.png")}
              textContentType="name"
              value={form.name}
              onChangeText={(value) =>
                setForm({
                  ...form,
                  name: value,
                })
              }
            />
            <InputField
              label="Email"
              placeholder="Enter email"
              icon={require("@/assets/icons/email.png")}
              textContentType="emailAddress"
              value={form.email}
              onChangeText={(value) =>
                setForm({
                  ...form,
                  email: value,
                })
              }
            />
            <InputField
              label="Password"
              placeholder="Enter password"
              icon={require("@/assets/icons/lock.png")}
              secureTextEntry={true}
              textContentType="password"
              value={form.password}
              onChangeText={(value) =>
                setForm({
                  ...form,
                  password: value,
                })
              }
            />
            <CustomButton
              title="Sign Up"
              onPress={onSignUpPress}
              className="mt-6"
            />
            <Link
              href={"/sign-in"}
              className="text-lg text-center text-gray-400 mt-10"
            >
              <Text>
                Already have an account?{" "}
                <Text className="text-primary-200 underline font-rubik-medium">
                  Sign In
                </Text>
              </Text>
            </Link>
          </View>
          <ReactNativeModal
            isVisible={verification.state === "pending"}
            onModalHide={() => {
              if (verification.state === "success") {
                setShowSuccessModal(true);
              }
            }}
          >
            <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px]">
              <Text className="font-rubik text-2xl mb-2">Verification</Text>
              <Text className="font-rubik mb-5">
                We've sent a verification code to {form.email}
              </Text>
              <InputField
                label="Code"
                icon={require("@/assets/icons/lock.png")}
                placeholder="12345"
                value={verification.code}
                keyboardType="numeric"
                onChangeText={(code) =>
                  setVerification({
                    ...verification,
                    code,
                  })
                }
              />
              {verification.error && (
                <Text className="text-red-500 text-sm mt-1">
                  {verification.error}
                </Text>
              )}
              <CustomButton
                title="Verify Email"
                onPress={onPressVerify}
                className="mt-5 bg-primary-200"
              />
            </View>
          </ReactNativeModal>
          <ReactNativeModal isVisible={showSuccessModal}>
            <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px]">
              <Image
                source={require("@/assets/icons/check.png")}
                className="w-[110px] h-[110px] mx-auto my-5 "
              />
              <Text className="font-rubik text-3xl  text-center ">
                Verified
              </Text>
              <Text className="text-base text-gray-400 font-rubik text-center mt-2">
                You have successfully verified your account.
              </Text>

              <CustomButton
                title="Browse Dashboard"
                onPress={() => router.push("/(root)/(no-tabs)/subscribe")}
                className="mt-5 bg-primary-200"
              />
            </View>
          </ReactNativeModal>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignUpScreen;
