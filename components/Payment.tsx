import { View, Text, Alert, Image } from "react-native";
import React, { useState } from "react";
import CustomButton from "./CustomButton";
import { useStripe } from "@stripe/stripe-react-native";
import { useAuth } from "@clerk/clerk-expo";
import { fetchAPI } from "@/lib/fetch";
import ReactNativeModal from "react-native-modal";
import { router } from "expo-router";
import CustomLoader from "./CustomLoader";

const Payment = ({
  fullName,
  email,
  amount,
}: {
  fullName: string | null | undefined;
  email: string | null | undefined;
  amount: string;
}) => {
  const { userId } = useAuth();
  const [success, setSuccess] = useState<boolean>(false);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const fetchPaymentSheetParams = async () => {
    const response = await fetch(`/(api)/(stripe)/payment-sheet`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amount,
      }),
    });
    const { paymentIntent, ephemeralKey, customer } = await response.json();

    return {
      paymentIntent,
      ephemeralKey,
      customer,
    };
  };
  const initializePaymentSheet = async () => {
    const { paymentIntent, ephemeralKey, customer } =
      await fetchPaymentSheetParams();

    const { error } = await initPaymentSheet({
      merchantDisplayName: "Raghuandh",
      customerId: customer,
      customerEphemeralKeySecret: ephemeralKey,
      paymentIntentClientSecret: paymentIntent,
      // Set `allowsDelayedPaymentMethods` to true if your business can handle payment
      //methods that complete payment after a delay, like SEPA Debit and Sofort.
      allowsDelayedPaymentMethods: true,
      defaultBillingDetails: {
        name: "Jane Doe",
      },
    });
    if (!error) {
      setLoading(true);
    }
  };

  const openPaymentSheet = async () => {
    const { error } = await presentPaymentSheet();

    if (error) {
      Alert.alert(`Error code: ${error.code}`, error.message);
    } else {
      setLoading(true);
      await fetchAPI("/(api)/subscription/create", {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          showAds: false,
          plan: "PRO",
        }),
      })
        .then(() => {
          setSuccess(true);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };
  if (loading) return <CustomLoader loading={loading} />;

  return (
    <View>
      <CustomButton
        title="Subscribe Now! - $10/month"
        className="my-[10px] bg-primary-200"
        onPress={async () => {
          await initializePaymentSheet().then(async () => {
            await openPaymentSheet();
          });
        }}
      />
      <ReactNativeModal
        isVisible={success}
        onBackdropPress={() => setSuccess(false)}
      >
        <View className="flex flex-col items-center justify-center bg-white p-7 rounded-2xl">
          <Image
            source={require("@/assets/images/order-success.png")}
            className="w-28 h-28 mt-5"
          />

          <Text className="text-2xl text-center font-JakartaBold mt-5">
            Congrats, you're now a PRO member!
          </Text>

          <Text className="text-md text-general-200 font-JakartaRegular text-center mt-3">
            Thank you for your purchase. You're now a family of PRO members!
          </Text>

          <CustomButton
            title="Back to Home"
            onPress={() => {
              setSuccess(false);
              router.push("/(root)/(tabs)/dashboard");
            }}
            className="mt-5"
          />
        </View>
      </ReactNativeModal>
    </View>
  );
};

export default Payment;
