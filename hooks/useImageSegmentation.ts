import { CustomLoader } from "@/components/CustomLoader";
import { useState } from "react";
import * as FileSuystem from "expo-file-system";
import { useUser } from "@clerk/clerk-expo";
import { useFetch } from "@/lib/fetch";
import { Redirect, router } from "expo-router";
export function useImageSegmentation() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImageurl, setProcessedImageUrl] = useState<string | null>();
  const [creditsLeft, setCreditsLeft] = useState(0);
  const [plan, setPlan] = useState("");
  const { user } = useUser();
  const { data, loading, error } = useFetch<any>(`/(api)/user/${user?.id}`);
  const processImage = async (imageUrl: string) => {
    if (data?.plan === "FREE" && data?.creditsLeft === 0) {
      router.push("/(root)/(no-tabs)/subscribe");
      return;
    }

    const base64Image = await FileSuystem.readAsStringAsync(imageUrl, {
      encoding: FileSuystem.EncodingType.Base64,
    });
    setIsProcessing(true);
    try {
      const resposne = await fetch("/(api)/imageSegmentation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64Image,
          clerkId: user?.id,
        }),
      });
      if (!resposne.ok) {
        throw new Error(`HTTPS error! Status: ${resposne.status}`);
      }
      const result = await resposne.json();
      const creditsLeft = result.creditsLeft;
      const plan = result.plan;
      setPlan(plan);
      setCreditsLeft(creditsLeft);
      const base64Data = result.data;
      const uri = `${FileSuystem.documentDirectory}processed-${Date.now()}.png`;
      await FileSuystem.writeAsStringAsync(uri, base64Data, {
        encoding: FileSuystem.EncodingType.Base64,
      });
      setProcessedImageUrl(uri);
      return { uri, creditsLeft };
    } catch (error) {
      console.log(error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };
  const cleanup = () => {
    if (processedImageurl) {
      FileSuystem.deleteAsync(processedImageurl);
      setProcessedImageUrl(null);
    }
  };
  return {
    processImage,
    processedImageurl,
    isProcessing,
    cleanup,
    creditsLeft,
    plan,
  };
}
