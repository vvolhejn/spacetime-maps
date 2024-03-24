import { useEffect } from "react";
import { City } from "../cityData";

/**
 * A component that automatically animates the timeness when the page is loaded
 * or when the city changes to help the user understand what the timeness slider
 * does.
 */
export const TimenessAnimation = ({
  setTimeness,
  city,
}: {
  setTimeness: (timeness: number) => void;
  city: City;
}) => {
  const durationMs = 3000;
  const delayMs = 1000;
  useEffect(() => {
    const smoothSlide = () => {
      let startTime: number;
      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = timestamp - startTime;
        const newValue = Math.min(
          city.maxTimeness * (progress / durationMs),
          city.maxTimeness
        );
        setTimeness(newValue);
        if (progress < durationMs) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    };

    const timeoutId = setTimeout(smoothSlide, delayMs);

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
    };
  }, [city, setTimeness]);

  // This is a side-effect-only component, it doesn't render anything
  return null;
};
