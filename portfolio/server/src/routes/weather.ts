import express from "express";
import { fetchWeatherApi } from "openmeteo";

const router = express.Router();

// Get weather data
router.get("/", async (req, res) => {
  try {
    // Default to Halifax coordinates if none provided
    const latitude = req.query.latitude
      ? parseFloat(req.query.latitude as string)
      : 44.6488;
    const longitude = req.query.longitude
      ? parseFloat(req.query.longitude as string)
      : -63.5752;

    const params = {
      latitude,
      longitude,
      hourly: "temperature_2m",
      current: ["temperature_2m", "relative_humidity_2m"],
    };

    const url = "https://api.open-meteo.com/v1/forecast";
    console.log("Fetching weather data from:", url, "with params:", params);

    const responses = await fetchWeatherApi(url, params);
    if (!responses || responses.length === 0) {
      throw new Error("No weather data received from API");
    }

    // Helper function to form time ranges
    const range = (start: number, stop: number, step: number) =>
      Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);
    const response = responses[0];

    const utcOffsetSeconds = response.utcOffsetSeconds();
    const timezone = response.timezone();
    const timezoneAbbreviation = response.timezoneAbbreviation();
    const latitude_result = response.latitude();
    const longitude_result = response.longitude();

    const current = response.current()!;
    const hourly = response.hourly()!;

    const weatherData = {
      location: {
        timezone,
        timezoneAbbreviation,
        latitude: latitude_result,
        longitude: longitude_result,
        city: "Halifax", // Default city name (would be better to use a geocoding API)
      },
      current: {
        time: new Date((Number(current.time()) + utcOffsetSeconds) * 1000),
        temperature: current.variables(0)!.value(),
        humidity: current.variables(1)!.value(),
      },
      hourly: {
        time: range(
          Number(hourly.time()),
          Number(hourly.timeEnd()),
          hourly.interval()
        ).map((t) => new Date((t + utcOffsetSeconds) * 1000)),
        temperature: hourly.variables(0)!.valuesArray()!,
      },
    };

    res.status(200).json({
      status: "success",
      data: weatherData,
    });
  } catch (error) {
    console.error("Error fetching weather data:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      status: "error",
      message: "Failed to fetch weather data",
      error:
        process.env.NODE_ENV === "development"
          ? errorMessage
          : "Weather service temporarily unavailable",
      details:
        process.env.NODE_ENV === "development"
          ? {
              name: error instanceof Error ? error.name : "Unknown",
              stack: error instanceof Error ? error.stack : undefined,
            }
          : undefined,
    });
  }
});

module.exports = router;
