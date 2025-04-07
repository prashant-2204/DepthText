import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Modal,
  Image,
  TextInput,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import * as MediaLibrary from "expo-media-library";
import Slider from "@react-native-community/slider";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import Canvas, { Image as CanvasImage } from "react-native-canvas";
import ColorPicker from "react-native-wheel-color-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import CustomButton from "@/components/CustomButton";
import { Upload } from "lucide-react-native";
import { useImageSegmentation } from "@/hooks/useImageSegmentation";
import { useUser } from "@clerk/clerk-expo";
import ReactNativeModal from "react-native-modal";
import InputField from "@/components/CustomInput";
import { Redirect, router } from "expo-router";
type TextLayer = {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontWeight: number;
  color: string;
  opacity: number;
  rotation: number;
};

const CreateImage = () => {
  const { user } = useUser();
  const [isSaveModalVisible, setIsSaveModalVisible] = useState(false);
  const [generationName, setGenerationName] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const {
    processImage,
    processedImageurl,
    cleanup,
    isProcessing,
    creditsLeft,
    plan,
  } = useImageSegmentation();
  const [remainingCredits, setRemainingCredits] = useState(creditsLeft);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [canvasImageUri, setCanvasImageUri] = useState("");

  const canvasRef = useRef<Canvas>(null);
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const canvasHeight = screenHeight * 0.4;
  const textLayersRef = useRef(textLayers);
  useEffect(() => {
    textLayersRef.current = textLayers;
  }, [textLayers]);

  const handleAddTextLayer = () => {
    const newLayer: TextLayer = {
      id: Math.random().toString(),
      text: "New Text Layer",
      x: 50,
      y: 50,
      fontSize: 48,
      fontWeight: 400,
      color: "#000000",
      opacity: 1,
      rotation: 0,
    };
    setTextLayers([...textLayers, newLayer]);
    setSelectedLayerId(newLayer.id);
  };
  const updateLayer = (id: string, updates: Partial<TextLayer>) => {
    setTextLayers((layers) =>
      layers.map((layer) =>
        layer.id === id ? { ...layer, ...updates } : layer
      )
    );
  };

  const drawOnCanvas = useCallback(
    async (layers: TextLayer[]) => {
      if (!canvasRef.current || !imageUrl || !processedImageurl) return;

      try {
        const ctx = canvasRef.current.getContext("2d");
        const img = new CanvasImage(canvasRef.current);
        const img_2 = new CanvasImage(canvasRef.current);

        canvasRef.current.width = screenWidth;
        canvasRef.current.height = canvasHeight;

        const [originalBase64, processedBase64] = await Promise.all([
          FileSystem.readAsStringAsync(imageUrl, {
            encoding: FileSystem.EncodingType.Base64,
          }),
          FileSystem.readAsStringAsync(processedImageurl, {
            encoding: FileSystem.EncodingType.Base64,
          }),
        ]);

        const imgLoaded = new Promise((resolve) =>
          img.addEventListener("load", resolve)
        );
        const img2Loaded = new Promise((resolve) =>
          img_2.addEventListener("load", resolve)
        );

        img.src = `data:image/png;base64,${processedBase64}`;
        img_2.src = `data:image/png;base64,${originalBase64}`;

        await Promise.all([imgLoaded, img2Loaded]);

        const ratio = Math.min(
          screenWidth / img_2.width,
          canvasHeight / img_2.height
        );
        const displayWidth = img_2.width * ratio;
        const displayHeight = img_2.height * ratio;

        ctx.clearRect(0, 0, screenWidth, canvasHeight);

        // Draw original image
        ctx.drawImage(
          img_2,
          (screenWidth - displayWidth) / 2,
          (canvasHeight - displayHeight) / 2,
          displayWidth,
          displayHeight
        );

        // Draw text layers
        layers.forEach((layer) => {
          ctx.save();
          ctx.translate(layer.x, layer.y);
          ctx.rotate((layer.rotation * Math.PI) / 180);
          ctx.font = `${layer.fontWeight} ${layer.fontSize}px Arial`;
          ctx.fillStyle = layer.color;
          ctx.globalAlpha = layer.opacity;
          ctx.fillText(layer.text, 0, 0);
          ctx.restore();
        });

        // Draw processed image
        ctx.drawImage(
          img,
          (screenWidth - displayWidth) / 2,
          (canvasHeight - displayHeight) / 2,
          displayWidth,
          displayHeight
        );
      } catch (error) {
        console.error("Error drawing image:", error);
      }
    },
    [imageUrl, processedImageurl, screenWidth, canvasHeight]
  );

  const captureCanvasImage = async () => {
    if (!canvasRef.current) return;
    try {
      const imageData = await canvasRef.current.toDataURL();
      setCanvasImageUri(imageData);
    } catch (error) {
      console.error("Error capturing canvas image:", error);
    }
  };

  const toggleFullScreen = async () => {
    if (!isFullScreen) await captureCanvasImage();
    setIsFullScreen(!isFullScreen);
  };

  useEffect(() => {
    drawOnCanvas(textLayers); // Pass current text layers explicitly
  }, [drawOnCanvas, processedImageurl, textLayers]); // Keep textLayers in dependencies

  const handleSliderChange = (value: number, property: keyof TextLayer) => {
    if (!selectedLayerId) return;
    const updatedLayers = textLayers.map((layer) => {
      if (layer.id === selectedLayerId) {
        return { ...layer, [property]: value };
      }
      return layer;
    });

    setTextLayers(updatedLayers);
    textLayersRef.current = updatedLayers;
    requestAnimationFrame(() => drawOnCanvas(updatedLayers));
  };

  const handleImageUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      try {
        await processImage(result.assets[0].uri)
          .then((res) => {
            setImageUrl(result.assets[0].uri);
            setRemainingCredits(res?.creditsLeft);
          })
          .catch((err) => {
            console.log(err);
          });
      } catch (error) {
        console.error("Image processing failed:", error);
      }
    }
  };
  const handleDownload = async () => {
    if (!canvasRef.current || !imageUrl || !processedImageurl) {
      Alert.alert("Error", "Please process an image first");
      return;
    }

    try {
      await drawOnCanvas(textLayersRef.current);

      const dataUrl = await canvasRef.current.toDataURL();
      const base64Data = dataUrl.split(",")[1];

      if (!base64Data) {
        Alert.alert("Error", "Failed to capture canvas image");
        return;
      }

      // Create unique filename and path in Downloads directory
      const filename = `edited-image-${Date.now()}.png`;
      const fileUri = FileSystem.documentDirectory + filename;

      // Check Android storage permission
      if (Platform.OS === "android") {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Required",
            "Please allow storage access to save the image."
          );
          return;
        }
      }

      // Write base64 data to Downloads directory
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Verify file creation
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        Alert.alert("Error", "Failed to create image file");
        return;
      }

      // Save to media library (optional)
      const { status: mediaStatus } =
        await MediaLibrary.requestPermissionsAsync();
      if (mediaStatus === "granted") {
        await MediaLibrary.createAssetAsync(fileUri);
        Alert.alert("Success", "Image saved to Downloads and Gallery");
      } else {
        Alert.alert(
          "Permission Required",
          "Please enable photo library access in settings"
        );
      }
    } catch (error: any) {
      console.error("Download error:", error);
      Alert.alert(
        "Download Failed",
        error.message || "Failed to save image. Please try again."
      );
    }
  };
  // Add these handler functions
  const handleSavePress = async () => {
    if (!canvasRef.current)
      return Alert.alert(
        "Please load the image",
        "Please process the image first."
      );
    try {
      const dataUrl = await canvasRef.current.toDataURL();
      const base64Data = dataUrl.split(",")[1];
      const filename = `temp-image-${Date.now()}.png`;
      const fileUri = FileSystem.documentDirectory + filename;

      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      setCanvasImageUri(fileUri); // Save file URI instead of data URL
      setIsSaveModalVisible(true);
    } catch (error) {
      console.error("Error capturing image:", error);
      Alert.alert("Error", "Failed to prepare image for saving");
    }
  };
  const handleSaveGeneration = async () => {
    if (!generationName.trim() || !canvasImageUri || !user) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    try {
      // Convert file URI to base64
      setSaveLoading(true);
      const base64 = await FileSystem.readAsStringAsync(canvasImageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const response = await fetch("/(api)/save-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64, // Send base64 directly
          name: generationName,
          clerkId: user.id,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to save generation");
      }

      Alert.alert("Success", "Generation saved successfully!");
      setIsSaveModalVisible(false);
      setGenerationName("");
      // Delete temp file after success
      await FileSystem.deleteAsync(canvasImageUri);
      setSaveLoading(false);
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Error", "Failed to save generation");
      setSaveLoading(false);
    }
  };

  const selectedLayer = textLayers.find(
    (layer) => layer.id === selectedLayerId
  );
  // Add this function inside the component
  const handleDeleteLayer = (layerId: string) => {
    setTextLayers((layers) => {
      const newLayers = layers.filter((layer) => layer.id !== layerId);
      // Clear selection if deleted layer was selected
      if (selectedLayerId === layerId) {
        setSelectedLayerId(newLayers[0]?.id || null);
      }
      return newLayers;
    });
  };
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerClassName="flex-grow pb-24">
        {/* canvas section*/}
        <View
          className="justify-center items-center border-b border-gray-400"
          style={{ height: canvasHeight }}
        >
          {isProcessing ? (
            <View className="absolute inset-0 justify-center items-center bg-white bg-opacity-90">
              <ActivityIndicator size={"large"} color={"#7E60BF"} />
              <Text className="mt-2 text-gray-700 text-base">
                Processing Image ...
              </Text>
            </View>
          ) : processedImageurl ? (
            <>
              <Canvas
                ref={canvasRef}
                style={{
                  width: screenWidth,
                  height: canvasHeight,
                  backgroundColor: "#F3F4F6",
                }}
              />
              <TouchableOpacity
                className="absolute top-3 right-3 text-primary-100 p-2 bg-white/80 rounded-full"
                onPress={toggleFullScreen}
              >
                <Ionicons name="expand" size={24} color={"#7E60BF"} />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              className="bg-primary py-3 px-6 rounded-lg shadow-md flex-row gap-[5px]
            
            "
              onPress={handleImageUpload}
              disabled={isProcessing}
            >
              <Text className="text-white text-lg font-semibold">
                Upload Image
              </Text>
              <Upload className="size-3" color={"white"} />
            </TouchableOpacity>
          )}
        </View>
        <Modal visible={isFullScreen} transparent={false} animationType="slide">
          <View className="flex-1 justify-center items-center bg-black">
            <TouchableOpacity
              className="absolute top-10 right-5 p-2 bg-white/80 rounded-full z-10"
              onPress={toggleFullScreen}
            >
              <Ionicons name="exit" size={24} color={"#7E60BF"} />
            </TouchableOpacity>
            {canvasImageUri ? (
              <Image
                source={{ uri: canvasImageUri }}
                className="w-full h-full"
                resizeMode="contain"
              />
            ) : (
              <Text className="text-white text-base">
                No canvas image available
              </Text>
            )}
          </View>
        </Modal>
        {/* Controls Section */}
        <View className="p-4">
          {processedImageurl && (
            <>
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-semibold text-gray-900">
                  Text Layers
                </Text>
                <TouchableOpacity
                  className="bg-primary-200 py-2 px-3 rounded"
                  onPress={handleAddTextLayer}
                >
                  <Text className="text-white text-sm font-medium">
                    Load the image & Add Text Layer +
                  </Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                className="mb-4"
                showsHorizontalScrollIndicator={false}
              >
                {textLayers.map((layer) => (
                  <TouchableOpacity
                    key={layer.id}
                    onPress={() => setSelectedLayerId(layer.id)}
                    className={`p-3 mx-1 rounded-lg relative  ${
                      selectedLayerId === layer.id
                        ? "bg-primary-100 text-white"
                        : "bg-gray-200"
                    }`}
                    style={{ minWidth: 100 }}
                  >
                    {/* Delete Button */}
                    <TouchableOpacity
                      className="absolute -top-0 -right-0 p-[1px] bg-red-500 rounded-full z-10"
                      onPress={() => handleDeleteLayer(layer.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="close" size={16} color="white" />
                    </TouchableOpacity>
                    <Text
                      className={`text-sm ${
                        selectedLayerId === layer.id
                          ? "text-white"
                          : "text-black"
                      }`}
                      numberOfLines={1}
                    >
                      {layer.text || "New Layer"}
                    </Text>
                    <Text
                      className={`text-xs ${
                        selectedLayerId === layer.id
                          ? "text-white"
                          : "text-gray-400"
                      } mt-1`}
                    >
                      Layer {textLayers.indexOf(layer) + 1}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {selectedLayer && (
                <View className="space-y-4 bg-gray-100 p-4 rounded-lg">
                  <Text className="text-base font-semibold text-gray-900">
                    Editing: "{selectedLayer.text}"
                  </Text>
                  {/* Text Input for Layer Content */}
                  <TextInput
                    className="border border-gray-300 p-2 rounded bg-white"
                    value={selectedLayer.text}
                    onChangeText={(text) =>
                      updateLayer(selectedLayer.id, { text })
                    }
                    placeholder="Enter text here"
                    selectionColor="#7E60BF"
                  />

                  {/* Sliders and Controls */}
                  {[
                    {
                      prop: "x",
                      label: "X Position",
                      min: 0,
                      max: screenWidth,
                    },
                    {
                      prop: "y",
                      label: "Y Position",
                      min: 0,
                      max: canvasHeight,
                    },
                    { prop: "fontSize", label: "Font Size", min: 12, max: 100 },
                    {
                      prop: "fontWeight",
                      label: "Font Weight",
                      min: 100,
                      max: 900,
                      step: 100,
                    },
                    {
                      prop: "opacity",
                      label: "Opacity",
                      min: 0,
                      max: 1,
                      step: 0.1,
                    },
                    { prop: "rotation", label: "Rotation", min: 0, max: 360 },
                  ].map(({ prop, label, min, max, step = 1 }) => (
                    <View key={prop} className="space-y-2">
                      <Text className="text-gray-700 font-medium">
                        {label}: {selectedLayer[prop as keyof TextLayer]}
                        {prop === "rotation" && "°"}
                      </Text>
                      <Slider
                        minimumValue={min}
                        maximumValue={max}
                        step={step}
                        value={selectedLayer[prop as keyof TextLayer] as number}
                        onValueChange={(value) =>
                          handleSliderChange(value, prop as keyof TextLayer)
                        }
                        minimumTrackTintColor="#7E60BF"
                        maximumTrackTintColor="#e0e0e0"
                      />
                    </View>
                  ))}

                  <View>
                    <Text className="text-gray-700">Text Color</Text>
                    <ColorPicker
                      color={selectedLayer.color}
                      onColorChangeComplete={(color) =>
                        updateLayer(selectedLayer.id, { color })
                      }
                      thumbSize={30}
                      sliderSize={30}
                      noSnap
                      row={false}
                      swatches={false}
                    />
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-400 px-2 py-3">
        <View className="flex-row gap-2">
          <CustomButton
            disabled={isProcessing}
            textVariant="default"
            title="Download"
            onPress={handleDownload}
            IconLeft={() => (
              <Ionicons name="download-outline" size={24} color={"white"} />
            )}
            className="flex-1 bg-primary-200"
          />
          <CustomButton
            disabled={isProcessing}
            textVariant="default"
            title="Save"
            onPress={handleSavePress}
            IconLeft={() => (
              <Ionicons name="cloud-upload-outline" size={24} color={"white"} />
            )}
            className="flex-1 bg-primary-100"
          />
        </View>
      </View>
      <ReactNativeModal isVisible={isSaveModalVisible}>
        <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px]">
          <Text className="font-rubik text-3xl text-center mb-4">
            Save Generation
          </Text>
          <InputField
            className="border border-gray-300 p-2 rounded mb-4"
            placeholder="Enter generation name"
            value={generationName}
            onChangeText={setGenerationName}
          />

          <CustomButton
            title="Submit"
            onPress={handleSaveGeneration}
            className="bg-primary-200 disabled:bg-primary-200/50"
            disabled={saveLoading}
            loading={saveLoading}
          />
          {!saveLoading && (
            <CustomButton
              title="Cancel"
              onPress={() => setIsSaveModalVisible(false)}
              className="mt-2 bg-gray-300 disabled:bg-gray-200"
              disabled={saveLoading}
            />
          )}
        </View>
      </ReactNativeModal>
    </SafeAreaView>
  );
};

export default CreateImage;
