import { View, Text, Image, TouchableOpacity } from "react-native";
import { Trash2 } from "lucide-react-native";
import { useState } from "react";
import ReactNativeModal from "react-native-modal";
import { useAuth } from "@clerk/clerk-expo";

const SavedGenerationCard = ({ id, name, imageUrl, onDelete }: any) => {
  const { userId: clerkId } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    try {
      const response = await fetch(`/(api)/saved-generation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clerkId: clerkId, id }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete generation");
      }

      // Call the onDelete callback to update the UI
      onDelete(id);
      setShowConfirm(false); // Close the confirmation modal
    } catch (error) {
      console.error("Delete error:", error);
      // Add error handling (e.g., toast message)
    }
  };

  return (
    <>
      <View className="m-4 p-4 bg-white rounded-xl shadow-lg">
        <Image
          source={{ uri: imageUrl }}
          className="w-full h-48 rounded-lg"
          resizeMode="cover"
        />
        <View className="mt-3 flex-row justify-between items-center">
          <Text className="font-rubik-medium text-lg flex-1">{name}</Text>
          <TouchableOpacity
            onPress={() => setShowConfirm(true)}
            className="p-2 ml-2"
          >
            <Trash2 size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ReactNativeModal isVisible={showConfirm}>
        <View className="bg-white p-6 rounded-xl">
          <Text className="font-rubik-bold text-lg mb-4">
            Delete Generation?
          </Text>
          <Text className="font-rubik mb-6 text-gray-400">
            Are you sure you want to delete "{name}"? This action cannot be
            undone.
          </Text>
          <View className="flex-row justify-end gap-4">
            <TouchableOpacity
              onPress={() => setShowConfirm(false)}
              className="px-4 py-2"
            >
              <Text className="font-rubik-medium text-gray-500">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              className="px-4 py-2 bg-red-500 rounded-lg"
            >
              <Text className="font-rubik-bold text-white">Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ReactNativeModal>
    </>
  );
};

export default SavedGenerationCard;
