import { GardenDashboard } from "@/types/garden";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import AnimatedProgressBar from "../UI/AnimatedProgressBar";
import CachedImage from "../CachedImage";
import { Ionicons } from "@expo/vector-icons";
import { useOverdueTasksNotifications } from "@/lib/hooks/useOverdueTasksNotifications";
import OverdueTasksModal from "../UI/OverdueTasksModal";

/**
 * GardenCard displays summary information about a garden
 * Uses color-coding to indicate the health status of plants
 * Shows indicators for plants needing care and overdue tasks
 * @param garden - The garden data to display
 * @param maxWidth - Optional max width for the health bar (for different layouts)
 */
export default function GardenCard({
  garden,
  maxWidth = 120,
}: {
  garden: GardenDashboard;
  maxWidth?: number;
}) {
  const router = useRouter();

  // State to control when to start the health bar animation
  const [startHealthAnimation, setStartHealthAnimation] =
    useState<boolean>(false);

  // State to control the visibility of the garden-specific overdue tasks modal
  const [showOverdueModal, setShowOverdueModal] = useState<boolean>(false);

  // Access the overdue tasks notifications hook
  const { hasGardenOverdueTasks, getGardenOverdueTasksCount, notifications } =
    useOverdueTasksNotifications();

  // Check if this garden has overdue tasks
  const hasOverdueTasks = hasGardenOverdueTasks(garden.garden_id);
  const overdueTasksCount = getGardenOverdueTasksCount(garden.garden_id);

  // Start health bar animation after the card is fully visible
  useEffect(() => {
    // Delay to ensure card animations are complete
    const animationTimer = setTimeout(() => {
      setStartHealthAnimation(true);
    }, 600); // 600ms delay to ensure card animations (fade/move) are complete

    return () => clearTimeout(animationTimer);
  }, []);

  // Reset and restart health animation when garden data changes
  useEffect(() => {
    setStartHealthAnimation(false);

    // Small delay to ensure the animation reset is visible
    const resetTimer = setTimeout(() => {
      setStartHealthAnimation(true);
    }, 50);

    return () => clearTimeout(resetTimer);
  }, [garden.health_percentage]);

  // Determine the garden health status color
  const getHealthStatusColor = () => {
    if (!garden.total_plants) return "#484540"; // Darker gray for better contrast
    const healthPercentage = Number(garden.health_percentage);
    if (healthPercentage >= 80) return "#5E994B"; // Darker green for better contrast - brand-600
    if (healthPercentage >= 50) return "#9e8600"; // Darker amber for better contrast - accent-500
    return "#E50000"; // Red for critical (already high contrast)
  };

  // Get the first available plant image from the garden
  const getFirstPlantImage = () => {
    if (garden.plants && garden.plants.length > 0) {
      for (const plant of garden.plants) {
        if (plant.images && plant.images.length > 0) {
          return plant.images[0];
        }
      }
    }
    return null;
  };

  // Handle the overdue task indicator being pressed
  const handleOverdueIndicatorPress = (event: any) => {
    // Prevent the parent TouchableOpacity from being triggered
    event.stopPropagation();
    setShowOverdueModal(true);
  };

  // Determine if we're on the gardens page (maxWidth = 120) vs home page (maxWidth = 90)
  const isGardensPage = maxWidth === 120;
  // Get the first plant image if we're on the gardens page
  const firstPlantImage = isGardensPage ? getFirstPlantImage() : null;

  return (
    <>
      <TouchableOpacity
        className="bg-white rounded-xl p-4"
        onPress={() =>
          router.push({
            pathname: "/(home)/gardens/[id]",
            params: { id: garden.garden_id },
          })
        }
      >
        <View className="flex-row">
          {/* Plant Image - Only shown on gardens page */}
          {isGardensPage && (
            <View className="mr-4 self-center rounded-lg overflow-hidden">
              {firstPlantImage ? (
                <CachedImage
                  uri={firstPlantImage}
                  style={{ width: 64, height: 64, borderRadius: 8 }}
                  resizeMode="cover"
                />
              ) : (
                <View className="w-16 h-16 bg-cream-100 items-center justify-center">
                  <Ionicons name="leaf-outline" size={28} color="#9e9a90" />
                </View>
              )}
            </View>
          )}

          <View className="flex-1">
            {/* Garden Name and Alert Badges */}
            <View className="flex-row justify-between items-start mb-2">
              <View className="flex-row items-center flex-1 mr-2">
                <Text className="text-lg font-semibold text-foreground flex-1 mr-2">
                  {garden.name}
                </Text>
                {/* Overdue Task Indicator Dot */}
                {hasOverdueTasks && (
                  <TouchableOpacity
                    onPress={handleOverdueIndicatorPress}
                    hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                  >
                    <View className="w-3 h-3">
                      {overdueTasksCount > 0 && (
                        <View className="absolute -top-1 -right-1 bg-destructive w-4 h-4 items-center justify-center rounded-md">
                          <Text className="text-[8px] text-cream-50 font-bold">
                            {overdueTasksCount > 9 ? "9+" : overdueTasksCount}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
              </View>
              <View className="flex-row">
                {/* Plants Needing Care Badge */}
                {garden.plants_needing_care > 0 && (
                  <View className="bg-accent-200 rounded-full px-2.5 py-1">
                    <Text className="text-xs text-accent-800 font-medium">
                      {garden.plants_needing_care} needs care
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Plant Count */}
            <Text className="text-sm text-cream-700 mb-2">
              {garden.total_plants || 0} Plants
            </Text>

            {/* Health Progress Bar and Percentage Side by Side */}
            <View className="flex-row items-center">
              <View style={{ width: maxWidth }}>
                <AnimatedProgressBar
                  percentage={
                    startHealthAnimation ? garden.health_percentage : 0
                  }
                  color={getHealthStatusColor()}
                  height={8}
                  duration={600}
                />
              </View>
              <Text className="text-sm text-cream-700 ml-2">
                {garden.health_percentage}%
              </Text>
            </View>
          </View>

          {/* Navigation arrow - Only shown on gardens page */}
          {isGardensPage && (
            <View className="justify-center ml-2">
              <Ionicons name="arrow-forward" size={22} color="#9e9a90" />
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Garden-specific overdue tasks modal */}
      <OverdueTasksModal
        isVisible={showOverdueModal}
        onClose={() => setShowOverdueModal(false)}
        notifications={notifications}
        gardenId={garden.garden_id}
      />
    </>
  );
}

const styles = StyleSheet.create({
  progressBarContainer: {
    flex: 1,
    maxWidth: "80%", // Default max width for home page
    marginRight: 8,
  },
});
